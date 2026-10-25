#!/usr/bin/env python3
"""Scan venue folders for photos and write a show-directory.md into each one,
listing every show (top-level subfolder) by year, date, band and photo count.

Usage: make shows, or scripts/showsin.py [--full] [venue dir ...]

With no arguments, pick venue folders from the current directory. Space
toggles, a toggles all, enter runs, q quits.

Photo counts per show folder are cached in .show-directory-cache.json, so a
rerun only reads EXIF from new or changed show folders. --full rescans all.
"""
import curses
import hashlib
import json
import os
import re
import shutil
import subprocess
import sys
from collections import defaultdict
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

EXTS = {
    ".jpg", ".jpeg", ".heic", ".heif", ".png", ".tif", ".tiff", ".gif", ".webp",
    ".dng", ".cr2", ".cr3", ".nef", ".arw", ".raf", ".orf", ".rw2",
}

# Library bundles full of previews and thumbnails, not originals.
SKIP_SUFFIXES = (".photoslibrary", ".lrlibrary", ".lrdata", ".aplibrary")

MONTHS = [
    "January", "February", "March", "April", "May", "June", "July",
    "August", "September", "October", "November", "December",
]

# "Feb 26th, 2014", "Sept 11:05", "June 2-4:06", "June2 4:06". A second day
# after ":" or "&" counts only when a year follows it ("Dec 7:8 07"), so
# "Sept 3 : 06" stays one day.
DATE = re.compile(
    r"\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s*"
    r"(\d{1,2})(?:st|nd|rd|th)?"
    r"(?:\s*-\s*(\d{1,2})(?:st|nd|rd|th)?"
    r"|\s*[:&]\s*(\d{1,2})(?:st|nd|rd|th)?(?=\s*[:,]?\s*\d{2,4}\b))?",
    re.IGNORECASE,
)

OUT = "show-directory.md"
CACHE = ".show-directory-cache.json"
BATCH = 8


def photo_dirs(root):
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [
            d for d in dirnames
            if not d.startswith(".") and not d.endswith(SKIP_SUFFIXES)
        ]
        if any(Path(f).suffix.lower() in EXTS for f in filenames):
            yield dirpath


def read_dates(dirs):
    ext_args = [a for e in EXTS for a in ("-ext", e[1:])]
    cmd = [
        "exiftool", "-fast2", "-q", "-q", "-m", *ext_args, "-T", "-d", "%Y",
        "-Directory", "-FileName", "-DateTimeOriginal", "-CreateDate", *dirs,
    ]
    out = subprocess.run(cmd, capture_output=True, text=True).stdout
    return [line.split("\t") for line in out.splitlines()]


def ordinal(n):
    n = int(n)
    suffix = "th" if 10 <= n % 100 <= 20 else {1: "st", 2: "nd", 3: "rd"}.get(n % 10, "th")
    return f"{n}{suffix}"


def parse_show(name):
    """Split a folder name like "DC3 (Oct 11:05)" into band, date and a
    (month, day) sort key."""
    m = DATE.search(name)
    if not m:
        return name.strip(), "", (13, 0)
    month = next(i for i, full in enumerate(MONTHS) if full.lower().startswith(m[1].lower()))
    date = f"{MONTHS[month]} {ordinal(m[2])}"
    if m[3] or m[4]:
        date += f"-{ordinal(m[3] or m[4])}"
    # Drop the parenthetical holding the date, or everything from the date on
    paren = name.rfind("(", 0, m.start())
    cut = paren if paren != -1 and ")" not in name[paren:m.start()] else m.start()
    band = name[:cut].strip(" :,-")
    return band or name.strip(), date, (month, int(m[2]))


def cell(text):
    return str(text).replace("|", "\\|")


def existing_rows(path):
    """Rows of a previous show-directory.md keyed by (year, band), so hand
    edits to Band, Date and Musicians survive a rescan."""
    if not path.exists():
        return {}
    lines = [l for l in path.read_text().splitlines() if l.strip().startswith("|")]
    if len(lines) < 2:
        return {}
    split = lambda l: [c.strip() for c in l.strip().strip("|").split("|")]
    headers = [h.lower() for h in split(lines[0])]
    rows = {}
    for line in lines[2:]:
        row = dict(zip(headers, split(line)))
        rows[(row.get("year", ""), row.get("band", "").lower())] = row
    return rows


def show_of(root, directory):
    parts = Path(directory).relative_to(root).parts
    return parts[0] if parts else root.name


def signature(dirs):
    """Fingerprint of a show's photo files: names, sizes and mtimes."""
    h = hashlib.sha1()
    for d in sorted(dirs):
        for entry in sorted(os.scandir(d), key=lambda e: e.name):
            if entry.is_file() and Path(entry.name).suffix.lower() in EXTS:
                st = entry.stat()
                h.update(f"{entry.path}\0{st.st_size}\0{st.st_mtime_ns}\n".encode())
    return h.hexdigest()


def scan(root, cache, old, full):
    """Photo counts keyed by (year, show folder). Only folders that are new or
    changed since the cached run go through exiftool."""
    by_show = defaultdict(list)
    for d in photo_dirs(root):
        by_show[show_of(root, d)].append(d)

    # Without a cache yet, trust an existing directory row for any folder
    # whose parsed band name matches one, so the first run skips those too.
    seeded = defaultdict(dict)
    for (year, band), row in old.items():
        if row.get("photos", "").isdigit():
            seeded[band][year] = int(row["photos"])

    bands = defaultdict(int)
    for show in by_show:
        bands[parse_show(show)[0].lower()] += 1

    counts, stale, new_cache = {}, [], {}
    for show, dirs in by_show.items():
        band = parse_show(show)[0].lower()
        sig = signature(dirs)
        hit = cache.get(show)
        if not full and hit and hit["sig"] == sig:
            years = hit["years"]
        elif not full and not cache and band in seeded and bands[band] == 1:
            years = seeded[band]
        else:
            stale.extend(dirs)
            new_cache[show] = {"sig": sig, "years": {}}
            continue
        new_cache[show] = {"sig": sig, "years": years}
        for year, n in years.items():
            counts[(year, show)] = n

    rescan = sum(1 for v in new_cache.values() if not v["years"])
    print(f"{root.name}: {len(by_show) - rescan} shows cached, {rescan} to scan")

    # (year, show folder) -> file names without extension, so the RAW and JPG
    # of the same shot count once. Subfolders (nights, cameras, photographers)
    # count toward the top-level show folder.
    names = defaultdict(set)
    batches = [stale[i:i + BATCH] for i in range(0, len(stale), BATCH)]
    with ThreadPoolExecutor(max_workers=os.cpu_count()) as pool:
        for rows in pool.map(read_dates, batches):
            for row in rows:
                if len(row) != 4:
                    continue
                directory, name, original, created = row
                year = original if original != "-" else created
                if not year.isdigit():
                    year = "Unknown"
                names[(year, show_of(root, directory))].add(Path(name).stem.lower())
    for (year, show), stems in names.items():
        counts[(year, show)] = len(stems)
        new_cache[show]["years"][year] = len(stems)
    return counts, new_cache


def write_directory(root, full=False):
    venue = root.name
    out = root / OUT
    old = existing_rows(out)
    cache_file = root / CACHE
    cache = json.loads(cache_file.read_text()) if cache_file.exists() else {}
    shows, new_cache = scan(root, cache, old, full)

    entries = []
    for (year, folder), photos in shows.items():
        band, date, order = parse_show(folder)
        musicians = ""
        prev = old.get((year, band.lower()))
        if prev:
            band = prev.get("band") or band
            date = prev.get("date") or date
            musicians = prev.get("musicians", "")
        entries.append((year == "Unknown", year, order, band.lower(), year, date, band, musicians, photos))
    entries.sort()

    lines = [
        "# Show directory",
        "",
        f"Photos from {venue}, grouped by show. Musicians marked * are a likely "
        "lineup that I could not confirm for that exact date.",
        "",
        "| Year | Date | Venue | Band | Musicians | Photos |",
        "| --- | --- | --- | --- | --- | ---: |",
    ]
    for *_, year, date, band, musicians, photos in entries:
        lines.append(
            f"| {year} | {cell(date)} | {cell(venue)} | {cell(band)} | {musicians} | {photos} |"
        )

    if out.exists():
        shutil.copy2(out, out.with_suffix(".bak.md"))
    out.write_text("\n".join(lines) + "\n")
    cache_file.write_text(json.dumps(new_cache, indent=1, sort_keys=True))
    print(f"Wrote {len(entries)} rows to {out}")


def pick(dirs):
    def run(screen):
        curses.curs_set(0)
        chosen = [False] * len(dirs)
        pos = top = 0
        while True:
            height, width = screen.getmaxyx()
            rows = height - 2
            top = min(max(top, pos - rows + 1), pos)
            screen.erase()
            screen.addnstr(0, 0, "space toggle  a all  enter run  q quit", width - 1, curses.A_DIM)
            for i, d in enumerate(dirs[top:top + rows]):
                n = top + i
                mark = "[x]" if chosen[n] else "[ ]"
                attr = curses.A_REVERSE if n == pos else 0
                screen.addnstr(i + 1, 0, f"{mark} {d.name}", width - 1, attr)
            key = screen.getch()
            if key in (ord("q"), 27):
                return []
            if key in (curses.KEY_UP, ord("k")):
                pos = max(pos - 1, 0)
            elif key in (curses.KEY_DOWN, ord("j")):
                pos = min(pos + 1, len(dirs) - 1)
            elif key == ord(" "):
                chosen[pos] = not chosen[pos]
                pos = min(pos + 1, len(dirs) - 1)
            elif key == ord("a"):
                chosen = [not all(chosen)] * len(dirs)
            elif key in (curses.KEY_ENTER, 10, 13):
                return [d for d, c in zip(dirs, chosen) if c]

    return curses.wrapper(run)


def main():
    if not shutil.which("exiftool"):
        sys.exit("exiftool not found. Install with: brew install exiftool")

    args = sys.argv[1:]
    full = "--full" in args
    args = [a for a in args if a != "--full"]
    if args:
        roots = [Path(a).resolve() for a in args]
    else:
        here = Path(".").resolve()
        dirs = sorted(
            (d for d in here.iterdir() if d.is_dir() and not d.name.startswith(".")),
            key=lambda d: d.name.lower(),
        )
        if not dirs:
            sys.exit(f"No directories in {here}")
        roots = pick(dirs)

    for root in roots:
        write_directory(root, full)


if __name__ == "__main__":
    main()
