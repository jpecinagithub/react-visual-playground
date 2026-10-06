// Shared message protocol between the host app and the preview-runner iframe.
// The runner executes user code with an instrumented React and reports
// everything it observes via window.parent.postMessage.

export interface HookMeta {
  /** Component function name, e.g. "Counter" */
  component: string;
  kind:
    | 'state'
    | 'reducer'
    | 'ref'
    | 'memo'
    | 'effect'
    | 'callback'
    | 'context'
    | 'layout-effect';
  /** Order of this hook call among ALL hook calls in the component (rules-of-hooks order). */
  index: number;
  /** Destructured variable names, e.g. ["count", "setCount"] */
  names: string[];
  line: number;
}

export interface TreeNode {
  id: number;
  name: string;
  renders: number;
  memo: boolean;
  props: Record<string, unknown>;
  state: Record<string, unknown>;
  children: TreeNode[];
}

export type RunnerMsg =
  | { src: 'rvp-runner'; type: 'ready' }
  | { src: 'rvp-runner'; type: 'mounted'; t: number }
  | {
      src: 'rvp-runner';
      type: 'render';
      nodeId: number;
      name: string;
      count: number;
      t: number;
    }
  | { src: 'rvp-runner'; type: 'tree'; tree: TreeNode | null; t: number }
  | {
      src: 'rvp-runner';
      type: 'state';
      nodeId: number | null;
      name: string;
      variable: string;
      before: unknown;
      after: unknown;
      t: number;
    }
  | {
      src: 'rvp-runner';
      type: 'props';
      nodeId: number;
      name: string;
      changed: Record<string, { before: unknown; after: unknown }>;
      t: number;
    }
  | {
      src: 'rvp-runner';
      type: 'event';
      phase: 'start' | 'end';
      event: string;
      handler: string;
      component: string;
      t: number;
    }
  | {
      src: 'rvp-runner';
      type: 'effect';
      phase: 'run' | 'cleanup';
      name: string;
      index: number;
      t: number;
    }
  | {
      src: 'rvp-runner';
      type: 'log';
      level: 'log' | 'warn' | 'error' | 'info' | 'debug';
      args: unknown[];
      t: number;
    }
  | {
      src: 'rvp-runner';
      type: 'error';
      message: string;
      line: number | null;
      t: number;
    }
  | { src: 'rvp-runner'; type: 'dom'; mutations: number; t: number };

export type HostMsg =
  | {
      src: 'rvp-host';
      type: 'run';
      rid: number;
      code: string;
      meta: HookMeta[];
      highlight: boolean;
    }
  | { src: 'rvp-host'; type: 'set-highlight'; highlight: boolean };
