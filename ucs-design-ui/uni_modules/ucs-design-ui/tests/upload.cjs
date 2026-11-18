const path = require('node:path');
const assert = require('node:assert/strict');
const { runtime } = require('./helpers/runtime.cjs');
(async () => {
  const r = runtime();
  const { useUpload } = await r.importFile(path.resolve(__dirname, '../index.js'));
  const calls = [];
  const u = useUpload({ concurrency: 2, upload: context => new Promise((resolve, reject) => calls.push({ ...context, resolve, reject })) });
  const files = [{ path: '/a' }, { path: '/b' }, { path: '/c' }];
  const ids = u.add(files); files[0].path = '/changed';
  assert.equal(calls.length, 0); assert.equal(u.pendingCount.value, 3);
  const all = u.start(); await r.flush();
  assert.equal(calls.length, 2); assert.equal(calls[0].file.path, '/a'); assert.equal(u.uploadingCount.value, 2);
  const same = u.start(ids[0]);
  calls[0].onProgress({ loaded: 5, total: 10 }); assert.equal(u.tasks.value[0].progress, .5);
  calls[0].onProgress({}); assert.equal(u.tasks.value[0].progress, undefined);
  calls[0].onProgress({ progress: 2 }); assert.equal(u.tasks.value[0].progress, 1);
  calls[0].resolve('a'); assert.equal((await same)[0].result, 'a'); await r.flush(); assert.equal(calls.length, 3);
  calls[1].reject(new Error('offline')); calls[2].resolve('c');
  const results = await all; assert.equal(results[1].success, false); assert.equal(u.tasks.value[1].status, 'error');
  assert.equal(u.loading.value, false); assert.equal((await u.start()).length, 0);
  const retry = u.retry(ids[1]); await r.flush(); assert.equal(calls.length, 4); assert.equal(u.tasks.value[1].progress, undefined);
  let aborted = 0; calls[3].signal.addEventListener('abort', () => aborted++);
  u.cancel(ids[1]); assert.equal(aborted, 1); assert.equal(calls[3].signal.aborted, true); assert.equal((await retry)[0].cancelled, true);
  const again = u.retry(ids[1]); await r.flush(); calls[3].onProgress({ progress: .9 }); calls[3].resolve('stale');
  await r.flush(); assert.equal(u.tasks.value[1].status, 'uploading'); assert.equal(u.tasks.value[1].progress, undefined);
  calls[4].resolve('new'); await again; assert.equal(u.tasks.value[1].result, 'new');
  assert.equal(Object.isFrozen(u.tasks.value), true); assert.equal(Object.isFrozen(u.tasks.value[0]), true);
  assert.equal(Object.isFrozen(u.tasks.value[0].file), true);
  assert.throws(() => u.add([{ path: '/ok' }, { path: '' }]), /path/); assert.equal(u.tasks.value.length, 3);
  assert.equal(u.remove(ids[0]), true); assert.equal(u.remove(ids[0]), false);

  const queuedCalls = [], q = useUpload({ concurrency: 1, autoUpload: true, upload: ctx => new Promise(resolve => queuedCalls.push({ ...ctx, resolve })) });
  const qi = q.add([{ path: '/1' }, { path: '/2' }, { path: '/3' }]);
  const done = q.start(); q.cancel(qi[1]); await r.flush(); assert.equal(queuedCalls.length, 1);
  q.cancel(qi[0]); await r.flush(); assert.equal(queuedCalls.length, 2); assert.equal(queuedCalls[1].file.path, '/3');
  q.clear(); await done; assert.equal(q.tasks.value.length, 0); assert.equal(q.loading.value, false);
  queuedCalls.forEach(call => call.resolve('old')); await r.flush(); assert.equal(q.tasks.value.length, 0);
  const noCalls = useUpload({ upload: () => { throw Error('must not execute'); } });
  const ni = noCalls.add([{ path: '/x' }]); const before = noCalls.start(); noCalls.cancel(ni[0]); assert.equal((await before)[0].cancelled, true);
  await r.flush(); assert.equal(noCalls.tasks.value[0].status, 'cancelled');
  const synchronous = useUpload({ upload: () => { throw Error('sync'); } }); synchronous.add([{ path: '/x' }]);
  assert.equal((await synchronous.start())[0].error.message, 'sync');
  let scoped; const scope = r.vue.effectScope(); scope.run(() => { scoped = useUpload({ upload: () => new Promise(() => {}) }); });
  scoped.add([{ path: '/x' }]); const scopedDone = scoped.start(); await r.flush(); scope.stop();
  assert.equal((await scopedDone)[0].cancelled, true); assert.equal(scoped.tasks.value.length, 0); assert.equal(scoped.add([{ path: '/x' }]).length, 0);
  assert.equal((await scoped.start()).length, 0);
  for (const concurrency of [0, -1, 1.5, Infinity]) assert.throws(() => useUpload({ concurrency, upload() {} }), /concurrency/);
  assert.throws(() => useUpload({ upload: 1 }), /upload/); assert.throws(() => useUpload({ upload() {}, autoUpload: 1 }), /autoUpload/);

  // Use the actual request adapter: progress, native abort, and cancellation while an async interceptor is waiting.
  const { UcsRequest } = await r.importFile(path.resolve(__dirname, '../plugin/ucs-request/index.js'));
  const network = []; let nativeAborts = 0;
  const transport = { uploadFile(config) {
    const call = { config }; network.push(call);
    return { abort() { nativeAborts++; config.fail({ errMsg: 'abort' }); }, onProgressUpdate(fn) { call.progress = fn; } };
  } };
  const http = new UcsRequest({ transport });
  const wired = useUpload({ upload: ({ file, signal, onProgress }) => http.upload('/files', { filePath: file.path, name: 'file', signal, onUploadProgress: onProgress }) });
  const wi = wired.add([{ path: '/real' }]); const request = wired.start(); await r.flush();
  assert.equal(network.length, 1); network[0].progress({ totalBytesSent: 3, totalBytesExpectedToSend: 4 }); assert.equal(wired.tasks.value[0].progress, .75);
  wired.cancel(wi[0]); assert.equal(nativeAborts, 1); assert.equal((await request)[0].cancelled, true);
  const success = wired.retry(wi[0]); await r.flush(); network[1].config.success({ statusCode: 200, data: '{"url":"/saved"}' });
  assert.equal((await success)[0].result.data.url, '/saved');
  let release;
  http.interceptors.request.use(config => new Promise(resolve => { release = () => resolve(config); }));
  const waitId = wired.add([{ path: '/waiting' }])[0]; const waiting = wired.start(waitId); await r.flush();
  wired.cancel(waitId); assert.equal((await waiting)[0].cancelled, true); release(); await r.flush(); assert.equal(network.length, 2);
  // Removal must detach targets before user abort listeners can synchronously retry/start them.
  for (const operation of ['remove', 'clear', 'dispose']) {
    let targetId, retryResult, startResult, retrySettled = false, startSettled = false, uploads = 0;
    const removing = useUpload({ upload: ({ signal }) => {
      uploads++;
      signal.addEventListener('abort', () => {
        removing.retry(targetId).then(result => { retryResult = result; retrySettled = true; });
        removing.start(targetId).then(result => { startResult = result; startSettled = true; });
      });
      return new Promise(() => {});
    } });
    targetId = removing.add([{ path: '/remove' }])[0];
    const original = removing.start(targetId); await r.flush();
    removing[operation](targetId);
    assert.equal((await original)[0].cancelled, true); await r.flush();
    assert.equal(retrySettled, true); assert.equal(startSettled, true);
    assert.equal(retryResult.length, 0); assert.equal(startResult.length, 0);
    assert.equal(removing.tasks.value.length, 0); assert.equal(removing.uploadingCount.value, 0); assert.equal(uploads, 1);
    removing.dispose();
  }
  // clear detaches all old records first; newly added work during abort remains tracked.
  let groupIds, groupRetry, addedId; const groupCalls = [];
  const group = useUpload({ concurrency: 1, upload: context => new Promise(resolve => {
    groupCalls.push({ ...context, resolve });
    if (context.file.path === '/first') context.signal.addEventListener('abort', () => {
      groupRetry = group.start(groupIds[1]);
      addedId = group.add([{ path: '/new' }])[0]; group.start(addedId);
    });
  }) });
  groupIds = group.add([{ path: '/first' }, { path: '/queued' }]);
  const groupPending = group.start(); await r.flush(); group.clear();
  assert((await groupPending).every(result => result.cancelled)); assert.equal((await groupRetry).length, 0);
  await r.flush(); assert.equal(group.tasks.value.length, 1); assert.equal(group.tasks.value[0].id, addedId);
  assert.equal(groupCalls.length, 2); assert.equal(groupCalls[1].file.path, '/new');
  groupCalls[1].resolve('saved'); await r.flush(); assert.equal(group.tasks.value[0].status, 'success'); group.dispose();
  // Publish bulk changes once; a progress event must preserve all unchanged task identities.
  const largeCalls = [], large = useUpload({ upload: ctx => new Promise(() => largeCalls.push(ctx)) });
  large.add(Array.from({ length: 500 }, (_, i) => ({ path: '/large/' + i })));
  const largePending = large.start(); await r.flush();
  const unchanged = large.tasks.value[2], changed = large.tasks.value[0];
  const vm = require('node:vm');
  vm.runInContext('globalThis.freezeCount=0; globalThis.savedFreeze=Object.freeze; Object.freeze=value=>{freezeCount++;return savedFreeze(value)}', r.context);
  largeCalls[0].onProgress({ progress: .1 });
  assert.equal(large.tasks.value[2], unchanged); assert.notEqual(large.tasks.value[0], changed); assert.equal(r.context.freezeCount, 2);
  let publications = 0; const stopPublications = r.vue.watch(large.tasks, () => publications++, { flush: 'sync' });
  r.context.freezeCount = 0; large.cancelAll(); await largePending;
  assert.equal(publications, 1); assert(r.context.freezeCount <= 1001); assert.equal(large.uploadingCount.value, 0);
  large.clear(); assert.equal(publications, 2);
  large.add(Array.from({ length: 500 }, (_, i) => ({ path: '/ready/' + i })));
  r.context.freezeCount = 0; large.clear(); assert.equal(r.context.freezeCount, 1);
  vm.runInContext('Object.freeze=savedFreeze', r.context); stopPublications(); large.dispose();
  u.dispose(); q.dispose(); wired.dispose(); assert.equal(r.timers.size, 0);
  console.log('PASS upload: queue/concurrency, progress, retry, cancel, stale responses, scope disposal, actual ucs-request adapter/interceptor integration');
})().catch(error => { console.error(error); process.exitCode = 1; });
