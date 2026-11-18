const path = require('node:path');
const assert = require('node:assert/strict');
const { runtime } = require('./helpers/runtime.cjs');

(async () => {
  const r = runtime(), { vue } = r;
  const { usePagination } = await r.importFile(path.resolve(__dirname, '../index.js'));
  const calls = [];
  function fetch(context) { return new Promise((resolve, reject) => calls.push({ context, resolve, reject })); }
  const p = usePagination({ fetch, pageSize: 2 });
  const list = () => Array.from(p.items.value);
  assert.equal(p.status.value, 'ready'); assert.equal(calls.length, 0);
  let a = p.loadNext(); assert.equal(a, p.loadNext()); await r.flush();
  assert.equal(calls.length, 1); assert.equal(calls[0].context.page, 1);
  calls[0].resolve({ items: [1, 2], hasMore: true }); assert.equal((await a).success, true);
  assert.deepEqual(list(), [1, 2]); assert.equal(p.page.value, 1);
  a = p.loadNext(); await r.flush(); calls[1].reject(new Error('offline')); await a;
  assert.equal(p.status.value, 'error'); assert.deepEqual(list(), [1, 2]); assert.equal(p.page.value, 1);
  a = p.loadNext(); await r.flush(); assert.equal(calls[2].context.page, 2);
  calls[2].resolve({ items: [3], hasMore: false }); await a;
  assert.deepEqual(list(), [1, 2, 3]); assert.equal(p.status.value, 'finished');
  assert.equal((await p.loadNext()).skipped, true); assert.equal(calls.length, 3);

  const filters = r.data({ category: 'A', nested: { value: 1 } });
  a = p.refresh(filters); filters.nested.value = 9; await r.flush();
  assert.equal(calls[3].context.params.nested.value, 1);
  assert.equal(p.refreshing.value, true); assert.equal(p.loadNext(), a);
  calls[3].reject(new Error('refresh failed')); await a;
  assert.deepEqual(list(), [1, 2, 3]);
  a = p.retry(); await r.flush(); assert.equal(calls[4].context.page, 1);
  assert.equal(calls[4].context.params.category, 'A');
  calls[4].resolve({ items: [10], hasMore: true }); await a; assert.deepEqual(list(), [10]);

  const old = p.loadNext(); await r.flush();
  const fresh = p.refresh(r.data({ category: 'B' })); await r.flush();
  calls[6].resolve({ items: [20], hasMore: true }); await fresh;
  calls[5].resolve({ items: [999], hasMore: false }); assert.equal((await old).cancelled, true);
  assert.deepEqual(list(), [20]); assert.equal(p.page.value, 1); assert.equal(p.hasMore.value, true);
  a = p.refresh(r.data({ category: 'C' })); await r.flush();
  const latest = p.refresh(); await r.flush(); assert.equal(calls[8].context.params.category, 'C');
  calls[7].reject(new Error('stale failure')); assert.equal((await a).cancelled, true);
  assert.equal(p.loading.value, true); assert.equal(p.error.value, null);
  calls[8].resolve({ items: [], hasMore: false }); await latest; assert.equal(p.status.value, 'finished');

  a = p.refresh(); await r.flush(); p.reset();
  calls[9].resolve({ items: [9], hasMore: true }); assert.equal((await a).cancelled, true);
  assert.equal(p.status.value, 'ready'); assert.deepEqual(list(), []); assert.equal(p.page.value, 0);
  a = p.refresh(); await r.flush(); calls[10].resolve({ wrong: true }); await a;
  assert.equal(p.status.value, 'error'); assert.equal(p.page.value, 0);
  a = p.retry(); await r.flush(); calls[11].resolve({ items: [42], hasMore: false }); await a;
  assert.deepEqual(list(), [42]);
  assert.equal(vue.isReadonly(p.items), true);
  a = p.refresh(); await r.flush(); p.dispose(); calls[12].resolve({ items: [8], hasMore: true });
  assert.equal((await a).cancelled, true); assert.deepEqual(list(), []);
  assert.equal((await p.loadNext()).cancelled, true);

  const scope = vue.effectScope(); let scoped;
  scope.run(() => { scoped = usePagination({ fetch: async () => ({ items: [1], hasMore: false }) }); });
  scope.stop(); assert.equal((await scoped.refresh()).cancelled, true);
  let requests = 0;
  const immediate = usePagination({ fetch: async () => { requests++; return { items: [], hasMore: false }; } });
  const abandoned = immediate.refresh(); immediate.dispose();
  assert.equal((await abandoned).cancelled, true); assert.equal(requests, 0);
  const mapped = usePagination({ initialPage: 0, fetch: async ctx => ({ rows: [ctx.page], total: 1 }),
    transform: response => ({ items: response.rows, hasMore: false }) });
  await mapped.refresh(); assert.deepEqual(Array.from(mapped.items.value), [0]);
  const nullError = usePagination({ fetch: async () => { throw null; } });
  await nullError.refresh(); assert.equal(nullError.status.value, 'error');
  for (const options of [{}, { fetch, pageSize: 0 }, { fetch, initialPage: -1 }, { fetch, transform: true }]) {
    assert.throws(() => usePagination(options));
  }
  console.log('PASS pagination: deduplication, append/refresh retry, parameter snapshots, stale success/failure, reset, disposal, mapping and readonly state');
})().catch(error => { console.error(error); process.exitCode = 1; });
