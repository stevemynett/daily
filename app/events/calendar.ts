import ical from 'node-ical';

const TZ = 'America/Vancouver';
const DAYS = 14;

export type CalendarEvent = { title: string; start: Date; end: Date; allDay: boolean; location?: string };

function text(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object' && 'val' in value) return String(value.val);
  return '';
}

// Fetches the iCal feed in ICAL_URL and expands events over the next DAYS days
export async function loadCalendar(): Promise<CalendarEvent[] | null> {
  const url = process.env.ICAL_URL;
  if (!url) return null;

  const from = new Date();
  from.setHours(0, 0, 0, 0);
  const to = new Date(from.getTime() + DAYS * 86_400_000);

  const data = await ical.async.fromURL(url);
  const events: CalendarEvent[] = [];
  for (const item of Object.values(data)) {
    if (item?.type !== 'VEVENT') continue;
    for (const e of ical.expandRecurringEvent(item, { from, to, expandOngoing: true })) {
      events.push({
        title: text(e.summary),
        start: e.start,
        end: e.end,
        allDay: e.isFullDay,
        location: text(e.event.location) || undefined,
      });
    }
  }
  return events.sort((a, b) => a.start.getTime() - b.start.getTime());
}

export function dayKey(event: CalendarEvent) {
  return event.start.toLocaleDateString('en-CA', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    ...(event.allDay ? {} : { timeZone: TZ }),
  });
}

export function timeRange(event: CalendarEvent) {
  if (event.allDay) return 'All day';
  const fmt = (d: Date) => d.toLocaleTimeString('en-CA', { hour: 'numeric', minute: '2-digit', timeZone: TZ });
  return `${fmt(event.start)} to ${fmt(event.end)}`;
}
