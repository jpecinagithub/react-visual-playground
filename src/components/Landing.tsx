import { tr, type Lang } from '../i18n';

interface LandingProps {
  lang: Lang;
  onLang: (l: Lang) => void;
  onStart: () => void;
}

const FEATURES: { icon: string; t: string; d: string }[] = [
  { icon: '🌳', t: 'landingF1t', d: 'landingF1d' },
  { icon: '📦', t: 'landingF2t', d: 'landingF2d' },
  { icon: '🔀', t: 'landingF3t', d: 'landingF3d' },
  { icon: '🔁', t: 'landingF4t', d: 'landingF4d' },
  { icon: '👆', t: 'landingF5t', d: 'landingF5d' },
  { icon: '🕐', t: 'landingF6t', d: 'landingF6d' },
];

export default function Landing({ lang, onLang, onStart }: LandingProps) {
  return (
    <div className="flex h-full flex-col overflow-y-auto bg-[#070b14] text-slate-200">
      {/* language toggle */}
      <div className="flex shrink-0 justify-end p-4">
        <div className="flex overflow-hidden rounded-lg border border-white/10 text-[13px] font-semibold">
          {(['es', 'en'] as const).map((l) => (
            <button
              key={l}
              onClick={() => onLang(l)}
              className={`px-3 py-1.5 transition-colors ${
                lang === l ? 'bg-cyan-400 text-[#06202a]' : 'text-slate-400 hover:bg-white/10'
              }`}
            >
              {l.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center px-6 pb-12 text-center">
        <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-400 text-4xl shadow-lg shadow-cyan-500/30">
          ⚛️
        </div>
        <p className="mb-3 text-lg font-semibold text-cyan-300">React Visual Playground</p>
        <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl">
          {tr(lang, 'landingL1')}
          <br />
          {tr(lang, 'landingL2')}
          <br />
          {tr(lang, 'landingL3')}
        </h1>
        <button
          onClick={onStart}
          className="mt-8 rounded-xl bg-cyan-400 px-8 py-3.5 text-lg font-bold text-[#06202a] shadow-lg shadow-cyan-500/25 transition-colors hover:bg-cyan-300"
        >
          {tr(lang, 'landingCta')} →
        </button>
        <ul className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-slate-400">
          {['landingB1', 'landingB2', 'landingB3'].map((k) => (
            <li key={k}>
              <span className="mr-1.5 text-cyan-400">✓</span>
              {tr(lang, k)}
            </li>
          ))}
        </ul>

        <h2 className="mt-14 text-2xl font-bold text-white">{tr(lang, 'landingFeatTitle')}</h2>
        <p className="mt-1.5 text-sm text-slate-400">{tr(lang, 'landingFeatSub')}</p>
        <div className="mt-6 grid w-full grid-cols-1 gap-3 text-left sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.t}
              className="rounded-xl border border-white/10 bg-white/[0.03] p-4 transition-colors hover:border-cyan-400/40"
            >
              <div className="mb-2 text-2xl">{f.icon}</div>
              <div className="font-semibold text-white">{tr(lang, f.t)}</div>
              <div className="mt-0.5 text-[13px] text-slate-400">{tr(lang, f.d)}</div>
            </div>
          ))}
        </div>

        <p className="mt-8 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-5 py-2 text-sm font-medium text-cyan-200">
          📚 {tr(lang, 'landingExamples')}
        </p>
      </div>

      <footer className="flex shrink-0 items-center justify-center gap-2 border-t border-white/10 px-3 py-3 text-[11px] text-slate-500">
        <span className="font-semibold text-slate-400">{tr(lang, 'createdBy')}</span>
        <span className="hidden sm:inline">·</span>
        <span className="hidden truncate sm:inline">{tr(lang, 'authorBlurb')}</span>
      </footer>
    </div>
  );
}
