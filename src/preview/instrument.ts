import React from 'react';
import type { HookMeta, TreeNode } from './protocol';

/**
 * Instrumented React.
 *
 * How it works:
 * - `wrappedCreateElement` intercepts every React.createElement call.
 * - Function components are wrapped once (cached) in `Wrapped`, which
 *   counts renders, diffs props, tracks state via wrapped hooks, and
 *   wraps event-handler props to observe the event -> state -> render chain.
 * - The VNode for an element is claimed AT CREATION TIME (when the creator
 *   component is on top of the render stack) and its id travels on the
 *   element via a hidden `__rvp_nid` prop, stripped before user code sees it.
 *   This keeps parent/child identity exact across re-renders, conditional
 *   branches and subtree updates.
 */

export interface PostFn {
  (type: string, payload?: Record<string, unknown>): void;
}

export interface VNode {
  id: number;
  name: string;
  memo: boolean;
  parent: number | null;
  children: number[];
  renders: number;
  props: Record<string, unknown>;
  state: Record<string, unknown>;
  hookCursor: number;
  /** Incremented every time this node's component renders. */
  epoch: number;
  /** Per-render count of created child elements, keyed by wrapped type. */
  counts: Map<Function, number>;
  /** epoch of the parent at the moment this node was (re)claimed. */
  claimEpoch: number;
  /** Wrapped component type (for sibling disambiguation). */
  typeRef?: Function;
  /** Occurrence index among same-type siblings. */
  occ?: number;
}

export interface RunContext {
  post: PostFn;
  meta: HookMeta[];
  highlight: boolean;
  t0: number;
  seq: number;
  nodes: Map<number, VNode>;
  rootNode: VNode | null;
  stack: VNode[];
  eventDepth: number;
  wrapCache: WeakMap<object, Function>;
  treeQueued: boolean;
  React: any;
}

const NID_PROP = '__rvp_nid';
const MEMO_TYPE = Symbol.for('react.memo');

// ---------------------------------------------------------------------------
// Safe serialization of arbitrary user values for postMessage
// ---------------------------------------------------------------------------
export function ser(v: unknown, depth = 0, seen: Set<unknown> = new Set()): unknown {
  if (v === null || v === undefined) return v;
  const t = typeof v;
  if (t === 'string' || t === 'number' || t === 'boolean') return v;
  if (t === 'bigint') return `${String(v)}n`;
  if (t === 'function') {
    const f = v as Function & { __rvp_handler?: string };
    if (f.__rvp_handler) return `[handler ${f.__rvp_handler}]`;
    return `[function ${f.name || 'anonymous'}]`;
  }
  if (t === 'symbol') return String(v);
  if (depth > 4) return '[…]';
  if (seen.has(v)) return '[circular]';
  seen.add(v);
  try {
    if (v instanceof Date) return `Date(${v.toISOString()})`;
    if (v instanceof Error) return `${v.name}: ${v.message}`;
    if (v instanceof Promise) return '[Promise]';
    if (Array.isArray(v)) return v.slice(0, 20).map((x) => ser(x, depth + 1, seen));
    const o = v as Record<string, unknown>;
    if (o.$$typeof) return '[React element]';
    const out: Record<string, unknown> = {};
    for (const k of Object.keys(o).slice(0, 25)) {
      try {
        out[k] = ser(o[k], depth + 1, seen);
      } catch {
        out[k] = '[unserializable]';
      }
    }
    return out;
  } finally {
    seen.delete(v);
  }
}

function now(ctx: RunContext): number {
  return Math.max(0, Math.round(performance.now() - ctx.t0));
}

function findMeta(ctx: RunContext, component: string, index: number): HookMeta | undefined {
  return ctx.meta.find((m) => m.component === component && m.index === index);
}

// ---------------------------------------------------------------------------
// Tree bookkeeping
// ---------------------------------------------------------------------------
function serializeProps(props: any): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (!props || typeof props !== 'object') return out;
  for (const k of Object.keys(props)) {
    if (k === NID_PROP || k.startsWith('__rvp_')) continue;
    if (k === 'children') {
      const c = props.children;
      const n = Array.isArray(c) ? c.length : c == null ? 0 : 1;
      out.children = n === 0 ? '∅' : `[${n}]`;
    } else {
      out[k] = ser(props[k]);
    }
  }
  return out;
}

function diffObjects(
  a: Record<string, unknown>,
  b: Record<string, unknown>,
): Record<string, { before: unknown; after: unknown }> {
  const changed: Record<string, { before: unknown; after: unknown }> = {};
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const k of keys) {
    let sa: string | undefined;
    let sb: string | undefined;
    try {
      sa = JSON.stringify(a[k]);
    } catch {
      sa = undefined;
    }
    try {
      sb = JSON.stringify(b[k]);
    } catch {
      sb = undefined;
    }
    if (sa !== sb) changed[k] = { before: a[k], after: b[k] };
  }
  return changed;
}

function snapshotNode(n: VNode, ctx: RunContext): TreeNode {
  return {
    id: n.id,
    name: n.name,
    renders: n.renders,
    memo: n.memo,
    props: n.props,
    state: n.state,
    children: n.children
      .map((cid) => ctx.nodes.get(cid))
      .filter((c): c is VNode => !!c)
      .map((c) => snapshotNode(c, ctx)),
  };
}

function deleteSubtree(ctx: RunContext, id: number) {
  const n = ctx.nodes.get(id);
  if (!n) return;
  for (const cid of n.children) deleteSubtree(ctx, cid);
  ctx.nodes.delete(id);
}

function scheduleTreePost(ctx: RunContext) {
  if (ctx.treeQueued) return;
  ctx.treeQueued = true;
  queueMicrotask(() => {
    ctx.treeQueued = false;
    ctx.post('tree', {
      tree: ctx.rootNode ? snapshotNode(ctx.rootNode, ctx) : null,
      t: now(ctx),
    });
  });
}

function flash(dom: Element) {
  try {
    dom.classList.add('rvp-flash');
    window.setTimeout(() => dom.classList.remove('rvp-flash'), 650);
  } catch {
    /* noop */
  }
}

function maybeHighlight(ctx: RunContext, out: any): any {
  if (!out || typeof out !== 'object' || typeof out.type !== 'string') return out;
  const prevRef: any = (out as any).ref;
  return ctx.React.cloneElement(out, {
    ref: (dom: any) => {
      if (typeof prevRef === 'function') {
        try {
          prevRef(dom);
        } catch {
          /* noop */
        }
      } else if (prevRef && typeof prevRef === 'object') {
        try {
          prevRef.current = dom;
        } catch {
          /* noop */
        }
      }
      if (dom && dom.nodeType === 1) flash(dom);
    },
  });
}

// ---------------------------------------------------------------------------
// Component wrapping
// ---------------------------------------------------------------------------
function getWrapped(ctx: RunContext, type: any): Function {
  const cached = ctx.wrapCache.get(type);
  if (cached) return cached;

  // Preserve React.memo semantics: wrap the inner function, re-apply memo.
  let target: Function = type;
  let isMemo = false;
  let memoCompare: any;
  if (type && typeof type === 'object' && type.$$typeof === MEMO_TYPE) {
    target = type.type;
    isMemo = true;
    memoCompare = type.compare;
  }

  const name: string =
    (type as any).displayName || (target as any).displayName || target.name || 'Anonymous';

  function Wrapped(props: any) {
    const nid = props != null ? props[NID_PROP] : undefined;
    const node = typeof nid === 'number' ? ctx.nodes.get(nid) : undefined;
    if (!node) {
      // Should not happen: element created outside our createElement.
      const { [NID_PROP]: _drop, ...clean } = props || {};
      const proto = (target as any).prototype;
      return proto && proto.isReactComponent
        ? React.createElement(target as any, clean)
        : (target as any).call(undefined, clean);
    }
    const { [NID_PROP]: _drop, ...cleanProps } = props;

    const firstRender = node.renders === 0;
    node.renders++;
    node.hookCursor = 0;
    node.epoch++;
    node.counts = new Map();

    const nextProps = serializeProps(cleanProps);
    const changed = diffObjects(node.props, nextProps);
    node.props = nextProps;

    ctx.stack.push(node);
    let out: any;
    try {
      const proto = (target as any).prototype;
      const isClass = proto && proto.isReactComponent;
      out = isClass
        ? React.createElement(target as any, cleanProps)
        : (target as any).call(undefined, cleanProps);
    } finally {
      ctx.stack.pop();
    }

    ctx.post('render', { nodeId: node.id, name, count: node.renders, t: now(ctx) });
    if (!firstRender && Object.keys(changed).length > 0) {
      ctx.post('props', { nodeId: node.id, name, changed, t: now(ctx) });
    }
    if (ctx.highlight) out = maybeHighlight(ctx, out);

    // After commit: drop children that were not re-claimed this render,
    // then publish one tree snapshot per commit.
    React.useEffect(() => {
      const doomed: number[] = [];
      node.children = node.children.filter((cid) => {
        const c = ctx.nodes.get(cid);
        if (c && c.claimEpoch === node.epoch) return true;
        if (c) doomed.push(cid);
        return false;
      });
      for (const cid of doomed) deleteSubtree(ctx, cid);
      scheduleTreePost(ctx);
    });

    return out;
  }

  (Wrapped as any).__rvp_wrapped = true;
  (Wrapped as any).displayName = name;

  const finalExport: Function = isMemo ? React.memo(Wrapped as any, memoCompare) : Wrapped;
  (finalExport as any).__rvp_wrapped = true;

  ctx.wrapCache.set(type, finalExport);
  return finalExport;
}

/** Claim (or re-claim) the child VNode for an element being created. */
function claimChild(ctx: RunContext, wrappedType: Function, childName: string, isMemo: boolean): VNode {
  const creator = ctx.stack.length ? ctx.stack[ctx.stack.length - 1] : null;
  const parent = creator || ctx.rootNode;

  if (!parent) {
    // Very first element: the root.
    const node: VNode = {
      id: ++ctx.seq,
      name: childName,
      memo: isMemo,
      parent: null,
      children: [],
      renders: 0,
      props: {},
      state: {},
      hookCursor: 0,
      epoch: 0,
      counts: new Map(),
      claimEpoch: 0,
    };
    ctx.nodes.set(node.id, node);
    ctx.rootNode = node;
    return node;
  }

  const occ = (parent.counts.get(wrappedType) || 0) + 1;
  parent.counts.set(wrappedType, occ);

  let node = parent.children
    .map((cid) => ctx.nodes.get(cid))
    .find(
      (c) =>
        c &&
        c.name === childName &&
        c.typeRef === wrappedType &&
        c.occ === occ &&
        c.claimEpoch !== parent.epoch,
    );

  if (!node) {
    node = {
      id: ++ctx.seq,
      name: childName,
      memo: isMemo,
      parent: parent.id,
      children: [],
      renders: 0,
      props: {},
      state: {},
      hookCursor: 0,
      epoch: 0,
      counts: new Map(),
      claimEpoch: parent.epoch,
      typeRef: wrappedType,
      occ,
    };
    ctx.nodes.set(node.id, node);
    parent.children.push(node.id);
  } else {
    node.claimEpoch = parent.epoch;
  }
  return node;
}

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------
const EVENT_RE = /^on[A-Z]/;

function wrapEventProps(ctx: RunContext, props: any): any {
  const creator = ctx.stack.length ? ctx.stack[ctx.stack.length - 1].name : '—';
  let out: any = null;
  for (const k of Object.keys(props)) {
    const v = (props as any)[k];
    if (EVENT_RE.test(k) && typeof v === 'function') {
      if (!out) out = { ...props };
      const orig: Function = v;
      const handlerName = orig.name || 'anonymous';
      const eventName = k.slice(2).toLowerCase();
      const wrapped = function (this: unknown, ...args: any[]) {
        ctx.post('event', {
          phase: 'start',
          event: eventName,
          handler: handlerName,
          component: creator,
          t: now(ctx),
        });
        ctx.eventDepth++;
        try {
          return orig.apply(this, args);
        } finally {
          ctx.eventDepth--;
          ctx.post('event', {
            phase: 'end',
            event: eventName,
            handler: handlerName,
            component: creator,
            t: now(ctx),
          });
        }
      };
      (wrapped as any).__rvp_handler = handlerName;
      out[k] = wrapped;
    }
  }
  return out || props;
}

function wrappedCreateElement(
  ctx: RunContext,
  type: any,
  props: any,
  ...children: any[]
) {
  const wrappable =
    (typeof type === 'function' ||
      (type && typeof type === 'object' && type.$$typeof === MEMO_TYPE)) &&
    !(type as any).__rvp_wrapped;

  if (wrappable) {
    const wrappedType = getWrapped(ctx, type);
    const isMemo = type && typeof type === 'object' && type.$$typeof === MEMO_TYPE;
    const childName: string =
      (type as any).displayName ||
      (type as any).type?.displayName ||
      (type as any).type?.name ||
      type.name ||
      'Anonymous';
    const node = claimChild(ctx, wrappedType, childName, isMemo);
    const withId = props ? { ...props, [NID_PROP]: node.id } : { [NID_PROP]: node.id };
    return React.createElement(wrappedType as any, withId, ...children);
  }

  if (typeof type === 'string' && props) {
    props = wrapEventProps(ctx, props);
  }
  return React.createElement(type, props, ...children);
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------
function useSlot(ctx: RunContext): { node: VNode | null; index: number } {
  const node = ctx.stack.length ? ctx.stack[ctx.stack.length - 1] : null;
  const index = node ? node.hookCursor++ : -1;
  return { node, index };
}

function hookUseState(ctx: RunContext, initial: any): [any, any] {
  const { node, index } = useSlot(ctx);
  const [val, setVal] = React.useState(initial);
  const ref = React.useRef(val);
  if (ref.current !== val) ref.current = val;
  const meta = node ? findMeta(ctx, node.name, index) : undefined;
  const varName = meta?.names[0] || `state${index}`;
  if (node) node.state[varName] = ser(val);
  const set = React.useCallback((updater: any) => {
    const before = ref.current;
    let after: any;
    try {
      after = typeof updater === 'function' ? updater(before) : updater;
    } catch {
      after = undefined;
    }
    ref.current = after;
    if (node) node.state[varName] = ser(after);
    ctx.post('state', {
      nodeId: node ? node.id : null,
      name: node ? node.name : meta?.component || '?',
      variable: varName,
      before: ser(before),
      after: ser(after),
      t: now(ctx),
    });
    setVal(updater);
  }, []);
  return [val, set];
}

function hookUseReducer(
  ctx: RunContext,
  reducer: any,
  init: any,
  initFn?: any,
): [any, any] {
  const { node, index } = useSlot(ctx);
  const [state, dispatch] = (
    initFn ? React.useReducer(reducer, init, initFn) : React.useReducer(reducer, init)
  ) as [any, React.Dispatch<any>];
  const ref = React.useRef(state);
  if (ref.current !== state) ref.current = state;
  const meta = node ? findMeta(ctx, node.name, index) : undefined;
  const varName = meta?.names[0] || `reducer${index}`;
  if (node) node.state[varName] = ser(state);
  const wrappedDispatch = React.useCallback((action: any) => {
    const before = ref.current;
    let after: any;
    try {
      after = reducer(before, action);
    } catch {
      after = undefined;
    }
    ref.current = after;
    if (node) node.state[varName] = ser(after);
    ctx.post('state', {
      nodeId: node ? node.id : null,
      name: node ? node.name : meta?.component || '?',
      variable: varName,
      before: ser(before),
      after: ser(after),
      t: now(ctx),
    });
    dispatch(action);
  }, []);
  return [state, wrappedDispatch];
}

function makeEffectHook(
  ctx: RunContext,
  orig: (fn: (...a: any[]) => any, deps?: any[]) => void,
) {
  return (fn: (...a: any[]) => any, deps?: any[]) => {
    const { node, index } = useSlot(ctx);
    const cname = node ? node.name : '?';
    return orig(
      (...a: any[]) => {
        ctx.post('effect', { phase: 'run', name: cname, index, t: now(ctx) });
        const cleanup = fn(...a);
        if (typeof cleanup === 'function') {
          return (...c: any[]) => {
            ctx.post('effect', { phase: 'cleanup', name: cname, index, t: now(ctx) });
            return (cleanup as Function)(...c);
          };
        }
        return cleanup;
      },
      deps,
    );
  };
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------
export function createRunContext(
  post: PostFn,
  meta: HookMeta[],
  highlight: boolean,
): RunContext {
  const ctx: RunContext = {
    post,
    meta,
    highlight,
    t0: performance.now(),
    seq: 0,
    nodes: new Map(),
    rootNode: null,
    stack: [],
    eventDepth: 0,
    wrapCache: new WeakMap(),
    treeQueued: false,
    React: null,
  };

  ctx.React = {
    ...React,
    createElement: (type: any, props: any, ...children: any[]) =>
      wrappedCreateElement(ctx, type, props, ...children),
    useState: (i: any) => hookUseState(ctx, i),
    useReducer: (r: any, i: any, f?: any) => hookUseReducer(ctx, r, i, f),
    useEffect: makeEffectHook(ctx, React.useEffect),
    useLayoutEffect: makeEffectHook(ctx, React.useLayoutEffect),
    useMemo: (fn: any, deps?: any[]) => {
      useSlot(ctx);
      return React.useMemo(fn, deps as React.DependencyList);
    },
    useCallback: (fn: any, deps?: any[]) => {
      useSlot(ctx);
      return React.useCallback(fn, deps as React.DependencyList);
    },
    useRef: (i: any) => {
      useSlot(ctx);
      return React.useRef(i);
    },
    useContext: (c: any) => {
      useSlot(ctx);
      return React.useContext(c);
    },
    useImperativeHandle: (...a: any[]) => {
      useSlot(ctx);
      return (React as any).useImperativeHandle(...a);
    },
    useDebugValue: (...a: any[]) => {
      useSlot(ctx);
      return (React as any).useDebugValue(...a);
    },
  };

  return ctx;
}
