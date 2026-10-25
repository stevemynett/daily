'use client';

import { useEffect, useState } from 'react';

// A general guide to BC produce and seafood by month; storage crops carry through winter
const SEASON: { produce: string[]; seafood: string[] }[] = [
  {
    produce: ['Storage apples', 'Pears', 'Beets', 'Cabbage', 'Carrots', 'Celeriac', 'Kale', 'Leeks', 'Parsnips', 'Potatoes', 'Winter squash', 'Mushrooms'],
    seafood: ['Dungeness crab', 'Oysters'],
  },
  {
    produce: ['Storage apples', 'Pears', 'Beets', 'Cabbage', 'Carrots', 'Kale', 'Leeks', 'Parsnips', 'Potatoes', 'Winter squash', 'Mushrooms'],
    seafood: ['Dungeness crab', 'Oysters'],
  },
  {
    produce: ['Purple sprouting broccoli', 'Kale', 'Leeks', 'Forced rhubarb', 'Carrots', 'Parsnips', 'Potatoes', 'Mushrooms', 'Sprouts'],
    seafood: ['Halibut', 'Dungeness crab', 'Oysters'],
  },
  {
    produce: ['Asparagus', 'Rhubarb', 'Spinach', 'Salad greens', 'Radishes', 'Green onions', 'Nettles', 'Mushrooms'],
    seafood: ['Halibut', 'Dungeness crab', 'Oysters'],
  },
  {
    produce: ['Asparagus', 'Rhubarb', 'Radishes', 'Spinach', 'Lettuce', 'Green garlic', 'Peas', 'Salad greens'],
    seafood: ['Spot prawns', 'Halibut', 'Dungeness crab'],
  },
  {
    produce: ['Strawberries', 'Peas', 'Lettuce', 'Radishes', 'Garlic scapes', 'Early cherries', 'New potatoes', 'Zucchini'],
    seafood: ['Spot prawns', 'Halibut', 'Sockeye salmon'],
  },
  {
    produce: ['Cherries', 'Blueberries', 'Raspberries', 'Strawberries', 'Apricots', 'Zucchini', 'Green beans', 'Cucumbers', 'New potatoes', 'Garlic'],
    seafood: ['Sockeye salmon', 'Halibut', 'Albacore tuna'],
  },
  {
    produce: ['Blueberries', 'Blackberries', 'Peaches', 'Nectarines', 'Plums', 'Corn', 'Tomatoes', 'Peppers', 'Zucchini', 'Cucumbers', 'Early apples'],
    seafood: ['Sockeye salmon', 'Albacore tuna', 'Halibut'],
  },
  {
    produce: ['Apples', 'Pears', 'Plums', 'Grapes', 'Peaches', 'Corn', 'Tomatoes', 'Peppers', 'Winter squash', 'Potatoes', 'Chanterelles'],
    seafood: ['Coho salmon', 'Albacore tuna', 'Halibut'],
  },
  {
    produce: ['Apples', 'Pears', 'Cranberries', 'Grapes', 'Pumpkins', 'Winter squash', 'Brussels sprouts', 'Kale', 'Beets', 'Carrots', 'Chanterelles'],
    seafood: ['Coho salmon', 'Halibut', 'Dungeness crab', 'Oysters'],
  },
  {
    produce: ['Apples', 'Pears', 'Cranberries', 'Brussels sprouts', 'Kale', 'Leeks', 'Winter squash', 'Beets', 'Carrots', 'Parsnips', 'Celeriac'],
    seafood: ['Dungeness crab', 'Oysters'],
  },
  {
    produce: ['Storage apples', 'Pears', 'Brussels sprouts', 'Kale', 'Leeks', 'Cabbage', 'Beets', 'Carrots', 'Parsnips', 'Winter squash'],
    seafood: ['Dungeness crab', 'Oysters'],
  },
];

export default function InSeason() {
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
    </div>
  );
}
