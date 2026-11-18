import { withSessionHandling } from './session-errors.js';
// Create inside a page's setup. Re-entering a destroyed page creates a fresh cache.
export function createPageDictionary() {
 let generation = 0;
 const cache = new Map();
 const pending = new Map();
 async function load(codes) {
  const keys = [...new Set(codes)];
  const missing = keys.filter(code => !cache.has(code) && !pending.has(code));
  if (missing.length) {
   const current = generation;
   const request = withSessionHandling(() => uniCloud.importObject('uni-id-co', { customUI: true }).getDictionaryOptions({ codes: missing }));
   for (const code of missing) {
    const task = request.then(result => { const rows = result.data[code] || []; if (current === generation) cache.set(code, rows); return rows; }).finally(() => { if (pending.get(code) === task) pending.delete(code); });
    pending.set(code, task);
   }
  }
  const rows = await Promise.all(keys.map(code => cache.has(code) ? cache.get(code) : pending.get(code)));
  return Object.fromEntries(keys.map((code, index) => [code, rows[index]]));
 }
 return { load, clear() { generation++; cache.clear(); pending.clear(); } };
}
