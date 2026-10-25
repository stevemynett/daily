// Live data for the home page, fetched server-side because these sites don't
// allow browser requests from daily.skm. Each result is cached briefly.
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36';

function cached(ttl, load) {
  let value = null;
  let at = 0;
  return async () => {
    if (!value || Date.now() - at > ttl) {
      value = await load();
      at = Date.now();
    }
    return value;
  };
}

const num = (text) => Number(String(text).replace(/[$,%]/g, ''));

async function nasdaq(path) {
  const res = await fetch(`https://api.nasdaq.com/api/quote/${path}`, { headers: { 'user-agent': UA, accept: 'application/json' } });
  if (!res.ok) throw new Error(`nasdaq ${path} ${res.status}`);
  return (await res.json()).data;
}

// "9:45 AM ET" -> minutes after midnight
function minutes(label) {
  const [, h, m, ampm] = label.match(/(\d+):(\d+) (AM|PM)/) ?? [];
  return ((Number(h) % 12) + (ampm === 'PM' ? 12 : 0)) * 60 + Number(m);
}

// Price and regular-session points as % change from the previous close
async function quote(symbol, assetclass, name) {
  const data = await nasdaq(`${symbol}/chart?assetclass=${assetclass}`);
  const previousClose = num(data.previousClose);
  const points = (data.chart ?? [])
    .filter((p) => {
      const t = minutes(p.z.dateTime);
      return t >= 570 && t <= 960;
    })
    .map((p) => ({ time: p.z.dateTime.replace(' ET', ''), minute: minutes(p.z.dateTime), percent: (p.y / previousClose - 1) * 100 }))
    // The index chart comes back rotated (afternoon first), so put it in time order
    .sort((a, b) => a.minute - b.minute);
  return {
    symbol,
    name,
    price: num(data.lastSalePrice),
    change: num(data.netChange),
    percent: num(data.percentageChange),
    previousClose,
    asOf: data.timeAsOf,
    points,
  };
}

export const markets = cached(30_000, async () => {
  const [chime, nasdaqComposite, info] = await Promise.all([
    quote('CHYM', 'stocks', 'Chime'),
    quote('COMP', 'index', 'Nasdaq Composite'),
    nasdaq('COMP/info?assetclass=index'),
  ]);
  return { updatedAt: new Date().toISOString(), marketStatus: info.marketStatus, quotes: [chime, nasdaqComposite] };
});

// What's down right now, from official status pages. A service only shows up
// when it has an open incident that affects users.
const STATUSPAGES = {
  GitHub: 'www.githubstatus.com',
  OpenAI: 'status.openai.com',
  Claude: 'status.anthropic.com',
  Cloudflare: 'www.cloudflarestatus.com',
  Discord: 'discordstatus.com',
  Zoom: 'status.zoom.us',
  Atlassian: 'status.atlassian.com',
  Reddit: 'www.redditstatus.com',
  Dropbox: 'status.dropbox.com',
  Notion: 'www.notion-status.com',
  Figma: 'status.figma.com',
  Linear: 'linearstatus.com',
  '1Password': 'status.1password.com',
  Vercel: 'www.vercel-status.com',
  Netlify: 'www.netlifystatus.com',
  npm: 'status.npmjs.org',
  Docker: 'www.dockerstatus.com',
  DigitalOcean: 'status.digitalocean.com',
  Supabase: 'status.supabase.com',
  Cursor: 'status.cursor.com',
  Twitch: 'status.twitch.com',
  'Epic Games': 'status.epicgames.com',
  Box: 'status.box.com',
};

const LEVEL = { critical: 'Down', major: 'Down', minor: 'Degraded' };

async function getJson(url, decode) {
  const res = await fetch(url, { headers: { 'user-agent': UA }, signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`${url} ${res.status}`);
  return decode ? JSON.parse(decode(Buffer.from(await res.arrayBuffer()))) : res.json();
}

async function statuspage(service, host) {
  const data = await getJson(`https://${host}/api/v2/summary.json`);
  // Pages hosted on incident.io leave out incidents; use the overall status
  if (!data.incidents) {
    const level = LEVEL[data.status.indicator];
    return level ? [{ service, title: data.status.description, level, since: null, url: `https://${host}` }] : [];
  }
  return data.incidents
    .filter((i) => LEVEL[i.impact])
    .map((i) => ({
      service,
      title: i.name,
      level: i.status === 'monitoring' ? 'Recovering' : LEVEL[i.impact],
      since: i.created_at,
      url: i.shortlink ?? `https://${host}/incidents/${i.id}`,
    }));
}

async function slack() {
  const data = await getJson('https://slack-status.com/api/v2.0.0/current');
  return data.active_incidents.map((i) => ({
    service: 'Slack',
    title: i.title,
    level: i.type === 'outage' ? 'Down' : 'Degraded',
    since: i.date_created,
    url: i.url ?? 'https://slack-status.com',
  }));
}

async function google(service, url) {
  const data = await getJson(url);
  return data
    .filter((i) => !i.end)
    .map((i) => ({
      service: `${service}: ${i.service_name}`,
      title: i.external_desc,
      level: i.severity === 'high' ? 'Down' : 'Degraded',
      since: i.begin,
      url: `${new URL(url).origin}/${i.uri}`,
    }));
}

// Only US, Canada and global events; other regions have long-running events
// that don't matter here
async function aws() {
  // Served as UTF-16 big-endian with a byte order mark
  const data = await getJson('https://health.aws.amazon.com/public/currentevents', (buf) =>
    Buffer.from(buf).swap16().toString('utf16le').replace(/^\uFEFF/, ''),
  );
  return data
    .filter((e) => /^arn:aws:health:(us-|ca-|global|:)/.test(e.arn))
    .map((e) => ({
      service: `AWS: ${e.service_name}`,
      title: `${e.summary} (${e.region_name})`,
      level: 'Degraded',
      since: new Date(Number(e.date) * 1000).toISOString(),
      url: 'https://health.aws.amazon.com/health/status',
    }));
}

async function apple() {
  const data = await getJson('https://www.apple.com/support/systemstatus/data/system_status_en_US.js');
  return data.services.flatMap((s) =>
    s.events
      .filter((e) => e.eventStatus !== 'resolved' && e.eventStatus !== 'completed')
      .map((e) => ({
        service: `Apple: ${s.serviceName}`,
        title: e.message,
        level: e.statusType === 'Outage' ? 'Down' : 'Degraded',
        since: new Date(e.epochStartDate).toISOString(),
        url: 'https://www.apple.com/support/systemstatus/',
      })),
  );
}

const ORDER = { Down: 0, Degraded: 1, Recovering: 2 };

export const outages = cached(2 * 60_000, async () => {
  const checks = [
    ...Object.entries(STATUSPAGES).map(([service, host]) => [service, () => statuspage(service, host)]),
    ['Slack', slack],
    ['Google Workspace', () => google('Google Workspace', 'https://www.google.com/appsstatus/dashboard/incidents.json')],
    ['Google Cloud', () => google('Google Cloud', 'https://status.cloud.google.com/incidents.json')],
    ['AWS', aws],
    ['Apple', apple],
  ];
  const results = await Promise.allSettled(checks.map(([, check]) => check()));
  const items = results
    .flatMap((r) => (r.status === 'fulfilled' ? r.value : []))
    .sort((a, b) => ORDER[a.level] - ORDER[b.level] || (b.since ?? '').localeCompare(a.since ?? ''));
  return {
    updatedAt: new Date().toISOString(),
    checked: checks.map(([name]) => name),
    failed: checks.filter((_, i) => results[i].status === 'rejected').map(([name]) => name),
    items,
  };
});
