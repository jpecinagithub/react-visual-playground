// Functional test of the instrumented React runtime (no browser needed).
// Bundles src/preview/instrument.ts, runs example snippets in jsdom with
// React 18, and asserts the postMessage event stream.
import { buildSync } from 'esbuild';
import { JSDOM } from 'jsdom';
import { createRequire } from 'node:module';
import { writeFileSync, mkdirSync } from 'node:fs';

const require = createRequire(import.meta.url);
const projectRoot = new URL('../', import.meta.url).pathname;

mkdirSync(new URL('./dist-test/', import.meta.url), { recursive: true });
buildSync({
  entryPoints: [projectRoot + 'src/preview/instrument.ts'],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  external: ['react', 'react-dom'],
  outfile: projectRoot + 'dist-test/instrument.cjs',
  logLevel: 'silent',
});
buildSync({
  entryPoints: [projectRoot + 'src/playground/errors.ts'],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  outfile: projectRoot + 'dist-test/errors.cjs',
  logLevel: 'silent',
});

// ---- jsdom globals -----------------------------------------------------------
const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
  url: 'http://localhost/',
  pretendToBeVisual: true,
});
global.window = dom.window;
global.document = dom.window.document;
global.MutationObserver = dom.window.MutationObserver;
global.requestAnimationFrame = (cb) => setTimeout(cb, 0);
global.cancelAnimationFrame = (id) => clearTimeout(id);

const React = require(projectRoot + 'node_modules/react');
const { createRoot } = require(projectRoot + 'node_modules/react-dom/client');
const Babel = require(projectRoot + 'node_modules/@babel/standalone');
const { createRunContext } = require(projectRoot + 'dist-test/instrument.cjs');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---- compile (same pipeline as the host) -------------------------------------
function compile(source) {
  const meta = [];
  const plugin = () => ({
    visitor: {
      Function(path) {
        const node = path.node;
        let name = null;
        if (node.type === 'FunctionDeclaration' && node.id) name = node.id.name;
        else if (path.parentPath.isVariableDeclarator() && path.parentPath.node.id.type === 'Identifier')
          name = path.parentPath.node.id.name;
        else if (path.parentPath.isExportDefaultDeclaration()) name = 'App';
        if (!name || !/^[A-Z]/.test(name)) return;
        const HOOKS = new Set(['useState','useReducer','useRef','useMemo','useEffect','useLayoutEffect','useCallback','useContext']);
        let index = 0;
        const walk = (n, parent) => {
          if (!n || typeof n.type !== 'string') return;
          if (/Function/.test(n.type)) return;
          if (n.type === 'CallExpression') {
            const callee = n.callee;
            if (callee && callee.type === 'Identifier' && HOOKS.has(callee.name)) {
              let names = [];
              if (parent && parent.type === 'VariableDeclarator') {
                const id = parent.id;
                if (id.type === 'ArrayPattern') names = id.elements.filter(Boolean).map((e) => e.name);
                else if (id.type === 'Identifier') names = [id.name];
              }
              meta.push({ component: name, kind: 'state', index: index++, names, line: 0 });
            }
          }
          for (const k of Object.keys(n)) {
            if (['type','loc','start','end','callee'].includes(k)) continue;
            const v = n[k];
            if (Array.isArray(v)) v.forEach((x) => walk(x, n));
            else if (v && typeof v.type === 'string') walk(v, n);
          }
        };
        walk(node.body, null);
      },
    },
  });
  const out = Babel.transform(source, {
    plugins: ['transform-react-jsx', 'transform-modules-commonjs', plugin],
    retainLines: true,
    filename: 'playground.jsx',
  });
  return { code: out.code, meta };
}

// ---- runCode (mirrors runner-main.ts) -----------------------------------------
function makeRunner() {
  const messages = [];
  let ctx = null;
  let root = null;
  const post = (type, payload = {}) => messages.push({ type, ...payload });
  return {
    messages,
    clear: () => messages.splice(0, messages.length),
    byType: (t) => messages.filter((m) => m.type === t),
    run(source) {
      const { code, meta } = compile(source);
      ctx = createRunContext(post, meta, true);
      const container = document.getElementById('root');
      if (root) { try { root.unmount(); } catch {} }
      container.innerHTML = '';
      root = createRoot(container);
      const module = { exports: {} };
      const rq = (name) => {
        if (name === 'react') return ctx.React;
        throw new Error(`Cannot find module '${name}'`);
      };
      const fn = new Function('require', 'module', 'exports', 'React', code);
      fn(rq, module, module.exports, ctx.React);
      const def = module.exports.default ?? module.exports;
      root.render(ctx.React.createElement(def, null));
      return ctx;
    },
  };
}

// ---- assertions -----------------------------------------------------------------
let passed = 0, failed = 0;
function ok(cond, label, extra) {
  if (cond) { passed++; console.log(`  ✓ ${label}`); }
  else { failed++; console.log(`  ✗ ${label}${extra ? ' — ' + extra : ''}`); }
}
function click(el) {
  el.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true, cancelable: true }));
}

const COUNTER = `import { useState } from "react";
export default function Counter() {
  const [count, setCount] = useState(0);
  return (
    <div>
      <h2>Contador</h2>
      <p>{count}</p>
      <button onClick={() => setCount(count + 1)}>Incrementar</button>
    </div>
  );
}`;

const PROPS_EX = `function Greeting({ name }) {
  return <h2>Hola {name}</h2>;
}
export default function App() {
  return <Greeting name="Carlos" />;
}`;

const COND_EX = `import { useState } from "react";
function Dashboard() { return <p>Panel</p>; }
function Login() { return <p>Entrar</p>; }
export default function App() {
  const [logged, setLogged] = useState(true);
  return (
    <div>
      <button onClick={() => setLogged(!logged)}>toggle</button>
      {logged ? <Dashboard /> : <Login />}
    </div>
  );
}`;

const EFFECT_EX = `import { useEffect, useState } from "react";
export default function App() {
  const [count, setCount] = useState(0);
  useEffect(() => { document.title = "Count " + count; }, [count]);
  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}`;

const ERROR_EX = `export default function App() {
  const user = undefined;
  return <h1>{user.name}</h1>;
}`;

const r = makeRunner();

console.log('\n[1] Counter: mount');
r.run(COUNTER);
await sleep(250);
let trees = r.byType('tree');
ok(trees.length > 0, 'tree snapshot posted');
let tree = trees[trees.length - 1].tree;
ok(tree && tree.name === 'Counter', 'root is Counter', JSON.stringify(tree?.name));
ok(tree && tree.renders === 1, 'Counter renders = 1', String(tree?.renders));
ok(tree && tree.state.count === 0, 'state.count = 0', JSON.stringify(tree?.state));
let states = r.byType('state');
ok(states.length === 0, 'no state-change events on mount');
let renders = r.byType('render');
ok(renders.length === 1 && renders[0].count === 1, 'one render event, count 1');

console.log('\n[2] Counter: click -> state -> render');
const btn = document.querySelector('button');
ok(!!btn, 'button found in DOM');
ok(document.querySelector('p').textContent === '0', 'DOM shows 0');
r.clear();
click(btn);
await sleep(250);
states = r.byType('state');
ok(states.length === 1, 'one state-change event', JSON.stringify(r.byType('state').length));
ok(states[0]?.variable === 'count', 'variable named "count" (from AST meta)', states[0]?.variable);
ok(states[0]?.before === 0 && states[0]?.after === 1, 'count 0 -> 1', JSON.stringify([states[0]?.before, states[0]?.after]));
renders = r.byType('render');
ok(renders.some((m) => m.name === 'Counter' && m.count === 2), 'Counter re-rendered (count 2)');
ok(document.querySelector('p').textContent === '1', 'DOM updated to 1');
const evts = r.byType('event');
ok(evts.some((m) => m.phase === 'start' && m.event === 'click' && m.handler.length > 0), 'click event captured with handler name', JSON.stringify(evts.map(e=>e.handler)));
trees = r.byType('tree');
tree = trees[trees.length - 1].tree;
ok(tree.state.count === 1 && tree.renders === 2, 'tree snapshot updated', JSON.stringify({s: tree.state, r: tree.renders}));

console.log('\n[3] Props example');
r.run(PROPS_EX);
await sleep(250);
trees = r.byType('tree');
tree = trees[trees.length - 1].tree;
ok(tree.name === 'App' && tree.children.length === 1, 'App -> one child', JSON.stringify(tree?.children?.length));
const greeting = tree.children[0];
ok(greeting.name === 'Greeting', 'child is Greeting');
ok(greeting.props.name === 'Carlos', 'props.name = "Carlos"', JSON.stringify(greeting.props));
ok(r.byType('props').length === 0, 'no props-change events on mount (initial props in tree)');

console.log('\n[4] Conditional rendering');
r.run(COND_EX);
await sleep(250);
trees = r.byType('tree');
tree = trees[trees.length - 1].tree;
ok(tree.children.some((c) => c.name === 'Dashboard'), 'Dashboard mounted initially');
r.clear();
click(document.querySelector('button'));
await sleep(250);
trees = r.byType('tree');
tree = trees[trees.length - 1].tree;
ok(tree.children.some((c) => c.name === 'Login'), 'Login mounted after toggle');
ok(!tree.children.some((c) => c.name === 'Dashboard'), 'Dashboard unmounted after toggle');

console.log('\n[5] useEffect');
r.run(EFFECT_EX);
await sleep(250);
const effects = r.byType('effect');
ok(effects.some((m) => m.phase === 'run' && m.name === 'App'), 'effect run captured for App');
r.clear();
click(document.querySelector('button'));
await sleep(250);
const effects2 = r.byType('effect');
ok(effects2.some((m) => m.phase === 'run'), 'effect re-ran after state change');

console.log('\n[6] Error surfacing');
await new Promise((resolve) => {
  let done = false;
  const finish = (cond, label, extra) => { if (!done) { done = true; process.removeListener('uncaughtException', onErr); ok(cond, label, extra); resolve(); } };
  const onErr = (e) => finish(/reading 'name'/.test(e.message), 'render error propagates to window.onerror equivalent', e.message);
  process.on('uncaughtException', onErr);
  try {
    const { code, meta } = compile(ERROR_EX);
    const ctx2 = createRunContext(() => {}, meta, false);
    const container = document.getElementById('root');
    container.innerHTML = '';
    const root2 = createRoot(container);
    const module = { exports: {} };
    const fn = new Function('require', 'module', 'exports', 'React', code);
    fn((n) => { if (n === 'react') return ctx2.React; throw new Error('nope'); }, module, module.exports, ctx2.React);
    root2.render(ctx2.React.createElement(module.exports.default, null));
    setTimeout(() => finish(false, 'error was raised', 'timed out waiting for the error'), 2000);
  } catch (e) { finish(/reading 'name'/.test(e.message), 'render error thrown synchronously', e.message); }
});

console.log('\n[6b] Friendly error classification');
const { classifyError } = require(projectRoot + 'dist-test/errors.cjs');
const ce = classifyError("Cannot read properties of undefined (reading 'name')", 3);
ok(ce.kind === 'undefined-prop' && ce.detail === 'name' && ce.line === 3, 'undefined-prop classified with detail+line', JSON.stringify(ce));
const ce2 = classifyError('Too many re-renders.', null);
ok(ce2.kind === 'too-many-renders', 'too-many-renders classified');

console.log('\n[7] Hook meta extraction (host transform)');
const { meta } = compile(COUNTER);
const m0 = meta.find((m) => m.component === 'Counter' && m.index === 0);
ok(!!m0 && m0.names[0] === 'count' && m0.names[1] === 'setCount', 'meta: count/setCount names', JSON.stringify(m0));

console.log(`\n==== ${passed} passed, ${failed} failed ====`);
process.exit(failed > 0 ? 1 : 0);
