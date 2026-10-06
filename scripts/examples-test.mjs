// Verifies all 15 examples: compile + mount in jsdom, report any failure.
import { buildSync } from 'esbuild';
import { JSDOM } from 'jsdom';
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';

const require = createRequire(import.meta.url);
const projectRoot = new URL('../', import.meta.url).pathname;
mkdirSync(new URL('./dist-test/', import.meta.url), { recursive: true });

buildSync({
  entryPoints: [projectRoot + 'src/preview/instrument.ts'],
  bundle: true, platform: 'node', format: 'cjs',
  external: ['react', 'react-dom'],
  outfile: projectRoot + 'dist-test/instrument.cjs', logLevel: 'silent',
});
buildSync({
  entryPoints: [projectRoot + 'src/content/examples.ts'],
  bundle: true, platform: 'node', format: 'cjs',
  outfile: projectRoot + 'dist-test/examples.cjs', logLevel: 'silent',
});

const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
  url: 'http://localhost/', pretendToBeVisual: true,
});
global.window = dom.window;
global.document = dom.window.document;
global.requestAnimationFrame = (cb) => setTimeout(cb, 0);

const React = require(projectRoot + 'node_modules/react');
const { createRoot } = require(projectRoot + 'node_modules/react-dom/client');
const Babel = require(projectRoot + 'node_modules/@babel/standalone');
const { createRunContext } = require(projectRoot + 'dist-test/instrument.cjs');
const { EXAMPLES, FREE_CODE } = require(projectRoot + 'dist-test/examples.cjs');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const errors = [];
// silence React's error logging noise for expected-error-free runs
const origConsoleError = console.error;
console.error = (...a) => {
  const s = String(a[0] ?? '');
  if (s.includes('The above error occurred')) return;
  origConsoleError(...a);
};

let n = 0;
for (const ex of EXAMPLES) {
  n++;
  const label = `${String(n).padStart(2, '0')} ${ex.id}`;
  try {
    const out = Babel.transform(ex.code, {
      plugins: ['transform-react-jsx', 'transform-modules-commonjs'],
      retainLines: true, filename: 'playground.jsx',
    });
    const messages = [];
    const ctx = createRunContext((t, p = {}) => messages.push({ type: t, ...p }), [], false);
    const container = document.getElementById('root');
    try { container.innerHTML = ''; } catch {}
    const root = createRoot(container);
    const module = { exports: {} };
    const fn = new Function('require', 'module', 'exports', 'React', out.code);
    fn((name) => { if (name === 'react') return ctx.React; throw new Error('bad import'); },
       module, module.exports, ctx.React);
    const def = module.exports.default ?? module.exports;
    if (typeof def !== 'function') throw new Error('default export is not a function component');
    // catch async render errors
    await new Promise((resolve, reject) => {
      const onErr = (e) => { process.removeListener('uncaughtException', onErr); reject(e); };
      process.on('uncaughtException', onErr);
      try { root.render(ctx.React.createElement(def, null)); } catch (e) { process.removeListener('uncaughtException', onErr); reject(e); return; }
      setTimeout(() => { process.removeListener('uncaughtException', onErr); resolve(); }, 700);
    });
    const errs = messages.filter((m) => m.type === 'error');
    const trees = messages.filter((m) => m.type === 'tree');
    if (errs.length > 0) {
      errors.push(label + ' — runtime error: ' + errs[0].message);
      console.log(`  ✗ ${label}: ${errs[0].message}`);
    } else if (trees.length === 0) {
      errors.push(label + ' — no tree snapshot posted');
      console.log(`  ✗ ${label}: no tree snapshot`);
    } else {
      const t = trees[trees.length - 1].tree;
      const countNodes = (x) => 1 + x.children.reduce((a, c) => a + countNodes(c), 0);
      console.log(`  ✓ ${label}: mounted (${countNodes(t)} nodes, root=${t.name})`);
    }
    try { root.unmount(); } catch {}
  } catch (e) {
    errors.push(label + ' — ' + e.message.split('\n')[0]);
    console.log(`  ✗ ${label}: ${e.message.split('\n')[0]}`);
  }
}

// FREE_CODE sanity
try {
  const out = Babel.transform(FREE_CODE, { plugins: ['transform-react-jsx', 'transform-modules-commonjs'] });
  console.log(`  ✓ free playground code compiles`);
} catch (e) { errors.push('free-code — ' + e.message); console.log(`  ✗ free-code: ${e.message}`); }

console.log(errors.length === 0 ? '\nALL EXAMPLES OK' : `\n${errors.length} FAILURES`);
process.exit(errors.length ? 1 : 0);
