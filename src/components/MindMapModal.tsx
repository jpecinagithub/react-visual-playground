import { tr, type Lang } from '../i18n';

function Chain({ lang, nodes }: { lang: Lang; nodes: string[] }) {
  return (
    <div className="flex flex-col items-center">
      {nodes.map((k, i) => (
        <div key={k} className="flex flex-col items-center">
          <div className="rvp-step-glow w-52 rounded-xl border border-white/15 bg-white/[0.04] px-4 py-2 text-center">
            <p className="text-[13px] font-semibold text-slate-100">{tr(lang, k)}</p>
          </div>
          {i < nodes.length - 1 && <span className="py-0.5 text-lg text-cyan-300">↓</span>}
        </div>
      ))}
    </div>
  );
}

export default function MindMapModal({
  open,
  onClose,
  lang,
}: {
  open: boolean;
  onClose: () => void;
  lang: Lang;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="rvp-scroll max-h-[88vh] w-full max-w-4xl overflow-auto rounded-2xl border border-white/15 bg-[#0e1628] p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">🧠 {tr(lang, 'mmTitle')}</h2>
          <button onClick={onClose} className="rounded-lg px-2 py-1 text-xl text-slate-400 hover:bg-white/10 hover:text-white">
            ✕
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-cyan-400/25 bg-cyan-400/[0.04] p-4">
            <h3 className="mb-3 text-center text-sm font-bold uppercase tracking-wider text-cyan-300">
              {tr(lang, 'mmLoopA')}
            </h3>
            <div className="flex flex-col items-center">
              <div className="w-52 rounded-xl border border-cyan-400/40 bg-cyan-400/10 px-4 py-2 text-center">
                <p className="text-[13px] font-bold text-cyan-100">{tr(lang, 'mmComponent')}</p>
              </div>
              <div className="flex w-64 items-stretch justify-center gap-6 py-1 text-cyan-300">
                <span>↙</span>
                <span>↘</span>
              </div>
              <div className="flex w-full justify-center gap-8">
                <div className="w-40 rounded-xl border border-violet-400/40 bg-violet-400/10 px-3 py-2 text-center">
                  <p className="text-[13px] font-bold text-violet-100">{tr(lang, 'mmProps')}</p>
                </div>
                <div className="w-40 rounded-xl border border-cyan-400/40 bg-cyan-400/10 px-3 py-2 text-center">
                  <p className="text-[13px] font-bold text-cyan-100">{tr(lang, 'mmState')}</p>
                </div>
              </div>
              <span className="py-1 text-lg text-slate-300">↓</span>
              <Chain
                lang={lang}
                nodes={['mmRender', 'mmJsx', 'mmCompare', 'mmDomUpdate', 'mmUi']}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-amber-400/25 bg-amber-400/[0.04] p-4">
            <h3 className="mb-3 text-center text-sm font-bold uppercase tracking-wider text-amber-300">
              {tr(lang, 'mmLoopB')}
            </h3>
            <Chain
              lang={lang}
              nodes={['mmUserEvent', 'mmHandler', 'mmStateUpdate', 'mmRender', 'mmUiUpdate']}
            />
          </div>
        </div>

        <p className="mt-4 text-center text-sm text-slate-300">{tr(lang, 'mmNote')}</p>
        <p className="mt-1 text-center text-[11px] text-slate-500">
          {tr(lang, 'createdBy')} · {tr(lang, 'authorBlurb')}
        </p>
      </div>
    </div>
  );
}
