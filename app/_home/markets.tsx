'use client';

import { useEffect, useRef, useState } from 'react';

type Point = { time: string; minute: number; percent: number };
type Quote = {
  symbol: string;
  name: string;
  price: number;
  change: number;
  percent: number;
  asOf: string;
  points: Point[];
};
type Markets = { updatedAt: string; marketStatus: string; quotes: Quote[] };

const SHARES = 24283;
const RATE_URL = 'https://www.bankofcanada.ca/valet/observations/FXUSDCAD/json?recent=1';

const OPEN = 570; // 9:30 a.m. ET
const CLOSE = 960; // 4:00 p.m. ET
const HEIGHT = 170;
const PAD = { top: 12, right: 64, bottom: 22, left: 40 };

const signed = (n: number, digits = 2) => `${n > 0 ? '+' : n < 0 ? '−' : ''}${Math.abs(n).toFixed(digits)}`;
const money = (n: number, currency = 'USD') =>
  n.toLocaleString('en-CA', { style: 'currency', currency, currencyDisplay: 'narrowSymbol', maximumFractionDigits: 0 });
const arrow = (n: number) => (n > 0 ? '▲' : n < 0 ? '▼' : '•');

const day = (asOf: string) => asOf.split(' ').slice(0, 3).join(' ');
const pct = (n: number) => `${Math.abs(n).toFixed(2)}%`;
const updown = (n: number) => (n >= 0 ? 'up' : 'down');

// Splits today's move into the part the market explains (Chime moving the same % as the
// Nasdaq) and the part that's Chime's own
function narrative(chime: Quote, market: Quote) {
  if (day(chime.asOf) !== day(market.asOf)) {
    return `Chime's latest price is from ${day(chime.asOf)} and the Nasdaq's is from ${day(market.asOf)}, so they can't be compared yet.`;
  }
  const open = chime.price - chime.change;
  const marketDollars = open * (market.percent / 100) * SHARES;
  const ownDollars = chime.change * SHARES - marketDollars;
  const gap = chime.percent - market.percent;
  const lead = `Chime is ${updown(chime.percent)} ${pct(chime.percent)} and the Nasdaq is ${updown(market.percent)} ${pct(market.percent)}.`;
  const split = `If Chime had matched the market your shares would be ${updown(marketDollars)} ${money(Math.abs(marketDollars))}; the other ${money(Math.abs(ownDollars))} ${ownDollars >= 0 ? 'gain' : 'loss'} is Chime's own.`;

  if (Math.abs(gap) < 0.5) {
    return `${lead} Chime is moving with the market, so today is about the market, not the company.`;
  }
  if (Math.sign(chime.percent) !== Math.sign(market.percent) || Math.abs(market.percent) < 0.25) {
    return `${lead} The market isn't driving this. Chime is ${gap > 0 ? 'ahead of' : 'behind'} the Nasdaq by ${gap.toFixed(2).replace('-', '')} points, so it's company news or Chime-specific selling or buying. ${split}`;
  }
  const share = Math.round((market.percent / chime.percent) * 100);
  return share >= 100
    ? `${lead} The market is pulling Chime ${updown(market.percent)}, and Chime is lagging that move by ${Math.abs(gap).toFixed(2)} points, which is company-specific. ${split}`
    : `${lead} The market explains about ${share}% of the move; Chime is moving ${Math.abs(gap).toFixed(2)} points further on its own. ${split}`;
}

function ticks(min: number, max: number) {
  const step = [0.25, 0.5, 1, 2, 5, 10].find((s) => (max - min) / s <= 4) ?? 10;
  const out = [];
  for (let t = Math.ceil(min / step) * step; t <= max + 1e-9; t += step) out.push(Number(t.toFixed(2)));
  return out;
}

function nearest(points: Point[], minute: number) {
  return points.reduce<Point | null>(
    (best, p) => (!best || Math.abs(p.minute - minute) < Math.abs(best.minute - minute) ? p : best),
    null,
  );
}

// % change from the previous close through the regular session, one shared axis
function Chart({ quotes }: { quotes: Quote[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(600);
  const [hover, setHover] = useState<number | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  const all = quotes.flatMap((q) => q.points.map((p) => p.percent));
  const tickValues = ticks(Math.min(0, ...all), Math.max(0, ...all));
  const lo = Math.min(tickValues[0], ...all);
  const hi = Math.max(tickValues.at(-1)!, ...all);
  const x = (m: number) => PAD.left + ((m - OPEN) / (CLOSE - OPEN)) * (width - PAD.left - PAD.right);
  const y = (v: number) => PAD.top + ((hi - v) / (hi - lo || 1)) * (HEIGHT - PAD.top - PAD.bottom);
  const path = (points: Point[]) => points.map((p, i) => `${i ? 'L' : 'M'}${x(p.minute).toFixed(1)},${y(p.percent).toFixed(1)}`).join('');

  function move(e: React.PointerEvent<SVGSVGElement>) {
    const box = e.currentTarget.getBoundingClientRect();
    const minute = OPEN + (((e.clientX - box.left) * (width / box.width) - PAD.left) / (width - PAD.left - PAD.right)) * (CLOSE - OPEN);
    setHover(Math.min(CLOSE, Math.max(OPEN, minute)));
  }

  const hovered = hover === null ? null : quotes.map((q) => ({ q, p: nearest(q.points, hover) }));

  return (
    <figure className="market-chart">
      <figcaption className="market-readout">
        {hovered ? (
          <>
            <strong>{hovered[0].p?.time ?? hovered[1].p?.time} ET</strong>{' '}
            {hovered.map(({ q, p }) => p && `${q.name} ${signed(p.percent)}%`).filter(Boolean).join(', ')}
          </>
        ) : (
          <span className="market-legend">
            {quotes.map((q, i) => (
              <span key={q.symbol}>
                <i data-series={i} /> {q.name}
              </span>
            ))}
            <span className="muted">change since the previous close</span>
          </span>
        )}
      </figcaption>
      <div ref={ref}>
        <svg
          width={width}
          height={HEIGHT}
          onPointerMove={move}
          onPointerLeave={() => setHover(null)}
          role="img"
          aria-label={quotes.map((q) => `${q.name} ${signed(q.percent)}%`).join(', ')}
        >
          {tickValues.map((t) => (
            <g key={t} className={t === 0 ? 'market-zero' : 'market-grid'}>
              <line x1={PAD.left} x2={width - PAD.right} y1={y(t)} y2={y(t)} />
              <text x={PAD.left - 6} y={y(t)} dy="0.32em" textAnchor="end">
                {signed(t, t % 1 ? 2 : 0)}%
              </text>
            </g>
          ))}
          {[OPEN, 720, 840, CLOSE].map((m) => (
            <text key={m} className="market-axis" x={x(m)} y={HEIGHT - 4} textAnchor={m === OPEN ? 'start' : m === CLOSE ? 'end' : 'middle'}>
              {m === OPEN ? '9:30' : m === CLOSE ? '4:00' : `${(m / 60) % 12 || 12}:00`}
            </text>
          ))}
          {quotes.map((q, i) => (
            <g key={q.symbol} data-series={i}>
              <path className="market-line" d={path(q.points)} />
              {q.points.length > 0 && (
                <text className="market-label" x={x(q.points.at(-1)!.minute) + 6} y={y(q.points.at(-1)!.percent)} dy="0.32em">
                  {q.symbol === 'COMP' ? 'Nasdaq' : q.name}
                </text>
              )}
            </g>
          ))}
          {hovered && (
            <g>
              <line className="market-crosshair" x1={x(hover!)} x2={x(hover!)} y1={PAD.top} y2={HEIGHT - PAD.bottom} />
              {hovered.map(
                ({ q, p }, i) =>
                  p && <circle key={q.symbol} data-series={i} className="market-dot" cx={x(p.minute)} cy={y(p.percent)} r={4} />,
              )}
            </g>
          )}
        </svg>
      </div>
    </figure>
  );
}

// Polls the runner, which proxies Nasdaq's quote API (15-minute delayed)
export default function Markets() {
  const [data, setData] = useState<Markets | null>(null);
  const [failed, setFailed] = useState(false);
  const [usdCad, setUsdCad] = useState<number | null>(null);

  useEffect(() => {
    fetch(RATE_URL)
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data: { observations: { FXUSDCAD: { v: string } }[] }) => setUsdCad(Number(data.observations[0].FXUSDCAD.v)))
      .catch(() => {});
  }, []);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    async function load() {
      try {
        const res = await fetch('/api/markets');
        if (!res.ok) throw new Error();
        const next: Markets = await res.json();
        setData(next);
        setFailed(false);
        if (next.marketStatus === 'Open') timer = setTimeout(load, 60_000);
      } catch {
        setFailed(true);
      }
    }
    load();
    return () => clearTimeout(timer);
  }, []);

  if (failed && !data) return <p className="muted">Market data isn't available. The runner may be off (`make install-runner`).</p>;
  if (!data) return <p className="muted">Loading markets…</p>;

  const [chime, market] = data.quotes;
  const updated = new Date(data.updatedAt).toLocaleTimeString('en-CA', { hour: 'numeric', minute: '2-digit' }).replace(/\.$/, '');

  return (
    <div className="markets">
      <div className="market-tiles">
        <div className="market-tile">
          <span className="market-name">
            Chime <span className="muted">CHYM</span>
          </span>
          <span className="market-price">${chime.price.toFixed(2)}</span>
          <span className="market-change" data-direction={Math.sign(chime.percent)}>
            {arrow(chime.percent)} {signed(chime.change)} ({signed(chime.percent)}%)
          </span>
        </div>
        <div className="market-tile">
          <span className="market-name">
            My shares <span className="muted">USD</span>
          </span>
          <span className="market-price">{money(chime.price * SHARES)}</span>
          <span className="market-change" data-direction={Math.sign(chime.change)}>
            {arrow(chime.change)} {chime.change < 0 ? '−' : '+'}
            {money(Math.abs(chime.change * SHARES))} today
          </span>
        </div>
        <div className="market-tile">
          <span className="market-name">
            My shares <span className="muted">CAD</span>
          </span>
          <span className="market-price">{usdCad ? money(chime.price * SHARES * usdCad, 'CAD') : '…'}</span>
          {usdCad && (
            <span className="market-change" data-direction={Math.sign(chime.change)}>
              {arrow(chime.change)} {chime.change < 0 ? '−' : '+'}
              {money(Math.abs(chime.change * SHARES * usdCad), 'CAD')} today
            </span>
          )}
        </div>
      </div>
      <p className="market-verdict">{narrative(chime, market)}</p>
      <Chart quotes={data.quotes} />
      <p className="muted market-meta">
        Market {data.marketStatus.toLowerCase()}. Prices from Nasdaq, delayed about 15 minutes. Checked {updated}.
      </p>
    </div>
  );
}
