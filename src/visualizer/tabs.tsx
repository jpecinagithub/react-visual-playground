import { useEffect, useRef, useState } from 'react';
import type { TreeNode } from '../preview/protocol';
import type {
  RuntimeState,
  TimelineEntry,
} from '../playground/useRuntime';
import { inspectFirstJsx } from '../playground/transform';
import { tr, fmtVal, fmtTime, type Lang } from '../i18n';

export interface TabProps {
  rt: RuntimeState;
  lang: Lang;
  code: string;
  onClearTimeline: () => void;
  onClearLogs: () => void;
  onToggleHighlight: (on: boolean) => void;
}

// ---------------------------------------------------------------- helpers
export function walkTree(
  n: TreeNode | null,
  fn: (n: TreeNode, depth: number) => void,
  depth = 0,
) {
  if (!n) return;
  fn(n, depth);
  n.children.forEach((c) => walkTree(c, fn, depth + 1));
}

function findNode(n: TreeNode | null, id: number | null): TreeNode | null {
  if (!n || id == null) return null;
  if (n.id === id) return n;
  for (const c of n.children) {
    const f = findNode(c, id);
    if (f) return f;
  }
  return null;
}

function findParentName(n: TreeNode | null, childId: number): string | null {
  if (!n) return null;
  for (const c of n.children) {
    if (c.id === childId) return n.name;
    const f = findParentName(c, childId);
    if (f) return f;
  }
  return null;
}

export function Val({ v, className = '' }: { v: unknown; className?: string }) {
  return (
    <code className={`rounded bg-black/30 px-1 py-0.5 font-mono text-[11px] ${className}`}>
      {fmtVal(v)}
    </code>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full items-center justify-center p-6 text-center text-sm text-slate-400">
      <p className="max-w-xs">{children}</p>
    </div>
  );
}

function PanelTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="px-3 pt-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
      {children}
    </h3>
  );
}

// ---------------------------------------------------------------- Tree tab
export function TreeTab({ rt, lang }: TabProps) {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const selected = findNode(rt.tree, selectedId);

  const renderNode = (n: TreeNode, depth: number): React.ReactNode => {
    const isSel = n.id === selectedId;
    const isFlash = n.id === rt.flashNode;
    return (
      <div key={n.id}>
        <button
          onClick={() => setSelectedId(isSel ? null : n.id)}
          className={`flex w-full items-center gap-2 rounded-md border border-transparent px-2 py-1 text-left text-[13px] transition-colors hover:bg-white/5 ${
            isSel ? 'border-cyan-400/50 bg-cyan-400/10' : ''
          } ${isFlash ? 'rvp-node-flash' : ''}`}
          style={{ marginLeft: depth * 14 }}
        >
          <span className="font-mono font-semibold text-slate-100">{n.name}</span>
          {n.memo && (
            <span className="rounded bg-pink-500/20 px-1 text-[10px] text-pink-300">
              {tr(lang, 'memoBadge')}
            </span>
          )}
          {isFlash && (
            <span className="rounded bg-emerald-400/20 px-1 text-[10px] font-bold text-emerald-300">
              ← {tr(lang, 'justRendered')}
            </span>
          )}
          <span className="ml-auto font-mono text-[11px] text-emerald-300/80">
            ×{n.renders}
          </span>
        </button>
        <div>{n.children.map((c) => renderNode(c, depth + 1))}</div>
      </div>
    );
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <PanelTitle>{tr(lang, 'componentsTitle')}</PanelTitle>
      <div className="rvp-scroll min-h-0 flex-1 overflow-auto p-2">
        {rt.tree ? (
          renderNode(rt.tree, 0)
        ) : (
          <Empty>{tr(lang, 'selectHint')}</Empty>
        )}
      </div>
      {selected && (
        <div className="rvp-fade-up max-h-[45%] overflow-auto border-t border-white/10 bg-black/20 p-3">
          <div className="mb-2 flex items-center gap-2">
            <span className="font-mono text-sm font-bold text-slate-100">{selected.name}</span>
            <span className="rounded bg-emerald-400/15 px-1.5 py-0.5 font-mono text-[11px] text-emerald-300">
              {tr(lang, 'rendersLabel')}: {selected.renders}
            </span>
          </div>
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-violet-300">
            {tr(lang, 'propsLabel')}
          </p>
          {Object.keys(selected.props).length === 0 ? (
            <p className="mb-2 text-xs text-slate-500">{tr(lang, 'noProps')}</p>
          ) : (
            <div className="mb-2 space-y-0.5">
              {Object.entries(selected.props).map(([k, v]) => (
                <div key={k} className="flex items-center gap-2 text-xs">
                  <span className="font-mono text-violet-200">{k}</span>
                  <span className="text-slate-500">→</span>
                  <Val v={v} />
                </div>
              ))}
            </div>
          )}
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-cyan-300">
            {tr(lang, 'stateLabel')}
          </p>
          {Object.keys(selected.state).length === 0 ? (
            <p className="text-xs text-slate-500">{tr(lang, 'noState')}</p>
          ) : (
            <div className="space-y-0.5">
              {Object.entries(selected.state).map(([k, v]) => (
                <div key={k} className="flex items-center gap-2 text-xs">
                  <span className="font-mono text-cyan-200">{k}</span>
                  <span className="text-slate-500">=</span>
                  <Val v={v} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------- State tab
export function StateTab({ rt, lang }: TabProps) {
  const sc = rt.lastStateChange;
  const withState: { name: string; entries: [string, unknown][] }[] = [];
  walkTree(rt.tree, (n) => {
    const entries = Object.entries(n.state);
    if (entries.length > 0) withState.push({ name: n.name, entries });
  });

  return (
    <div className="rvp-scroll h-full overflow-auto">
      <PanelTitle>{tr(lang, 'stateTitle')}</PanelTitle>

      {/* the mental-model chain */}
      <div className="flex items-center justify-center gap-1 px-3 py-3 text-[11px] font-semibold">
        {[
          { k: 'chEvent', c: 'text-amber-300 border-amber-400/40 bg-amber-400/10' },
          { k: 'chSet', c: 'text-cyan-300 border-cyan-400/40 bg-cyan-400/10' },
          { k: 'chState', c: 'text-cyan-300 border-cyan-400/40 bg-cyan-400/10' },
          { k: 'chRender', c: 'text-emerald-300 border-emerald-400/40 bg-emerald-400/10' },
          { k: 'chUi', c: 'text-slate-200 border-white/20 bg-white/5' },
        ].map((s, i, arr) => (
          <span key={s.k} className="flex items-center gap-1">
            <span className={`rounded-md border px-1.5 py-1 ${s.c}`}>{tr(lang, s.k)}</span>
            {i < arr.length - 1 && <span className="text-slate-500">↓</span>}
          </span>
        ))}
      </div>

      {sc ? (
        <div key={sc.id} className="rvp-state-pop mx-3 mb-3 rounded-lg border border-cyan-400/30 bg-cyan-400/5 p-3">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-cyan-300">
            {sc.name} · <span className="font-mono normal-case">{sc.variable}</span>
          </p>
          <div className="flex items-center justify-center gap-3">
            <div className="text-center">
              <p className="mb-1 text-[10px] uppercase tracking-wider text-slate-400">{tr(lang, 'before')}</p>
              <Val v={sc.before} className="text-sm text-slate-300" />
            </div>
            <div className="text-center text-cyan-300">
              <p className="font-mono text-xs">↓ set{sc.variable[0]?.toUpperCase() + sc.variable.slice(1)}()</p>
            </div>
            <div className="text-center">
              <p className="mb-1 text-[10px] uppercase tracking-wider text-slate-400">{tr(lang, 'after')}</p>
              <Val v={sc.after} className="text-sm text-cyan-200" />
            </div>
          </div>
        </div>
      ) : (
        <p className="px-3 pb-2 text-xs text-slate-500">{tr(lang, 'noStateYet')}</p>
      )}

      {withState.map((w) => (
        <div key={w.name} className="mx-3 mb-2 rounded-lg border border-white/10 bg-black/20 p-2.5">
          <p className="mb-1 font-mono text-xs font-semibold text-slate-200">{w.name}</p>
          {w.entries.map(([k, v]) => (
            <div key={k} className="flex items-center gap-2 py-0.5 text-xs">
              <span className="font-mono text-cyan-200">{k}</span>
              <span className="text-slate-500">=</span>
              <Val v={v} />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------- Props tab
export function PropsTab({ rt, lang }: TabProps) {
  const pc = rt.lastPropsChange;
  const parentName = pc ? findParentName(rt.tree, pc.nodeId) : null;

  return (
    <div className="rvp-scroll h-full overflow-auto">
      <PanelTitle>{tr(lang, 'propsTitle')}</PanelTitle>
      {pc && parentName ? (
        <div key={pc.id} className="rvp-fade-up mx-3 mb-3 mt-2 rounded-lg border border-violet-400/30 bg-violet-400/5 p-3">
          <div className="flex flex-col items-center gap-1 text-center">
            <span className="rounded-md border border-violet-400/40 bg-violet-400/10 px-3 py-1.5 font-mono text-sm font-semibold text-violet-200">
              {parentName}
            </span>
            <span className="text-[10px] uppercase tracking-wider text-slate-400">{tr(lang, 'parentLabel')}</span>
            <div className="rvp-arrow-drop flex flex-col items-center text-violet-300">
              <span className="text-[10px] font-semibold uppercase tracking-wider">props</span>
              <span className="text-xl leading-none">↓</span>
            </div>
            <span className="rounded-md border border-violet-400/40 bg-violet-400/10 px-3 py-1.5 font-mono text-sm font-semibold text-violet-200">
              {pc.name}
            </span>
            <span className="text-[10px] uppercase tracking-wider text-slate-400">{tr(lang, 'childLabel')}</span>
          </div>
          <div className="mt-3 space-y-1 border-t border-white/10 pt-2">
            {Object.entries(pc.changed).map(([k, { before, after }]) => (
              <div key={k} className="flex items-center justify-center gap-2 text-xs">
                <span className="font-mono text-violet-200">{k}</span>
                <Val v={before} />
                <span className="text-violet-300">→</span>
                <Val v={after} className="text-violet-100" />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="px-3 py-2 text-xs text-slate-500">{tr(lang, 'noPropsYet')}</p>
      )}

      {rt.propsChanges.length > 1 && (
        <div className="px-3 pb-3">
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            {tr(lang, 'tabProps')} · {rt.propsChanges.length}
          </p>
          <div className="space-y-1">
            {rt.propsChanges.slice(-6).reverse().map((p) => (
              <div key={p.id} className="rounded bg-black/20 px-2 py-1 font-mono text-[11px] text-slate-300">
                {p.name} <span className="text-slate-500">←</span>{' '}
                <span className="text-violet-300">{Object.keys(p.changed).join(', ')}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------- Renders tab
export function RendersTab({ rt, lang, onToggleHighlight }: TabProps) {
  const rows: { name: string; renders: number; id: number }[] = [];
  walkTree(rt.tree, (n) => rows.push({ name: n.name, renders: n.renders, id: n.id }));
  rows.sort((a, b) => b.renders - a.renders);
  const max = Math.max(1, ...rows.map((r) => r.renders));

  return (
    <div className="rvp-scroll h-full overflow-auto">
      <div className="flex items-center justify-between px-3 pt-2">
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          {tr(lang, 'rendersTitle')}
        </h3>
        <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-300" title={tr(lang, 'highlightHint')}>
          <span className="text-emerald-300">{tr(lang, 'highlightLabel')}</span>
          <button
            role="switch"
            aria-checked={rt.highlight}
            onClick={() => onToggleHighlight(!rt.highlight)}
            className={`relative h-5 w-9 rounded-full transition-colors ${rt.highlight ? 'bg-emerald-500' : 'bg-white/15'}`}
          >
            <span
              className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${rt.highlight ? 'left-[18px]' : 'left-0.5'}`}
            />
          </button>
        </label>
      </div>
      <div className="space-y-1.5 p-3">
        {rows.length === 0 && <Empty>{tr(lang, 'selectHint')}</Empty>}
        {rows.map((r) => (
          <div key={r.id} className={`rounded-md px-2 py-1 ${r.id === rt.flashNode ? 'rvp-node-flash' : ''}`}>
            <div className="flex items-baseline justify-between text-[13px]">
              <span className="font-mono font-semibold text-slate-100">{r.name}</span>
              <span className="font-mono text-xs text-emerald-300">
                {tr(lang, 'rendersLabel')}: {r.renders}
              </span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-emerald-400 transition-all duration-300"
                style={{ width: `${(r.renders / max) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- Events tab
export function EventsTab({ rt, lang }: TabProps) {
  const starts = rt.events.filter((e) => e.phase === 'start').reverse();
  return (
    <div className="rvp-scroll h-full overflow-auto">
      <PanelTitle>{tr(lang, 'eventsTitle')}</PanelTitle>
      {starts.length === 0 ? (
        <Empty>{tr(lang, 'noEvents')}</Empty>
      ) : (
        <div className="space-y-2 p-3">
          {starts.map((e) => (
            <div key={e.id} className="rvp-fade-up rounded-lg border border-amber-400/25 bg-amber-400/5 p-2.5">
              <div className="flex items-center gap-2 text-[13px]">
                <span className="text-amber-300">⚡</span>
                <span className="font-mono font-semibold text-amber-200">{e.event}</span>
                <span className="text-slate-500">→</span>
                <span className="font-mono text-slate-200">{e.handler}()</span>
              </div>
              <p className="mt-1 pl-6 text-[11px] text-slate-400">
                {tr(lang, 'inComponent')} <span className="font-mono text-slate-300">{e.component}</span>
                <span className="ml-2 font-mono text-slate-500">{fmtTime(e.t)}</span>
              </p>
              <div className="mt-2 flex items-center gap-1 pl-6 text-[10px] font-semibold uppercase tracking-wider">
                <span className="rounded bg-amber-400/15 px-1.5 py-0.5 text-amber-300">{e.event}</span>
                <span className="text-slate-500">→</span>
                <span className="rounded bg-amber-400/15 px-1.5 py-0.5 text-amber-300">handler</span>
                <span className="text-slate-500">→</span>
                <span className="rounded bg-cyan-400/15 px-1.5 py-0.5 text-cyan-300">state</span>
                <span className="text-slate-500">→</span>
                <span className="rounded bg-emerald-400/15 px-1.5 py-0.5 text-emerald-300">render</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------- Timeline tab
function timelineText(lang: Lang, e: TimelineEntry): string {
  const d = e.data as Record<string, any>;
  switch (e.kind) {
    case 'info':
      return tr(lang, 'tlMounted');
    case 'mount':
      return tr(lang, 'tlMount', { name: d.name });
    case 'event':
      return `⚡ ${d.event} → ${d.handler}()`;
    case 'state':
      return tr(lang, 'tlState', {
        variable: d.variable,
        before: fmtVal(d.before),
        after: fmtVal(d.after),
      });
    case 'render':
      return tr(lang, 'tlRender', { name: d.name, count: d.count });
    case 'effect':
      return tr(lang, d.phase === 'cleanup' ? 'tlEffectCleanup' : 'tlEffectRun', {
        index: d.index,
        name: d.name,
      });
    case 'dom':
      return tr(lang, 'tlDom');
    case 'error':
      return tr(lang, 'tlError', { message: String(d.message).slice(0, 80) });
    default:
      return '';
  }
}

const TL_COLORS: Record<TimelineEntry['kind'], string> = {
  mount: 'bg-slate-400',
  event: 'bg-amber-400',
  state: 'bg-cyan-400',
  render: 'bg-emerald-400',
  effect: 'bg-pink-400',
  error: 'bg-red-400',
  dom: 'bg-violet-400',
  info: 'bg-sky-400',
};

export function TimelineTab({ rt, lang, onClearTimeline }: TabProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [rt.timeline.length]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between px-3 pt-2">
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          {tr(lang, 'timelineTitle')}
        </h3>
        <button
          onClick={onClearTimeline}
          className="rounded px-2 py-1 text-xs text-slate-300 hover:bg-white/10"
        >
          {tr(lang, 'clearTimeline')}
        </button>
      </div>
      <div ref={scrollRef} className="rvp-scroll min-h-0 flex-1 overflow-auto p-3">
        {rt.timeline.length === 0 ? (
          <Empty>{tr(lang, 'noTimeline')}</Empty>
        ) : (
          <div className="space-y-0">
            {rt.timeline
              .filter((e) => !(e.kind === 'event' && (e.data as any).phase === 'end'))
              .map((e) => (
                <div key={e.id} className="flex items-start gap-2 py-1">
                  <span className={`mt-1.5 block h-2 w-2 shrink-0 rounded-full ${TL_COLORS[e.kind]}`} />
                  <span className="w-10 shrink-0 font-mono text-[11px] text-slate-500">
                    {fmtTime(e.t)}
                  </span>
                  <span className="text-[12px] text-slate-200">{timelineText(lang, e)}</span>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- Flow tab
export function FlowTab({ rt, lang }: TabProps) {
  const inter = rt.lastInteraction;
  const [replay, setReplay] = useState(0);
  const [litCount, setLitCount] = useState(0);

  const nodes = inter
    ? [
        { label: tr(lang, 'flowUser'), sub: `${inter.event}`, color: 'border-amber-400/50 bg-amber-400/10 text-amber-200' },
        { label: tr(lang, 'flowHandler'), sub: `${inter.handler}()`, color: 'border-amber-400/50 bg-amber-400/10 text-amber-200' },
        {
          label: tr(lang, 'flowSet'),
          sub: inter.changes.length > 0 ? `set${inter.changes[0].variable[0]?.toUpperCase()}${inter.changes[0].variable.slice(1)}()` : '—',
          color: 'border-cyan-400/50 bg-cyan-400/10 text-cyan-200',
        },
        {
          label: tr(lang, 'flowState'),
          sub: inter.changes.length > 0 ? `${inter.changes[0].variable}: ${fmtVal(inter.changes[0].before)} → ${fmtVal(inter.changes[0].after)}` : tr(lang, 'whNoChange'),
          color: 'border-cyan-400/50 bg-cyan-400/10 text-cyan-200',
        },
        {
          label: tr(lang, 'flowRender'),
          sub: inter.renders.map((r) => r.name).join(', ') || '—',
          color: 'border-emerald-400/50 bg-emerald-400/10 text-emerald-200',
        },
        { label: tr(lang, 'flowVdom'), sub: 'diff', color: 'border-emerald-400/50 bg-emerald-400/10 text-emerald-200' },
        { label: tr(lang, 'flowDom'), sub: '', color: 'border-violet-400/50 bg-violet-400/10 text-violet-200' },
        { label: tr(lang, 'flowUi'), sub: '', color: 'border-white/25 bg-white/5 text-slate-100' },
      ]
    : [];

  useEffect(() => {
    setLitCount(0);
    if (!inter) return;
    const timers: number[] = [];
    nodes.forEach((_, i) => {
      timers.push(window.setTimeout(() => setLitCount(i + 1), 400 * (i + 1)));
    });
    return () => timers.forEach((t) => window.clearTimeout(t));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inter?.id, replay]);

  return (
    <div className="rvp-scroll h-full overflow-auto">
      <div className="flex items-center justify-between px-3 pt-2">
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          {tr(lang, 'flowTitle')}
        </h3>
        {inter && (
          <button
            onClick={() => setReplay((r) => r + 1)}
            className="rounded px-2 py-1 text-xs text-slate-300 hover:bg-white/10"
          >
            ↻ {tr(lang, 'flowReplay')}
          </button>
        )}
      </div>
      {!inter ? (
        <Empty>{tr(lang, 'flowEmpty')}</Empty>
      ) : (
        <div className="flex flex-col items-center gap-0 px-6 py-4">
          <p className="mb-3 text-[11px] text-slate-400">{tr(lang, 'flowWatch')}</p>
          {nodes.map((n, i) => (
            <div key={`${inter.id}-${replay}-${i}`} className="flex flex-col items-center">
              <div
                className={`rvp-flow-node w-56 rounded-xl border px-4 py-2.5 text-center ${n.color} ${i < litCount ? 'lit' : ''}`}
              >
                <p className="text-[13px] font-semibold">{n.label}</p>
                {n.sub && <p className="mt-0.5 font-mono text-[11px] opacity-80">{n.sub}</p>}
              </div>
              {i < nodes.length - 1 && (
                <div className={`text-lg leading-tight ${i < litCount ? 'text-slate-300' : 'text-slate-600'}`}>↓</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------- JSX tab
export function JsxTab({ lang, code }: TabProps) {
  const [info, setInfo] = useState<{
    jsxText: string;
    type: string;
    props: { name: string; value: string }[];
    hasExpressionChildren: boolean;
  } | null>(null);

  useEffect(() => {
    let alive = true;
    const timer = window.setTimeout(async () => {
      const r = await inspectFirstJsx(code);
      if (alive) setInfo(r);
    }, 450);
    return () => {
      alive = false;
      window.clearTimeout(timer);
    };
  }, [code]);

  if (!info) return <Empty>{tr(lang, 'jsxEmpty')}</Empty>;

  return (
    <div className="rvp-scroll h-full overflow-auto p-3">
      <PanelTitle>{tr(lang, 'jsxTitle')}</PanelTitle>
      <div className="mt-2 flex flex-col items-center gap-1">
        <div className="w-full rounded-lg border border-sky-400/30 bg-sky-400/5 p-3">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-sky-300">
            {tr(lang, 'jsxStage')}
          </p>
          <pre className="overflow-x-auto font-mono text-xs text-sky-100">
            {info.jsxText.length > 220 ? info.jsxText.slice(0, 220) + '…' : info.jsxText}
          </pre>
        </div>
        <span className="text-xl text-slate-400">↓</span>
        <div className="w-full rounded-lg border border-violet-400/30 bg-violet-400/5 p-3">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-violet-300">
            {tr(lang, 'elementStage')}
          </p>
          <div className="font-mono text-xs text-violet-100">
            <p>{'{'} </p>
            <p className="pl-3">
              <span className="text-slate-400">{tr(lang, 'typeLabel')}:</span> "{info.type}",
            </p>
            <p className="pl-3">
              <span className="text-slate-400">{tr(lang, 'propsLabel2')}:</span>{' '}
              {info.props.length === 0 ? (
                <span className="text-slate-500">{'{ }'}</span>
              ) : (
                '{ ' +
                info.props.map((p) => `${p.name}: ${p.value}`).join(', ') +
                ' }'
              )}
            </p>
            <p>{'}'}</p>
          </div>
          {info.hasExpressionChildren && (
            <p className="mt-2 text-[11px] text-slate-400">{tr(lang, 'exprNote')}</p>
          )}
        </div>
        <span className="text-xl text-slate-400">↓</span>
        <div className="w-full rounded-lg border border-emerald-400/30 bg-emerald-400/5 p-3">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-300">
            {tr(lang, 'domStage')}
          </p>
          <pre className="overflow-x-auto font-mono text-xs text-emerald-100">
            {`<${info.type}${info.props.map((p) => ` ${p.name}=${p.value}`).join('')}>…</${info.type}>`}
          </pre>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- Console tab
export function ConsoleTab({ rt, lang, onClearLogs }: TabProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [rt.logs.length]);

  const levelColor: Record<string, string> = {
    log: 'text-slate-200',
    info: 'text-sky-300',
    warn: 'text-amber-300',
    error: 'text-red-300',
    debug: 'text-slate-400',
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between px-3 pt-2">
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          {tr(lang, 'consoleTitle')}
        </h3>
        <button
          onClick={onClearLogs}
          className="rounded px-2 py-1 text-xs text-slate-300 hover:bg-white/10"
        >
          {tr(lang, 'clearConsole')}
        </button>
      </div>
      <div ref={scrollRef} className="rvp-scroll min-h-0 flex-1 overflow-auto p-3">
        {rt.logs.length === 0 ? (
          <Empty>{tr(lang, 'noLogs')}</Empty>
        ) : (
          <div className="space-y-1 font-mono text-xs">
            {rt.logs.map((l) => (
              <div key={l.id} className="flex gap-2 rounded bg-black/25 px-2 py-1">
                <span className="shrink-0 text-slate-500">{fmtTime(l.t)}</span>
                <span className={`break-all ${levelColor[l.level] ?? 'text-slate-200'}`}>
                  {l.args.map((a) => fmtVal(a)).join(' ')}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
