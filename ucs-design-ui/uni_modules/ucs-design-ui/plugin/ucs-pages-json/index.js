'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const { convertPagesConfig } = require('./convert.js');
const name = 'ucs:pages-json';
const normalize = file => {
  const resolved = path.resolve(file).replace(/\\/g, '/');
  return process.platform === 'win32' ? resolved.toLowerCase() : resolved;
};

function assertDistinctFiles(entry, output) {
  const fail = () => { throw Error(`[${name}] input 和 output 不能指向同一文件`); };
  if (normalize(entry) === normalize(output)) fail();
  let sameFile = false;
  try {
    sameFile = normalize(fs.realpathSync(entry)) === normalize(fs.realpathSync(output));
    if (!sameFile) {
      const inputInfo = fs.statSync(entry, { bigint: true });
      const outputInfo = fs.statSync(output, { bigint: true });
      sameFile = inputInfo.dev === outputInfo.dev && inputInfo.ino === outputInfo.ino;
    }
  } catch (error) {
    if (error.code !== 'ENOENT' && error.code !== 'ENOTDIR') throw error;
  }
  if (sameFile) fail();
}

function settings(options = {}, root) {
  root = path.resolve(options.root || process.env.UNI_INPUT_DIR || root || process.cwd());
  const entry = path.resolve(root, options.input || 'pages.config.js');
  const output = path.resolve(root, options.output || 'pages.json');
  assertDistinctFiles(entry, output);
  return { root, entry, output };
}

async function generate(config) {
  const dependencies = new Set([config.entry]);
  try {
    assertDistinctFiles(config.entry, config.output);
    const source = await fs.promises.readFile(config.entry, 'utf8');
    const contents = convertPagesConfig(source, config.entry, { root: config.root, output: config.output, dependencies });
    // The renderer only emits standalone directive comments. Validate before
    // replacing the existing file; do not silently write invalid JSONC.
    JSON.parse(contents.replace(/^\s*\/\/.*$/gm, ''));
    const previous = fs.existsSync(config.output) ? fs.readFileSync(config.output, 'utf8') : null;
    const changed = contents !== previous;
    if (changed) {
      assertDistinctFiles(config.entry, config.output);
      fs.mkdirSync(path.dirname(config.output), { recursive: true });
      const temporary = `${config.output}.${randomUUID()}.tmp`;
      try {
        fs.writeFileSync(temporary, contents, 'utf8');
        fs.renameSync(temporary, config.output);
      } finally {
        if (fs.existsSync(temporary)) fs.unlinkSync(temporary);
      }
    }
    return { changed, dependencies: [...dependencies], output: config.output };
  } catch (cause) {
    const error = new Error(`[${name}] ${cause.message}`, { cause });
    error.dependencies = [...dependencies];
    throw error;
  }
}

async function generatePages(options = {}) {
  return generate(settings(options));
}

function ucsPagesJson(options = {}) {
  let config;
  let server;
  let queue = Promise.resolve();
  let dispose;
  let dependencies = new Set();
  function run() {
    const task = queue.then(async () => {
      try {
        const result = await generate(config);
        dependencies = new Set(result.dependencies.map(normalize));
        return result;
      } catch (error) {
        for (const file of error.dependencies || []) dependencies.add(normalize(file));
        throw error;
      } finally {
        if (server) server.watcher.add([...dependencies]);
      }
    });
    queue = task.catch(() => {});
    return task;
  }
  return {
    name, enforce: 'pre',
    async config(raw) {
      config = settings(options, raw.root);
      await run();
    },
    async buildStart() {
      try { await run(); }
      finally { for (const file of dependencies) this.addWatchFile(file); }
    },
    async watchChange(id) {
      if (!server && dependencies.has(normalize(id))) {
        try { await run(); }
        finally { for (const file of dependencies) this.addWatchFile?.(file); }
      }
    },
    configureServer(viteServer) {
      server = viteServer;
      server.watcher.add([...dependencies]);
      const onChange = async file => {
        if (!dependencies.has(normalize(file))) return;
        try {
          await run();
          // uni's pages.json watcher performs platform selection and invalidation.
        } catch (error) {
          server.config.logger.error(error.message);
          server.ws.send({ type: 'error', err: { message: error.message, stack: error.stack, plugin: name } });
        }
      };
      for (const event of ['add', 'change', 'unlink']) server.watcher.on(event, onChange);
      dispose = () => {
        for (const event of ['add', 'change', 'unlink']) server.watcher.off(event, onChange);
      };
      server.httpServer?.once('close', dispose);
    },
    closeWatcher() { dispose?.(); },
    closeBundle() { dispose?.(); },
  };
}

module.exports = ucsPagesJson;
module.exports.generatePages = generatePages;
module.exports.convertPagesConfig = convertPagesConfig;
