import RunStatus from '../_daily/run-status';
import InSeason from '../_home/in-season';
import { loadCooking, type CookingRecipe } from './data';

export const metadata = {
  title: 'Cooking',
};

const anchor = (name: string) => name.toLowerCase().replace(/[^a-z]+/g, '-');

function RecipeList({ recipes }: { recipes: CookingRecipe[] }) {
  return (
    <ul className="event-list">
      {recipes.map((recipe) => (
        <li key={`${recipe.name} ${recipe.url}`}>
          <span>
            {recipe.url ? (
              <a href={recipe.url} target="_blank" rel="noopener noreferrer" className="event-name">
                {recipe.name}
              </a>
            ) : (
              <span className="event-name">{recipe.name}</span>
            )}
            {recipe.source && <span className="badge">{recipe.source}</span>}
          </span>
          <span>{recipe.description}</span>
        </li>
      ))}
    </ul>
  );
}

export default function Cooking() {
  const cooking = loadCooking();
  const month = new Date().getMonth();
  const monthName = (m: number) => new Date(2000, m, 1).toLocaleDateString('en-CA', { month: 'long' });

  return (
    <>
      <div className="title-row">
        <h1 className="page-title">Cooking</h1>
        <RunStatus job="cooking" lastRun={cooking?.updatedAt ?? null} />
      </div>

      <section className="listing-section">
        <h2>In season</h2>
        <InSeason link={false} />
      </section>

      {cooking === null ? (
        <p className="muted">No recipes yet. Run `make cooking`.</p>
      ) : (
        <>
          {cooking.month !== null && cooking.month !== month && (
            <p className="muted">
              These are {monthName(cooking.month)}'s picks. The run for {monthName(month)} starts on its own, or run `make cooking`.
            </p>
          )}

          <section className="listing-section">
            <h2>Plates</h2>
            <RecipeList recipes={cooking.plates} />
          </section>

          <section className="listing-section">
            <h2>By ingredient</h2>
            <ul className="season-list">
              {cooking.items.map((item) => (
                <li key={item.name}>
                  <a href={`#${anchor(item.name)}`} className="season-item">
                    {item.name}
                  </a>
                </li>
              ))}
            </ul>
            {cooking.items.map((item) => (
              <div key={item.name} id={anchor(item.name)} className="day">
                <h3>{item.name}</h3>
                {item.recipes.length > 0 ? <RecipeList recipes={item.recipes} /> : <p className="muted">{item.note || 'Nothing good this month.'}</p>}
              </div>
            ))}
          </section>

          {cooking.footer && <p className="caption">{cooking.footer}</p>}
        </>
      )}
    </>
  );
}
