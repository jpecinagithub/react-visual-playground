import type { Example } from '../content/examples';
import { tr, type Lang } from '../i18n';

const CATS = ['fundamentals', 'state', 'effects', 'advanced', 'app'] as const;

interface ExamplesModalProps {
  open: boolean;
  onClose: () => void;
  lang: Lang;
  examples: Example[];
  currentId: string;
  onSelect: (id: string) => void;
  onFree: () => void;
}

export default function ExamplesModal({
  open,
  onClose,
  lang,
  examples,
  currentId,
  onSelect,
  onFree,
}: ExamplesModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="rvp-scroll flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-white/15 bg-[#0e1628] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
          <div>
            <h2 className="text-lg font-bold text-white">📚 {tr(lang, 'examples')}</h2>
            <p className="text-xs text-slate-400">{tr(lang, 'examplesSubtitle')}</p>
          </div>
          <button onClick={onClose} className="rounded-lg px-2 py-1 text-xl text-slate-400 hover:bg-white/10 hover:text-white">
            ✕
          </button>
        </div>

        <div className="rvp-scroll min-h-0 flex-1 overflow-auto p-4">
          <button
            onClick={onFree}
            className={`mb-4 flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors ${
              currentId === '__free'
                ? 'border-cyan-400/60 bg-cyan-400/10'
                : 'border-dashed border-white/20 hover:border-cyan-400/40 hover:bg-white/5'
            }`}
          >
            <span className="text-2xl">✨</span>
            <span>
              <span className="block text-sm font-bold text-white">
                {tr(lang, 'freePlayground')}{' '}
                <span className="ml-1 rounded bg-emerald-400/20 px-1.5 py-0.5 text-[10px] font-bold uppercase text-emerald-300">
                  {tr(lang, 'newBadge')}
                </span>
              </span>
              <span className="block text-xs text-slate-400">{tr(lang, 'freeTagline')}</span>
            </span>
          </button>

          {CATS.map((cat) => {
            const items = examples.filter((e) => e.category === cat);
            if (items.length === 0) return null;
            return (
              <div key={cat} className="mb-4">
                <h3 className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  {tr(lang, `cat${cat[0].toUpperCase()}${cat.slice(1)}`)}
                </h3>
                <div className="grid gap-2 sm:grid-cols-2">
                  {items.map((ex, i) => {
                    const active = ex.id === currentId;
                    return (
                      <button
                        key={ex.id}
                        onClick={() => onSelect(ex.id)}
                        className={`rounded-xl border p-3 text-left transition-colors ${
                          active
                            ? 'border-cyan-400/60 bg-cyan-400/10'
                            : 'border-white/10 bg-white/[0.03] hover:border-white/25 hover:bg-white/[0.06]'
                        }`}
                      >
                        <p className="text-sm font-bold text-white">
                          <span className="mr-1.5 font-mono text-[11px] text-slate-500">
                            {String(i + 1).padStart(2, '0')}
                          </span>
                          {ex.title[lang]}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-400">{ex.tagline[lang]}</p>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {ex.concepts.slice(0, 4).map((c) => (
                            <span key={c} className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[10px] text-slate-300">
                              {c}
                            </span>
                          ))}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <p className="border-t border-white/10 px-5 py-2 text-center text-[11px] text-slate-500">
          {tr(lang, 'createdBy')} · {tr(lang, 'authorBlurb')}
        </p>
      </div>
    </div>
  );
}
