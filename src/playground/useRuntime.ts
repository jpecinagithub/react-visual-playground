import { useCallback, useEffect, useRef, useState } from 'react';
import type { RunnerMsg, TreeNode, HostMsg } from '../preview/protocol';
import { compile } from './transform';
import { classifyError, type ClassifiedError } from './errors';
import { trackEvent } from './analytics';

export interface StateChange {
  id: number;
  t: number;
  nodeId: number | null;
  name: string;
  variable: string;
  before: unknown;
  after: unknown;
}
export interface PropsChange {
  id: number;
  t: number;
  nodeId: number;
  name: string;
  changed: Record<string, { before: unknown; after: unknown }>;
}
export interface EventRecord {
  id: number;
  t: number;
  phase: 'start' | 'end';
  event: string;
  handler: string;
  component: string;
}
export interface EffectRecord {
  id: number;
  t: number;
  phase: 'run' | 'cleanup';
  name: string;
  index: number;
}
export interface LogRecord {
  id: number;
  t: number;
  level: string;
  args: unknown[];
}
export interface TimelineEntry {
  id: number;
  t: number;
  kind: 'mount' | 'event' | 'state' | 'render' | 'effect' | 'error' | 'dom' | 'info';
  data: Record<string, unknown>;
}
export interface InteractionSummary {
  id: number;
  t: number;
  event: string;
  handler: string;
  component: string;
  changes: { variable: string; before: unknown; after: unknown; comp: string }[];
  renders: { name: string; count: number }[];
}

export interface RuntimeState {
  runId: number;
  status: 'idle' | 'running' | 'error';
  compiling: boolean;
  error: ClassifiedError | null;
  tree: TreeNode | null;
  flashNode: number | null;
  stateChanges: StateChange[];
  lastStateChange: StateChange | null;
  propsChanges: PropsChange[];
  lastPropsChange: PropsChange | null;
  events: EventRecord[];
  effects: EffectRecord[];
  logs: LogRecord[];
  timeline: TimelineEntry[];
  lastInteraction: InteractionSummary | null;
  highlight: boolean;
}

function freshState(runId: number, highlight: boolean): RuntimeState {
  return {
    runId,
    status: 'idle',
    compiling: false,
    error: null,
    tree: null,
    flashNode: null,
    stateChanges: [],
    lastStateChange: null,
    propsChanges: [],
    lastPropsChange: null,
    events: [],
    effects: [],
    logs: [],
    timeline: [],
    lastInteraction: null,
    highlight,
  };
}

interface PendingInteraction {
  id: number;
  t: number;
  event: string;
  handler: string;
  component: string;
  changes: { variable: string; before: unknown; after: unknown; comp: string }[];
  renders: Map<string, number>;
}

export function useRuntime() {
  const [state, setState] = useState<RuntimeState>(() => freshState(0, true));
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const ridRef = useRef(0);
  const readyRef = useRef(false);
  const pendingRunRef = useRef<{ code: string; meta: unknown[]; rid: number } | null>(null);
  const idRef = useRef(0);
  const seenNodesRef = useRef<Set<number>>(new Set());
  const flashTimerRef = useRef<number | null>(null);
  const pendingRef = useRef<PendingInteraction | null>(null);

  const nextId = () => ++idRef.current;

  const finalizePending = useCallback(() => {
    const p = pendingRef.current;
    if (!p) return;
    pendingRef.current = null;
    const summary: InteractionSummary = {
      id: p.id,
      t: p.t,
      event: p.event,
      handler: p.handler,
      component: p.component,
      changes: p.changes,
      renders: [...p.renders.entries()].map(([name, count]) => ({ name, count })),
    };
    setState((s) => ({ ...s, lastInteraction: summary }));
  }, []);

  const sendRun = useCallback((code: string, meta: unknown[], rid: number) => {
    const w = iframeRef.current?.contentWindow;
    if (!w) {
      pendingRunRef.current = { code, meta, rid };
      return;
    }
    const msg: HostMsg = { src: 'rvp-host', type: 'run', rid, code, meta: meta as any, highlight: highlightRef.current };
    w.postMessage(msg, '*');
  }, []);
  const highlightRef = useRef(true);

  const run = useCallback(
    async (source: string) => {
      const rid = ++ridRef.current;
      pendingRef.current = null;
      seenNodesRef.current = new Set();
      setState((s) => ({
        ...freshState(rid, s.highlight),
        status: 'running',
        compiling: true,
      }));
      trackEvent('code_executed');
      const result = await compile(source);
      if (ridRef.current !== rid) return; // superseded by a newer run
      if (result.error || !result.code) {
        const err = result.error ?? { message: 'Unknown compilation error', line: null };
        const classified = classifyError(err.message, err.line);
        const entry: TimelineEntry = {
          id: nextId(),
          t: 0,
          kind: 'error',
          data: { message: err.message },
        };
        setState((s) =>
          s.runId === rid
            ? {
                ...s,
                compiling: false,
                status: 'error',
                error: classified,
                timeline: [...s.timeline, entry],
              }
            : s,
        );
        return;
      }
      setState((s) => (s.runId === rid ? { ...s, compiling: false } : s));
      if (readyRef.current) {
        sendRun(result.code, result.meta ?? [], rid);
      } else {
        pendingRunRef.current = { code: result.code, meta: result.meta ?? [], rid };
      }
    },
    [sendRun],
  );

  /** Clear visual state (keeps the same iframe); caller re-runs code after. */
  const clearRuntime = useCallback(() => {
    const rid = ++ridRef.current;
    pendingRef.current = null;
    seenNodesRef.current = new Set();
    setState((s) => ({ ...freshState(rid, s.highlight), status: 'running' }));
  }, []);

  const setHighlight = useCallback((on: boolean) => {
    highlightRef.current = on;
    setState((s) => ({ ...s, highlight: on }));
    const w = iframeRef.current?.contentWindow;
    if (w && readyRef.current) {
      const msg: HostMsg = { src: 'rvp-host', type: 'set-highlight', highlight: on };
      w.postMessage(msg, '*');
    }
  }, []);

  const clearLogs = useCallback(() => setState((s) => ({ ...s, logs: [] })), []);
  const clearTimeline = useCallback(
    () => setState((s) => ({ ...s, timeline: [] })),
    [],
  );

  // --- message handling ------------------------------------------------------
  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      const msg = e.data as (RunnerMsg & { rid?: number }) | undefined;
      if (!msg || msg.src !== 'rvp-runner') return;

      if (msg.type === 'ready') {
        readyRef.current = true;
        const p = pendingRunRef.current;
        if (p && p.rid === ridRef.current) {
          pendingRunRef.current = null;
          sendRun(p.code, p.meta, p.rid);
        } else if (p) {
          pendingRunRef.current = null;
        }
        return;
      }
      if (msg.rid !== ridRef.current) return; // stale run

      switch (msg.type) {
        case 'mounted': {
          const entry: TimelineEntry = { id: nextId(), t: msg.t, kind: 'info', data: { key: 'mounted' } };
          setState((s) => ({ ...s, timeline: [...s.timeline.slice(-249), entry] }));
          break;
        }
        case 'tree': {
          const tree = msg.tree;
          setState((s) => ({ ...s, tree }));
          if (tree) {
            // Mount entries for newly seen nodes.
            const fresh: string[] = [];
            const walk = (n: TreeNode) => {
              if (!seenNodesRef.current.has(n.id)) {
                seenNodesRef.current.add(n.id);
                fresh.push(n.name);
              }
              n.children.forEach(walk);
            };
            walk(tree);
            if (fresh.length > 0) {
              setState((s) => ({
                ...s,
                timeline: [
                  ...s.timeline.slice(-249),
                  ...fresh.map(
                    (name): TimelineEntry => ({ id: nextId(), t: msg.t, kind: 'mount', data: { name } }),
                  ),
                ],
              }));
            }
          }
          break;
        }
        case 'render': {
          const { nodeId, name, count, t } = msg;
          if (flashTimerRef.current !== null) window.clearTimeout(flashTimerRef.current);
          flashTimerRef.current = window.setTimeout(() => {
            setState((s) => ({ ...s, flashNode: null }));
          }, 550);
          setState((s) => ({ ...s, flashNode: nodeId }));
          const p = pendingRef.current;
          if (p && t >= p.t - 200) p.renders.set(name, count);
          const entry: TimelineEntry = { id: nextId(), t, kind: 'render', data: { name, count } };
          setState((s) => ({ ...s, timeline: [...s.timeline.slice(-249), entry] }));
          break;
        }
        case 'state': {
          const sc: StateChange = {
            id: nextId(),
            t: msg.t,
            nodeId: msg.nodeId,
            name: msg.name,
            variable: msg.variable,
            before: msg.before,
            after: msg.after,
          };
          setState((s) => ({
            ...s,
            stateChanges: [...s.stateChanges.slice(-59), sc],
            lastStateChange: sc,
            timeline: [
              ...s.timeline.slice(-249),
              {
                id: nextId(),
                t: msg.t,
                kind: 'state',
                data: { name: msg.name, variable: msg.variable, before: msg.before, after: msg.after },
              } as TimelineEntry,
            ],
          }));
          const p = pendingRef.current;
          if (p && msg.t >= p.t - 200) {
            p.changes.push({ variable: msg.variable, before: msg.before, after: msg.after, comp: msg.name });
          }
          break;
        }
        case 'props': {
          const pc: PropsChange = {
            id: nextId(),
            t: msg.t,
            nodeId: msg.nodeId,
            name: msg.name,
            changed: msg.changed,
          };
          setState((s) => ({
            ...s,
            propsChanges: [...s.propsChanges.slice(-59), pc],
            lastPropsChange: pc,
          }));
          break;
        }
        case 'event': {
          const rec: EventRecord = {
            id: nextId(),
            t: msg.t,
            phase: msg.phase,
            event: msg.event,
            handler: msg.handler,
            component: msg.component,
          };
          setState((s) => ({
            ...s,
            events: [...s.events.slice(-59), rec],
            timeline: [
              ...s.timeline.slice(-249),
              {
                id: nextId(),
                t: msg.t,
                kind: 'event',
                data: { event: msg.event, handler: msg.handler, component: msg.component, phase: msg.phase },
              } as TimelineEntry,
            ],
          }));
          if (msg.phase === 'start') {
            finalizePending();
            pendingRef.current = {
              id: rec.id,
              t: msg.t,
              event: msg.event,
              handler: msg.handler,
              component: msg.component,
              changes: [],
              renders: new Map(),
            };
          } else {
            const pid = pendingRef.current?.id;
            window.setTimeout(() => {
              if (pendingRef.current && pendingRef.current.id === pid) finalizePending();
            }, 900);
          }
          break;
        }
        case 'effect': {
          const er: EffectRecord = { id: nextId(), t: msg.t, phase: msg.phase, name: msg.name, index: msg.index };
          setState((s) => ({
            ...s,
            effects: [...s.effects.slice(-59), er],
            timeline: [
              ...s.timeline.slice(-249),
              { id: nextId(), t: msg.t, kind: 'effect', data: { name: msg.name, index: msg.index, phase: msg.phase } } as TimelineEntry,
            ],
          }));
          break;
        }
        case 'dom': {
          const entry: TimelineEntry = { id: nextId(), t: msg.t, kind: 'dom', data: {} };
          setState((s) => ({ ...s, timeline: [...s.timeline.slice(-249), entry] }));
          break;
        }
        case 'log': {
          const lr: LogRecord = { id: nextId(), t: msg.t, level: msg.level, args: msg.args };
          setState((s) => ({
            ...s,
            logs: [...s.logs.slice(-119), lr],
            timeline:
              msg.level === 'warn' || msg.level === 'error'
                ? [...s.timeline.slice(-249), { id: nextId(), t: msg.t, kind: 'error', data: { message: `console.${msg.level}` } } as TimelineEntry]
                : s.timeline,
          }));
          break;
        }
        case 'error': {
          const classified = classifyError(msg.message, msg.line);
          const entry: TimelineEntry = { id: nextId(), t: msg.t, kind: 'error', data: { message: msg.message } };
          setState((s) => ({
            ...s,
            status: 'error',
            error: classified,
            timeline: [...s.timeline.slice(-249), entry],
          }));
          break;
        }
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [finalizePending, sendRun]);

  return {
    state,
    iframeRef,
    run,
    clearRuntime,
    setHighlight,
    clearLogs,
    clearTimeline,
  };
}
