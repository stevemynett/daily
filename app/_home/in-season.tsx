'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { SEASON } from './season';

// The Cooking page shows it without the link back to itself
export default function InSeason({ link = true }: { link?: boolean }) {
  const [month, setMonth] = useState<number | null>(null);
  useEffect(() => setMonth(new Date().getMonth()), []);
  if (month === null) return null;

  const { produce, seafood } = SEASON[month];
  const name = new Date(2000, month, 1).toLocaleDateString('en-CA', { month: 'long' });
  return (
    <div className="in-season">
      <p className="muted">What BC farms and boats are bringing in for {name}.</p>
      <ul className="season-list">
        {produce.map((item) => (
          <li key={item} className="season-item">
            {item}
          </li>
        ))}
        {seafood.map((item) => (
          <li key={item} className="season-item" data-kind="seafood">
            {item}
          </li>
        ))}
      </ul>
      {link && (
        <p className="caption">
          <Link href="/cooking">Recipes on the Cooking page</Link>
        </p>
      )}
    </div>
  );
}
