import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const INSTRUMENTS: Record<string, string> = {
  as: 'Alto sax',
  ts: 'Tenor sax',
  ss: 'Soprano sax',
  bs: 'Baritone sax',
  sax: 'Sax',
  tp: 'Trumpet',
  tb: 'Trombone',
  'bass tb': 'Bass trombone',
  'french horn': 'French horn',
  tuba: 'Tuba',
  cl: 'Clarinet',
  'bass cl': 'Bass clarinet',
  bcl: 'Bass clarinet',
  flh: 'Flugelhorn',
  fl: 'Flute',
  p: 'Piano',
  keys: 'Keys',
  Rhodes: 'Rhodes',
  org: 'Organ',
  g: 'Guitar',
  b: 'Bass',
  d: 'Drums',
  perc: 'Percussion',
  vib: 'Vibraphone',
  voc: 'Vocals',
  vln: 'Violin',
  vla: 'Viola',
  cello: 'Cello',
  electronics: 'Electronics',
};

export type Musician = { name: string; instruments: string[] };
export type Show = {
  year: string;
  date: string;
  venue: string;
  band: string;
  musicians: Musician[];
  likely: boolean;
  photos: number;
};

const cells = (line: string) =>
  line
    .trim()
    .replace(/^\||\|$/g, '')
    .split('|')
    .map((cell) => cell.trim());

// "Name (ts, fl), Name (p) *": split on commas outside parentheses
function parseMusicians(cell: string): Musician[] {
  return (cell.replace(/\s*\*$/, '').match(/[^,(]+(\([^)]*\))?/g) ?? [])
    .map((part) => {
      const m = part.trim().match(/^(.*?)\s*(?:\(([^)]*)\))?$/);
      const instruments = m[2] ? m[2].split(',').map((i) => INSTRUMENTS[i.trim()] ?? i.trim()) : [];
      return { name: m[1], instruments };
    })
    .filter((musician) => musician.name);
}

function parseFile(file: string): Show[] {
  const lines = readFileSync(file, 'utf8').split('\n');
  const start = lines.findIndex((line) => line.trim().startsWith('|'));
  const headers = cells(lines[start]).map((header) => header.toLowerCase());
  return lines
    .slice(start + 2)
    .filter((line) => line.trim().startsWith('|'))
    .map((line) => {
      const row = cells(line);
      const get = (header: string) => row[headers.indexOf(header)] ?? '';
      const musicians = get('musicians');
      return {
        year: get('year'),
        date: get('date'),
        venue: get('venue') || get('location'),
        band: get('band'),
        musicians: parseMusicians(musicians),
        likely: musicians.endsWith('*'),
        photos: Number(get('photos')) || 0,
      };
    });
}

// Reads every data/*-shows.md table and merges them by year, keeping each file's order within a year
export function loadShows(): Show[] {
  const dir = join(process.cwd(), 'data');
  return readdirSync(dir)
    .filter((file) => file.endsWith('-shows.md'))
    .sort()
    .flatMap((file) => parseFile(join(dir, file)))
    .sort((a, b) => Number(a.year) - Number(b.year));
}
