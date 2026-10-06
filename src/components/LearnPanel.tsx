import type { LearnStep } from '../content/examples';
import { tr, type Lang } from '../i18n';

interface LearnPanelProps {
  lang: Lang;
  steps: LearnStep[];
  step: number;
  onStep: (n: number) => void;
  onClose: () => void;
}

export default function LearnPanel({ lang, steps, step, onStep, onClose }: LearnPanelProps) {
  const s = steps[Math.min(step, steps.length - 1)];
  if (!s) return null;

  return (
    <div className="rvp-fade-up border-b border-cyan-400/25 bg-gradient-to-r from-cyan-400/10 to-violet-400/10 px-3 py-2.5">
      <div className="mb-1 flex items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-cyan-300">
          <span>🎓</span> {tr(lang, 'learnBadge')} · {tr(lang, 'learnStepOf', { a: step + 1, b: steps.length })}
        </p>
        <button onClick={onClose} className="text-xs text-slate-400 hover:text-white" title={tr(lang, 'learnClose')}>
          ✕
        </button>
      </div>
      <p className="text-[13px] font-bold text-white">{s.title[lang]}</p>
      <p className="mt-0.5 font-mono text-xs leading-relaxed text-slate-300">{s.body[lang]}</p>
      <div className="mt-2 flex items-center justify-between">
        <button
          onClick={() => onStep(Math.max(0, step - 1))}
          disabled={step === 0}
          className="rounded-lg bg-white/10 px-3 py-1 text-xs font-semibold text-slate-200 hover:bg-white/15 disabled:opacity-40"
        >
          ← {tr(lang, 'learnPrev')}
        </button>
        <span className="hidden text-[11px] text-slate-400 sm:inline">{tr(lang, 'learnTry')}</span>
        <button
          onClick={() => onStep(Math.min(steps.length - 1, step + 1))}
          disabled={step === steps.length - 1}
          className="rounded-lg bg-cyan-400/25 px-3 py-1 text-xs font-semibold text-cyan-100 hover:bg-cyan-400/35 disabled:opacity-40"
        >
          {tr(lang, 'learnNext')} →
        </button>
      </div>
    </div>
  );
}
