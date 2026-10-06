// Tests the REAL host transform pipeline (src/playground/transform.ts).
import { buildSync } from 'esbuild';
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';

const require = createRequire(import.meta.url);
const projectRoot = new URL('../', import.meta.url).pathname;
mkdirSync(new URL('./dist-test/', import.meta.url), { recursive: true });

buildSync({
  entryPoints: [projectRoot + 'src/playground/transform.ts'],
  bundle: true, platform: 'node', format: 'cjs',
  external: ['@babel/standalone'],
  outfile: projectRoot + 'dist-test/transform.cjs', logLevel: 'silent',
});

const { compile, inspectFirstJsx } = require(projectRoot + 'dist-test/transform.cjs');
const { EXAMPLES } = require(projectRoot + 'dist-test/examples.cjs');

let failed = 0;
const ok = (c, l, extra) => {
  if (c) console.log(`  ✓ ${l}`);
  else { failed++; console.log(`  ✗ ${l}${extra ? ' — ' + extra : ''}`); }
};

console.log('[A] compile() on all examples');
for (const ex of EXAMPLES) {
  const r = await compile(ex.code);
  ok(!r.error && typeof r.code === 'string', `${ex.id} compiles`, r.error?.message);
}

// syntax error path
const bad = await compile('export default function App( { return <div> }');
ok(!!bad.error && bad.error.line != null, 'syntax error reported with line', JSON.stringify(bad.error));

// hook meta on a multi-hook component
const MULTI = `import { useState, useEffect, useRef } from "react";
export default function App() {
  const [count, setCount] = useState(0);
  const [name, setName] = useState("a");
  const ref = useRef(null);
  useEffect(() => {}, [count]);
  return <div ref={ref}>{count}{name}</div>;
}`;
const m = await compile(MULTI);
const metas = m.meta.filter((x) => x.component === 'App');
ok(metas.length === 4, '4 hooks detected', JSON.stringify(metas.length));
ok(metas[0].names[0] === 'count' && metas[0].index === 0, 'hook 0 = count');
ok(metas[1].names[0] === 'name' && metas[1].index === 1, 'hook 1 = name');
ok(metas[2].names[0] === 'ref' && metas[2].index === 2, 'hook 2 = ref');
ok(metas[3].index === 3 && metas[3].names.length === 0, 'hook 3 = bare useEffect');

// classic runtime: no jsx-runtime imports
ok(m.code.includes('React.createElement'), 'classic JSX runtime used');
ok(!m.code.includes('jsx-runtime'), 'no automatic runtime import');

console.log('\n[B] inspectFirstJsx()');
const info = await inspectFirstJsx(EXAMPLES.find((e) => e.id === 'props').code);
ok(info && info.type === 'h2', 'first JSX is h2', JSON.stringify(info?.type));
const info2 = await inspectFirstJsx(EXAMPLES.find((e) => e.id === 'usestate').code);
ok(info2 && info2.type === 'div', 'counter first JSX is div');

console.log(failed === 0 ? '\nTRANSFORM OK' : `\n${failed} FAILURES`);
process.exit(failed ? 1 : 0);
