import type { HookMeta } from '../preview/protocol';

// Compiles user JSX/JS in the browser with @babel/standalone (lazy-loaded so
// the first paint stays fast) and extracts hook metadata (variable names +
// call order per component) so the visualizer can label state truthfully.

export interface CompileError {
  message: string;
  line: number | null;
}

export interface CompileResult {
  code?: string;
  meta?: HookMeta[];
  error?: CompileError;
}

const HOOK_NAMES = new Set([
  'useState',
  'useReducer',
  'useRef',
  'useMemo',
  'useEffect',
  'useLayoutEffect',
  'useCallback',
  'useContext',
  'useImperativeHandle',
  'useDebugValue',
]);

const KIND_MAP: Record<string, HookMeta['kind']> = {
  useState: 'state',
  useReducer: 'reducer',
  useRef: 'ref',
  useMemo: 'memo',
  useEffect: 'effect',
  useLayoutEffect: 'layout-effect',
  useCallback: 'callback',
  useContext: 'context',
  useImperativeHandle: 'effect',
  useDebugValue: 'effect',
};

function patternNames(id: any): string[] {
  if (!id) return [];
  if (id.type === 'Identifier') return [id.name];
  if (id.type === 'ArrayPattern')
    return (id.elements || []).filter(Boolean).flatMap(patternNames);
  if (id.type === 'ObjectPattern')
    return (id.properties || []).flatMap((p: any) => patternNames(p.value ?? p.argument));
  if (id.type === 'RestElement') return patternNames(id.argument);
  if (id.type === 'AssignmentPattern') return patternNames(id.left);
  return [];
}

function componentNameOf(fnPath: any): string | null {
  const node = fnPath.node;
  if (node.type === 'FunctionDeclaration' && node.id) return node.id.name;
  const parent = fnPath.parentPath;
  if (parent.isVariableDeclarator() && parent.node.id.type === 'Identifier')
    return parent.node.id.name;
  if (parent.isExportDefaultDeclaration()) return 'App';
  if (parent.isAssignmentExpression() && parent.node.left.type === 'Identifier')
    return parent.node.left.name;
  return null;
}

// Walk a function body WITHOUT descending into nested functions, calling
// onCall for every CallExpression in source order (rules-of-hooks order).
function walkTopLevel(node: any, parent: any, onCall: (call: any, parent: any) => void) {
  if (!node || typeof node.type !== 'string') return;
  if (/Function/.test(node.type)) return; // nested function: handled separately
  if (node.type === 'CallExpression') {
    onCall(node, parent);
  }
  for (const key of Object.keys(node)) {
    if (key === 'type' || key === 'loc' || key === 'start' || key === 'end') continue;
    if (key === 'callee') continue;
    const v = node[key];
    if (Array.isArray(v)) {
      for (const x of v) walkTopLevel(x, node, onCall);
    } else if (v && typeof v.type === 'string') {
      walkTopLevel(v, node, onCall);
    }
  }
}

function metaPlugin(meta: HookMeta[]) {
  return () => ({
    visitor: {
      Function(path: any) {
        const rawName = componentNameOf(path);
        if (!rawName) return;
        const isDefaultExport =
          path.parentPath.isExportDefaultDeclaration() ||
          (path.parentPath.isVariableDeclarator() &&
            path.parentPath.parentPath.isExportDefaultDeclaration());
        const looksLikeComponent = /^[A-Z]/.test(rawName) || isDefaultExport;
        if (!looksLikeComponent) return;
        const compName = /^[A-Z]/.test(rawName) ? rawName : 'App';
        let index = 0;
        walkTopLevel(path.node.body, null, (callNode: any, parent: any) => {
          const callee = callNode.callee;
          if (!callee || callee.type !== 'Identifier' || !HOOK_NAMES.has(callee.name))
            return;
          const names =
            parent && parent.type === 'VariableDeclarator'
              ? patternNames(parent.id)
              : [];
          meta.push({
            component: compName,
            kind: KIND_MAP[callee.name],
            index: index++,
            names,
            line: callNode.loc ? callNode.loc.start.line : 0,
          });
        });
      },
    },
  });
}

let babelPromise: Promise<any> | null = null;

function loadBabel(): Promise<any> {
  if (!babelPromise) babelPromise = import('@babel/standalone');
  return babelPromise;
}

export async function compile(source: string): Promise<CompileResult> {
  try {
    const Babel = await loadBabel();
    const meta: HookMeta[] = [];
    const out = Babel.transform(source, {
      plugins: ['transform-react-jsx', 'transform-modules-commonjs', metaPlugin(meta)],
      retainLines: true,
      filename: 'playground.jsx',
    });
    if (!out || typeof out.code !== 'string') {
      return { error: { message: 'Compilation produced no output.', line: null } };
    }
    return { code: out.code as string, meta };
  } catch (e: any) {
    const message =
      typeof e?.message === 'string' ? e.message.replace(/\s*\(.*?:\d+:\d+\)\s*$/, '') : String(e);
    return { error: { message, line: e?.loc?.line ?? null } };
  }
}

/** Extract the first JSX element from the source for the JSX inspector tab. */
export async function inspectFirstJsx(source: string): Promise<{
  jsxText: string;
  type: string;
  props: { name: string; value: string }[];
  hasExpressionChildren: boolean;
} | null> {
  try {
    const Babel = await loadBabel();
    let found: any = null;
    const plugin = () => ({
      visitor: {
        JSXElement(path: any) {
          if (!found) {
            found = { node: path.node, text: source.slice(path.node.start, path.node.end) };
          }
        },
      },
    });
    Babel.transform(source, {
      plugins: ['transform-react-jsx', plugin],
      filename: 'playground.jsx',
    });
    if (!found) return null;
    const el = found.node.openingElement;
    const type =
      el.name.type === 'JSXIdentifier'
        ? el.name.name
        : source.slice(el.name.start, el.name.end);
    const props = (el.attributes || [])
      .filter((a: any) => a.type === 'JSXAttribute')
      .map((a: any) => {
        const name = a.name.name;
        let value = 'true';
        if (a.value) {
          if (a.value.type === 'StringLiteral') value = JSON.stringify(a.value.value);
          else value = `{${source.slice(a.value.start + 1, a.value.end - 1).trim()}}`;
        }
        return { name, value };
      });
    const hasExpressionChildren = (found.node.children || []).some(
      (c: any) => c.type === 'JSXExpressionContainer',
    );
    return { jsxText: found.text, type, props, hasExpressionChildren };
  } catch {
    return null;
  }
}
