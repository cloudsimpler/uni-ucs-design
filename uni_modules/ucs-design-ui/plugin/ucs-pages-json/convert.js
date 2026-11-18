'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { parse } = require('@babel/parser');

// Lower modules to an ordered tree containing both values and directives.
// Never execute JS or collapse objects into a map (conditional keys may repeat).
function convertPagesConfig(source, filename = 'pages.config.js', options = {}) {
  filename = path.resolve(filename);
  const rootDir = path.resolve(options.root || path.dirname(filename));
  const dependencies = options.dependencies || new Set();
  const modules = new Map();
  const loading = [];
  const resolving = [];
  function fail(mod, node, message) {
    throw Error(`${mod.filename}:${node?.loc?.start.line || 1}:${(node?.loc?.start.column || 0) + 1}: ${message}`);
  }
  function resolveFile(mod, node, specifier) {
    if (!specifier.startsWith('./') && !specifier.startsWith('../') && !specifier.startsWith('@/')) {
      fail(mod, node, '仅支持相对路径或 @/ 的静态导入，不支持 npm 包和绝对路径');
    }
    const base = specifier.startsWith('@/') ? path.resolve(rootDir, specifier.slice(2)) : path.resolve(path.dirname(mod.filename), specifier);
    const extension = path.extname(base);
    if (extension && extension !== '.js') fail(mod, node, '路由依赖仅支持 .js 文件');
    const candidates = extension ? [base] : [base + '.js', path.join(base, 'index.js')];
    for (const candidate of candidates) {
      // Watch attempted missing paths too, so creating a missing import recovers.
      dependencies.add(candidate);
      if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
        return fs.realpathSync(candidate);
      }
    }
    fail(mod, node, `找不到路由模块: ${specifier}`);
  }
  function load(file, suppliedSource) {
    file = path.resolve(file);
    if (path.extname(file) !== '.js') throw Error(`${file}: 配置及路由依赖仅支持 .js 文件`);
    dependencies.add(file);
    if (options.output && file === path.resolve(options.output)) throw Error(`${file}: 配置不能导入生成文件`);
    if (loading.includes(file)) throw Error(`循环模块引用: ${[...loading, file].join(' -> ')}`);
    if (modules.has(file)) return modules.get(file);
    loading.push(file);
    const mod = { filename: file, bindings: new Map(), exports: new Map(), events: new WeakMap() };
    const text = suppliedSource ?? fs.readFileSync(file, 'utf8');
    let ast;
    try { ast = parse(text, { sourceType: 'module' }); }
    catch (error) { throw Error(`${file}: ${error.message}`, { cause: error }); }
    if (ast.program.directives.length) fail(mod, ast.program.directives[0], '不支持脚本指令');

    const directives = [];
    for (const comment of ast.comments) {
      const value = comment.value.trim();
      if (!/^#(?:ifdef|ifndef|endif|else|elif|if)\b/.test(value)) continue;
      const match = value.match(/^#(ifdef|ifndef|endif)(?:[ \t]+([^\r\n]+))?$/);
      if (!match) fail(mod, comment, '只支持独占一行的 #ifdef/#ifndef/#endif');
      const next = text.indexOf('\n', comment.end);
      if (text.slice(text.lastIndexOf('\n', comment.start - 1) + 1, comment.start).trim() ||
          text.slice(comment.end, next < 0 ? text.length : next).trim() || comment.loc.start.line !== comment.loc.end.line) {
        fail(mod, comment, '条件编译指令必须独占一行');
      }
      const [, kind, expression] = match;
      if (kind === 'endif' ? !!expression : !expression) fail(mod, comment, '条件编译表达式缺失或 #endif 含有多余内容');
      if (expression) validateExpression(expression, () => fail(mod, comment, '条件表达式仅支持条件名、!、&&、|| 和括号'));
      directives.push({ ...comment, kind, text: value, used: false });
    }
    // Associate comments before expanding anything, so every module retains
    // its own source positions and conditions survive repeated use of a value.
    function visit(node) {
      if (!node || typeof node !== 'object') return;
      if (Array.isArray(node)) { node.forEach(visit); return; }
      if (['ObjectExpression', 'ArrayExpression'].includes(node.type)) {
        const members = node.type === 'ObjectExpression' ? node.properties : node.elements;
        if (members.some(member => !member)) fail(mod, node, '不支持稀疏数组');
        const local = directives.filter(comment => comment.start > node.start && comment.end < node.end &&
          !members.some(member => comment.start >= member.start && comment.end <= member.end));
        const events = [...members.map(member => ({ start: member.start, member })), ...local].sort((a, b) => a.start - b.start);
        const stack = [];
        for (const event of local) {
          if (event.kind === 'endif') {
            if (!stack.length) fail(mod, event, '#endif 没有匹配的同层级开始指令');
            stack.pop();
          } else stack.push(event);
          event.used = true;
        }
        if (stack.length) fail(mod, stack.at(-1), '缺少同层级的 #endif');
        mod.events.set(node, events);
      }
      for (const [key, child] of Object.entries(node)) {
        if (!['loc', 'comments', 'leadingComments', 'trailingComments', 'innerComments', 'tokens'].includes(key)) visit(child);
      }
    }
    visit(ast.program);
    const unused = directives.find(comment => !comment.used);
    if (unused) fail(mod, unused, '条件必须包围数组元素或对象属性，不能包围 import、声明或单独的属性值');

    function declare(statement, exported = false) {
      if (statement.type !== 'VariableDeclaration' || statement.kind !== 'const') fail(mod, statement, '仅支持 const 静态声明');
      for (const item of statement.declarations) {
        if (item.id.type !== 'Identifier' || !item.init) fail(mod, item, 'const 必须有初始值，不支持解构');
        mod.bindings.set(item.id.name, { node: item.init });
        if (exported) mod.exports.set(item.id.name, { local: item.id.name });
      }
    }
    for (const statement of ast.program.body) {
      if (statement.type === 'EmptyStatement') continue;
      if (statement.type === 'VariableDeclaration') { declare(statement); continue; }
      if (statement.type === 'ImportDeclaration') {
        if (!statement.specifiers.length || statement.attributes?.length) fail(mod, statement, '不支持副作用 import 或导入属性');
        const target = load(resolveFile(mod, statement, statement.source.value));
        for (const spec of statement.specifiers) {
          if (spec.type === 'ImportNamespaceSpecifier') fail(mod, spec, '不支持命名空间 import，请使用默认或具名导入');
          mod.bindings.set(spec.local.name, { target, exported: spec.type === 'ImportDefaultSpecifier' ? 'default' : spec.imported.name ?? spec.imported.value, node: spec });
        }
        continue;
      }
      if (statement.type === 'ExportDefaultDeclaration') {
        mod.exports.set('default', { node: statement.declaration });
        continue;
      }
      if (statement.type === 'ExportNamedDeclaration') {
        if (statement.declaration) { declare(statement.declaration, true); continue; }
        const target = statement.source ? load(resolveFile(mod, statement, statement.source.value)) : null;
        for (const spec of statement.specifiers) {
          if (spec.type !== 'ExportSpecifier') fail(mod, spec, '不支持此转导出写法');
          mod.exports.set(spec.exported.name ?? spec.exported.value, target
            ? { target, exported: spec.local.name ?? spec.local.value, node: spec }
            : { local: spec.local.name, node: spec });
        }
        continue;
      }
      fail(mod, statement, '仅支持静态 import、const 和 export；不执行运行时代码');
    }
    loading.pop();
    modules.set(file, mod);
    return mod;
  }
  function reference(mod, name, exported, node) {
    const key = `${mod.filename}:${exported ? 'export' : 'const'}:${name}`;
    if (resolving.includes(key)) fail(mod, node, `循环常量引用: ${[...resolving, key].join(' -> ')}`);
    const binding = (exported ? mod.exports : mod.bindings).get(name);
    if (!binding) fail(mod, node, `${exported ? '缺少导出' : '未定义的静态常量'}: ${name}`);
    if (binding.target && !binding.target.exports.has(binding.exported)) {
      fail(mod, binding.node, `模块 ${binding.target.filename} 缺少导出: ${binding.exported}`);
    }
    resolving.push(key);
    const result = binding.target ? reference(binding.target, binding.exported, true, binding.node)
      : binding.local ? reference(mod, binding.local, false, binding.node)
      : lower(mod, binding.node);
    resolving.pop();
    return result;
  }
  function propertyName(mod, node) {
    if (node.type !== 'ObjectProperty' || node.computed || node.method) fail(mod, node, '不支持对象展开、方法或计算属性');
    if (node.key.type === 'Identifier') return node.key.name;
    if (['StringLiteral', 'NumericLiteral'].includes(node.key.type)) return String(node.key.value);
    fail(mod, node, '不支持的属性名');
  }
  function lower(mod, node) {
    if (node.type === 'Identifier') return reference(mod, node.name, false, node);
    if (['StringLiteral', 'BooleanLiteral', 'NullLiteral'].includes(node.type)) return { kind: 'literal', value: node.type === 'NullLiteral' ? null : node.value };
    if (node.type === 'NumericLiteral' && Number.isFinite(node.value)) return { kind: 'literal', value: node.value };
    if (node.type === 'UnaryExpression' && ['-', '+'].includes(node.operator) && node.argument.type === 'NumericLiteral' && Number.isFinite(node.argument.value)) {
      return { kind: 'literal', value: node.operator === '-' ? -node.argument.value : node.argument.value };
    }
    if (!['ObjectExpression', 'ArrayExpression'].includes(node.type)) fail(mod, node, `不支持 ${node.type}；配置仅接受静态数据和引用`);
    const object = node.type === 'ObjectExpression';
    const events = [];
    for (const event of mod.events.get(node)) {
      if (!event.member) { events.push({ directive: event.text }); continue; }
      const member = event.member;
      if (!object && member.type === 'SpreadElement') {
        const array = lower(mod, member.argument);
        if (array.kind !== 'array') fail(mod, member, '数组展开的目标必须是静态数组');
        events.push(...array.events);
      } else if (object) {
        events.push({ key: propertyName(mod, member), value: lower(mod, member.value) });
      } else events.push({ value: lower(mod, member) });
    }
    return { kind: object ? 'object' : 'array', events };
  }
  const entry = load(filename, source);
  // Reject unsupported code even in unused bindings; no module side effects
  // are run or silently relied upon by this declarative format.
  for (const mod of modules.values()) {
    for (const name of mod.bindings.keys()) reference(mod, name, false);
    for (const name of mod.exports.keys()) reference(mod, name, true);
  }
  const result = reference(entry, 'default', true);
  if (result.kind !== 'object') fail(entry, null, '配置默认导出必须是静态对象');
  const pages = result.events.filter(event => event.key === 'pages');
  if (!pages.length || pages.some(event => event.value.kind !== 'array')) fail(entry, null, '顶层必须包含 pages 数组');
  function render(value, depth) {
    if (value.kind === 'literal') return JSON.stringify(value.value);
    const object = value.kind === 'object';
    const [open, close] = object ? ['{', '}'] : ['[', ']'];
    if (!value.events.some(event => event.directive)) {
      const lines = value.events.map(event => '  '.repeat(depth + 1) +
        (object ? JSON.stringify(event.key) + ': ' : '') + render(event.value, depth + 1));
      return lines.length ? `${open}\n${lines.join(',\n')}\n${'  '.repeat(depth)}${close}` : open + close;
    }
    const indent = '  '.repeat(depth + 1);
    const groups = [], conditions = [];
    for (const event of value.events) {
      if (event.directive) {
        const [, kind, expression] = event.directive.match(/^#(ifdef|ifndef|endif)(?:\s+(.+))?$/);
        if (kind === 'endif') conditions.pop();
        else conditions.push({
          text: event.directive,
          key: kind + ':' + expression.replace(/\s+/g, ''),
          expression: kind === 'ifndef' ? `!(${expression})` : `(${expression})`,
        });
        continue;
      }
      const signature = JSON.stringify(conditions.map(condition => condition.key));
      let group = groups.at(-1);
      if (!group || group.signature !== signature) {
        group = { signature, conditions: [...conditions], members: [] };
        groups.push(group);
      }
      group.members.push(event);
    }
    const lines = [], previous = [];
    let active = [];
    for (const group of groups) {
      // Retain shared outer conditions and merge adjacent identical blocks.
      let shared = 0;
      while (shared < active.length && shared < group.conditions.length && active[shared].key === group.conditions[shared].key) shared++;
      for (let i = active.length; i > shared; i--) lines.push(indent + '// #endif');
      for (const condition of group.conditions.slice(shared)) lines.push(indent + '// ' + condition.text);
      active = group.conditions;
      if (previous.length) {
        // No extra guard is needed if the current branch guarantees that an
        // earlier group survives. Otherwise protect only the group boundary.
        const guaranteed = previous.some(branch => branch.every(condition => active.some(current => current.key === condition.key)));
        if (!guaranteed) {
          const expressions = previous.map(branch => branch.map(condition => condition.expression).join(' && '));
          lines.push(indent + '// #ifdef ' + [...new Set(expressions)].join(' || '));
        }
        lines.push(indent + ',');
        if (!guaranteed) lines.push(indent + '// #endif');
      }
      // Members in one group always survive together, so ordinary commas suffice.
      lines.push(group.members.map(event => indent + (object ? JSON.stringify(event.key) + ': ' : '') + render(event.value, depth + 1)).join(',\n'));
      previous.push(active);
    }
    for (let i = active.length; i > 0; i--) lines.push(indent + '// #endif');
    return lines.length ? `${open}\n${lines.join('\n')}\n${'  '.repeat(depth)}${close}` : open + close;
  }
  return render(result, 0) + '\n';
}

function validateExpression(expression, fail) {
  const tokens = expression.match(/[A-Za-z_][\w-]*|&&|\|\||!|\(|\)|\S/g) || [];
  let cursor = 0;
  function unary() {
    const token = tokens[cursor++];
    if (token === '!') return unary();
    if (token === '(') { or(); if (tokens[cursor++] !== ')') fail(); return; }
    if (!token || !/^[A-Za-z_][\w-]*$/.test(token)) fail();
  }
  function and() { unary(); while (tokens[cursor] === '&&') { cursor++; unary(); } }
  function or() { and(); while (tokens[cursor] === '||') { cursor++; and(); } }
  or();
  if (cursor !== tokens.length) fail();
}

module.exports = { convertPagesConfig };
