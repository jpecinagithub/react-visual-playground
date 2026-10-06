import React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { createRunContext, ser, type RunContext } from './instrument';
import type { HookMeta, HostMsg } from './protocol';

// This module is the entry point of preview.html, loaded inside a sandboxed
// iframe. It receives compiled user code from the host app, executes it with
// an instrumented React, and reports everything via postMessage.

const post = (type: string, payload: Record<string, unknown> = {}) => {
  window.parent.postMessage({ src: 'rvp-runner', type, rid, ...payload }, '*');
};

const t = (ctx: RunContext | null) =>
  ctx ? Math.max(0, Math.round(performance.now() - ctx.t0)) : 0;

// --- console capture -------------------------------------------------------
const LEVELS = ['log', 'warn', 'error', 'info', 'debug'] as const;
for (const level of LEVELS) {
  const orig = (console[level] as Function).bind(console);
  (console as any)[level] = (...args: unknown[]) => {
    try {
      post('log', { level, args: args.map((a) => ser(a)), t: t(ctx) });
    } catch {
      /* noop */
    }
    orig(...args);
  };
}

// --- global error capture ---------------------------------------------------
window.addEventListener('error', (e) => {
  post('error', {
    message: e.message || 'Unknown error',
    line: typeof e.lineno === 'number' ? e.lineno : null,
    t: t(ctx),
  });
});

window.addEventListener('unhandledrejection', (e: PromiseRejectionEvent) => {
  const reason: any = e.reason;
  post('error', {
    message:
      reason instanceof Error
        ? `${reason.name}: ${reason.message}`
        : `Unhandled rejection: ${String(reason)}`,
    line: null,
    t: t(ctx),
  });
});

function stackLine(err: unknown): number | null {
  const stack = (err as any)?.stack;
  if (typeof stack !== 'string') return null;
  const m = stack.match(/<anonymous>:(\d+)(:\d+)?/);
  return m ? parseInt(m[1], 10) : null;
}

// --- run --------------------------------------------------------------------
let ctx: RunContext | null = null;
let root: Root | null = null;
let rid = 0;

// Observe real DOM mutations so the timeline can honestly say "DOM updated".
let domTimer: number | null = null;
let domCount = 0;
let domObserver: MutationObserver | null = null;
function armDomObserver() {
  const container = document.getElementById('root');
  if (!container) return;
  if (domObserver) domObserver.disconnect();
  const obs = new MutationObserver(() => {
    domCount++;
    if (domTimer !== null) return;
    domTimer = window.setTimeout(() => {
      domTimer = null;
      const n = domCount;
      domCount = 0;
      post('dom', { mutations: n, t: t(ctx) });
    }, 120);
  });
  obs.observe(container, { childList: true, subtree: true, characterData: true });
  domObserver = obs;
}

function runCode(msgRid: number, code: string, meta: HookMeta[], highlight: boolean) {
  rid = msgRid;
  ctx = createRunContext(post, meta, highlight);
  try {
    const container = document.getElementById('root');
    if (!container) throw new Error('Preview container not found.');
    // Reuse a single root: rendering a new (per-run) component type forces a
    // full remount of the previous tree, with proper effect cleanups.
    if (!root) root = createRoot(container);

    const module = { exports: {} as Record<string, unknown> };
    const require = (name: string) => {
      if (name === 'react') return (ctx as RunContext).React;
      throw new Error(
        `Cannot find module '${name}'. Only 'react' can be imported in the playground.`,
      );
    };
    // The compiled code is CommonJS (babel transform-modules-commonjs).
    const fn = new Function('require', 'module', 'exports', 'React', code);
    fn(require, module, module.exports, (ctx as RunContext).React);

    const def = (module.exports as any).default ?? module.exports;
    if (typeof def !== 'function') {
      throw new Error(
        'The default export must be a React component (a function). Example: `export default function App() { … }`',
      );
    }
    post('mounted', { t: 0 });
    root.render((ctx as RunContext).React.createElement(def, null));
    armDomObserver();
  } catch (err: any) {
    post('error', {
      message: err?.message || String(err),
      line: stackLine(err),
      t: t(ctx),
    });
  }
}

window.addEventListener('message', (e: MessageEvent) => {
  const d = e.data as HostMsg | undefined;
  if (!d || d.src !== 'rvp-host') return;
  if (d.type === 'run') {
    runCode(d.rid, d.code, d.meta, d.highlight);
  } else if (d.type === 'set-highlight' && ctx) {
    ctx.highlight = d.highlight;
  }
});

// Keep React referenced so bundlers don't tree-shake the import.
void React;

post('ready', {});
