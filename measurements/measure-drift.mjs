// Drift measurement over the Engram observation store, for §7 of
// paper-poc-agent-memory. Read-only over a copy of the DB.
//
// Method: every observation's content is scanned for declared Windows
// file paths (the store's convention puts them under **Where**/Relevant
// Files, but we scan the whole content). For each declared path:
//   - missing on disk        -> f_m-style event (referent vanished)
//   - exists, mtime > obs.ts -> f_i-style drift (content moved after
//                               attestation; mtime is a LOWER BOUND on
//                               content drift: no stored source hash
//                               exists to rehash against)
//   - exists, mtime <= obs.ts -> no observable drift
// Per-observation verdict: VANISHED if any path missing, DRIFTED if any
// surviving path modified after the observation, STABLE otherwise.
import { DatabaseSync } from 'node:sqlite';
import { statSync, existsSync } from 'node:fs';

const db = new DatabaseSync(process.argv[2], { readOnly: true });

const tables = db.prepare(`SELECT name FROM sqlite_master WHERE type='table'`).all().map(r => r.name);
console.error('tables:', tables.join(', '));

// discover observation table + columns
const obsTable = tables.find(t => /observation/i.test(t)) ?? 'observations';
const cols = db.prepare(`PRAGMA table_info(${obsTable})`).all().map(r => r.name);
console.error('columns:', cols.join(', '));

const rows = db.prepare(`SELECT * FROM ${obsTable}`).all();

const PATH_RE = /[A-Za-z]:\\(?:[^\s"'`|<>*?:\n\\]+\\)*[^\s"'`|<>*?:\n\\]+/g;
const norm = p => p.replace(/[.,;:)\]}»"'`]+$/g, '');

const perType = {};
const ages = [];
let withPaths = 0, totalPaths = 0, missingPaths = 0, driftedPaths = 0, stablePaths = 0;

const now = Date.now();
const results = [];

for (const r of rows) {
  const type = r.type ?? 'unknown';
  const created = new Date(r.created_at ?? r.createdAt ?? r.timestamp);
  const content = [r.title, r.content, r.text, r.body].filter(Boolean).join('\n');
  const found = [...new Set((content.match(PATH_RE) ?? []).map(norm))]
    .filter(p => p.length > 8 && !/\\(node_modules|target)\\/.test(p));
  ages.push((now - created.getTime()) / 86400000);

  perType[type] ??= { n: 0, withPaths: 0, vanished: 0, drifted: 0, stable: 0, paths: 0, pMissing: 0, pDrifted: 0 };
  const T = perType[type];
  T.n++;
  if (!found.length) continue;
  withPaths++; T.withPaths++; T.paths += found.length; totalPaths += found.length;

  let anyMissing = false, anyDrifted = false;
  for (const p of found) {
    if (!existsSync(p)) { missingPaths++; T.pMissing++; anyMissing = true; continue; }
    try {
      const st = statSync(p);
      if (st.mtimeMs > created.getTime()) { driftedPaths++; T.pDrifted++; anyDrifted = true; }
      else stablePaths++;
    } catch { missingPaths++; T.pMissing++; anyMissing = true; }
  }
  if (anyMissing) { T.vanished++; results.push([r.id, type, 'VANISHED', created.toISOString().slice(0,10)]); }
  else if (anyDrifted) { T.drifted++; results.push([r.id, type, 'DRIFTED', created.toISOString().slice(0,10)]); }
  else { T.stable++; results.push([r.id, type, 'STABLE', created.toISOString().slice(0,10)]); }
}

ages.sort((a, b) => a - b);
const q = f => ages[Math.floor(f * (ages.length - 1))];

console.log(JSON.stringify({
  store: { observations: rows.length, oldestDays: Math.round(ages.at(-1)), medianDays: Math.round(q(0.5)), p90Days: Math.round(q(0.9)) },
  pathBearing: { observations: withPaths, declaredPaths: totalPaths, missingPaths, driftedPaths, stablePaths },
  perType: Object.fromEntries(Object.entries(perType)
    .filter(([, v]) => v.withPaths > 0)
    .sort((a, b) => b[1].withPaths - a[1].withPaths)
    .map(([k, v]) => [k, {
      n: v.n, withPaths: v.withPaths, paths: v.paths,
      vanished: v.vanished, drifted: v.drifted, stable: v.stable,
      staleRatePct: Math.round(100 * (v.vanished + v.drifted) / v.withPaths),
    }])),
}, null, 2));
