import { statSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

export type Shoot = { path: string; photos: number; edited: number; shot: string };
export type Shoots = { updatedAt: string; shoots: Shoot[] };

// A photo counts as edited when Lightroom has develop adjustments for it. Each
// catalog folder under ~/Projects/Photography/<folder> that holds photos is one shoot.
export function loadShoots(folder: 'Music' | 'Personal'): Shoots | null {
  const catalog = process.env.LIGHTROOM_CATALOG ?? join(homedir(), 'Pictures', 'Lightroom', 'Lightroom Catalog-v13-3.lrcat');
  const root = join(process.env.PHOTOGRAPHY_DIR ?? join(homedir(), 'Projects', 'Photography'), folder) + '/';
  try {
    // immutable keeps the build from locking or writing the catalog while Lightroom has it open
    const db = new DatabaseSync(`file:${encodeURI(catalog)}?mode=ro&immutable=1`, { readOnly: true });
    const rows = db
      .prepare(
        `select rtrim(f.pathFromRoot, '/') as path, count(*) as photos,
           sum(coalesce(d.hasDevelopAdjustmentsEx, 0) > 0) as edited,
           min(substr(i.captureTime, 1, 10)) as shot
         from Adobe_images i
         join AgLibraryFile lf on lf.id_local = i.rootFile
         join AgLibraryFolder f on f.id_local = lf.folder
         join AgLibraryRootFolder r on r.id_local = f.rootFolder
         left join Adobe_imageDevelopSettings d on d.image = i.id_local
         where r.absolutePath = ?
         group by f.id_local
         order by shot desc, path`,
      )
      .all(root) as Shoot[];
    db.close();
    return { updatedAt: statSync(catalog).mtime.toISOString(), shoots: rows.map((row) => ({ ...row })) };
  } catch {
    return null;
  }
}
