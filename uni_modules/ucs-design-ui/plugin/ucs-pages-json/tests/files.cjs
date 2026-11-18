const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { EventEmitter } = require('node:events');
const pagesJson = require('../index.js');
const temporaryRoot = fs.realpathSync(os.tmpdir());
const root = fs.mkdtempSync(path.join(temporaryRoot, 'ucs-pages-json-'));
const entry = path.join(root, 'pages.config.js');
const output = path.join(root, 'pages.json');
const route = path.join(root, 'routes.js');
const fileKey = file => process.platform === 'win32' ? path.resolve(file).replace(/\\/g, '/').toLowerCase() : path.resolve(file);
function write(file, contents) { fs.writeFileSync(file, contents); }
function config() { write(entry, "import routes from './routes.js'; export default { pages: [...routes] };"); }
async function until(predicate) {
  const deadline = Date.now() + 3000;
  while (!predicate()) {
    if (Date.now() >= deadline) throw Error('Timed out waiting for generator');
    await new Promise(resolve => setTimeout(resolve, 10));
  }
}
(async () => {
  let plugin;
  try {
    config();
    write(route, "export default [{ path: 'pages/first' }];");
    const first = await pagesJson.generatePages({ root });
    assert(first.changed);
    assert(first.dependencies.includes(route));
    assert.equal(JSON.parse(fs.readFileSync(output, 'utf8')).pages[0].path, 'pages/first');
    assert.equal((await pagesJson.generatePages({ root })).changed, false);
    const original = fs.readFileSync(output, 'utf8');
    write(route, 'export default unknown;');
    await assert.rejects(pagesJson.generatePages({ root }), /unknown/);
    assert.equal(fs.readFileSync(output, 'utf8'), original);
    await assert.rejects(pagesJson.generatePages({ root, output: 'pages.config.js' }), /同一文件/);
    const alias = path.join(root, 'alias.js');
    fs.linkSync(entry, alias);
    await assert.rejects(pagesJson.generatePages({ root, output: 'alias.js' }), /同一文件/);
    write(route, "export { default } from './pages.config.js';");
    await assert.rejects(pagesJson.generatePages({ root }), /循环模块引用/);
    assert.equal(fs.readFileSync(output, 'utf8'), original);
    write(route, 'const routes = [...routes]; export default routes;');
    await assert.rejects(pagesJson.generatePages({ root }), /循环常量引用/);
    assert.equal(fs.readFileSync(output, 'utf8'), original);
    config();
    write(route, "export { default } from './nested.js';");
    const nested = path.join(root, 'nested.js');
    write(nested, "export default [{ path: 'pages/nested' }];");
    plugin = pagesJson({ root });
    await plugin.config({ root });
    const buildFiles = new Set();
    const buildContext = { addWatchFile: file => buildFiles.add(fileKey(file)) };
    await plugin.buildStart.call(buildContext);
    assert(buildFiles.has(fileKey(nested)));
    write(nested, "export default [{ path: 'pages/build-watch' }];");
    await plugin.watchChange.call(buildContext, nested);
    assert.equal(JSON.parse(fs.readFileSync(output, 'utf8')).pages[0].path, 'pages/build-watch');
    const watcher = new EventEmitter();
    const watched = new Set();
    watcher.add = files => files.forEach(file => watched.add(fileKey(file)));
    const errors = [];
    const server = { watcher, config: { logger: { error() {} } }, ws: { send: message => errors.push(message) }, httpServer: new EventEmitter() };
    plugin.configureServer(server);
    assert(watched.has(fileKey(nested)));
    fs.unlinkSync(nested);
    watcher.emit('unlink', nested);
    await until(() => errors.length === 1);
    assert.equal(JSON.parse(fs.readFileSync(output, 'utf8')).pages[0].path, 'pages/build-watch');
    write(nested, "export default [{ path: 'pages/restored' }];");
    watcher.emit('add', nested);
    await until(() => JSON.parse(fs.readFileSync(output, 'utf8')).pages[0].path === 'pages/restored');
    write(route, "import missing from './created-later.js'; export default missing;");
    watcher.emit('change', route);
    await until(() => errors.length === 2);
    const missing = path.join(root, 'created-later.js');
    assert(watched.has(fileKey(missing)));
    write(missing, "export default [{ path: 'pages/created' }];");
    watcher.emit('add', missing);
    await until(() => JSON.parse(fs.readFileSync(output, 'utf8')).pages[0].path === 'pages/created');
    server.httpServer.emit('close');
    for (const event of ['add', 'change', 'unlink']) assert.equal(watcher.listenerCount(event), 0);
    plugin.closeWatcher();
    plugin.closeBundle();
    console.log('PASS imports, unchanged output, failure preservation, same-file/hardlink protection, cycle rejection, build/server watching, missing-file recovery and listener cleanup');
  } finally {
    plugin?.closeWatcher();
    const resolved = path.resolve(root);
    assert.equal(path.dirname(resolved), temporaryRoot);
    assert(path.basename(resolved).startsWith('ucs-pages-json-'));
    fs.rmSync(resolved, { recursive: true, force: true });
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
