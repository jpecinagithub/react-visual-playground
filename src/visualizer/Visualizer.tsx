import { useState } from 'react';
import {
  TreeTab,
  StateTab,
  PropsTab,
  RendersTab,
  EventsTab,
  TimelineTab,
  FlowTab,
  JsxTab,
  ConsoleTab,
  type TabProps,
} from './tabs';
import { tr, type Lang } from '../i18n';
import type { RuntimeState } from '../playground/useRuntime';
import { trackEvent } from '../playground/analytics';

const TABS = [
  { id: 'components', color: 'bg-slate-300' },
  { id: 'state', color: 'bg-cyan-400' },
  { id: 'props', color: 'bg-violet-400' },
  { id: 'renders', color: 'bg-emerald-400' },
  { id: 'events', color: 'bg-amber-400' },
  { id: 'timeline', color: 'bg-sky-400' },
  { id: 'flow', color: 'bg-fuchsia-400' },
  { id: 'jsx', color: 'bg-orange-400' },
  { id: 'console', color: 'bg-slate-500' },
] as const;

interface VisualizerProps extends Omit<TabProps, 'rt'> {
  rt: RuntimeState;
  lang: Lang;
}

export default function Visualizer(props: VisualizerProps) {
  const { rt, lang } = props;
  const [tab, setTab] = useState<string>('components');
  const [showWhat, setShowWhat] = useState(false);

  const pick = (id: string) => {
    setTab(id);
    trackEvent('visualizer_tab_used');
  };

  const TabComp =
    {
      components: TreeTab,
      state: StateTab,
      props: PropsTab,
      renders: RendersTab,
      events: EventsTab,
      timeline: TimelineTab,
      flow: FlowTab,
      jsx: JsxTab,
      console: ConsoleTab,
    }[tab] ?? TreeTab;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between border-b border-white/10 px-2 py-1.5">
        <div className="rvp-scroll flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => pick(t.id)}
              className={`flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
                tab === t.id
                  ? 'bg-white/10 text-white'
                  : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
              }`}
            >
              <span className={`h-2 w-2 rounded-full ${t.color}`} />
              {tr(lang, `tab${t.id[0].toUpperCase()}${t.id.slice(1)}`)}
            </button>
          ))}
        </div>
        {rt.lastInteraction && (
          <button
            onClick={() => setShowWhat((v) => !v)}
            className="ml-1 shrink-0 rounded-full border border-amber-400/50 bg-amber-400/10 px-2.5 py-1 text-[11px] font-semibold text-amber-200 hover:bg-amber-400/20"
          >
            {tr(lang, 'whatHappened')}
          </button>
        )}
      </div>

      {showWhat && rt.lastInteraction && (
        <WhatHappenedPanel
          lang={lang}
          interaction={rt.lastInteraction}
          onClose={() => setShowWhat(false)}
        />
      )}

      <div className="min-h-0 flex-1">
        <TabComp {...props} />
      </div>
    </div>
  );
}

import type { InteractionSummary } from '../playground/useRuntime';
import { fmtVal } from '../i18n';

function WhatHappenedPanel({
  lang,
  interaction,
  onClose,
}: {
  lang: Lang;
  interaction: InteractionSummary;
  onClose: () => void;
}) {
  const i = interaction;
  return (
    <div className="rvp-fade-up border-b border-amber-400/25 bg-amber-400/5 p-3">
      <div className="mb-1.5 flex items-center justify-between">
        <p className="text-[11px] font-bold uppercase tracking-wider text-amber-300">
          {tr(lang, 'whatHappened')}
        </p>
        <button onClick={onClose} className="text-slate-400 hover:text-white">
          ✕
        </button>
      </div>
      <p className="mb-2 text-[13px] text-slate-200">
        {tr(lang, 'whIntro', { handler: i.handler, event: i.event })}
      </p>
      <ol className="list-decimal space-y-1 pl-5 text-[12px] text-slate-300">
        {i.changes.map((c, idx) => (
          <li key={idx}>
            {tr(lang, 'whStepState', {
              variable: c.variable,
              before: fmtVal(c.before),
              after: fmtVal(c.after),
            })}
          </li>
        ))}
        {i.renders.map((r, idx) => (
          <li key={`r${idx}`}>{tr(lang, 'whStepRender', { name: r.name, count: r.count })}</li>
        ))}
        {i.changes.length === 0 && i.renders.length === 0 && <li>{tr(lang, 'whNoChange')}</li>}
        {(i.changes.length > 0 || i.renders.length > 0) && <li>{tr(lang, 'whStepUi')}</li>}
      </ol>
    </div>
  );
}
