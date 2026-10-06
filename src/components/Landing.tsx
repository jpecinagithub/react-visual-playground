import { tr, type Lang } from '../i18n';

interface LandingProps {
  lang: Lang;
  onLang: (l: Lang) => void;
  onStart: () => void;
}

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

      </div>

      <footer className="flex shrink-0 items-center justify-center gap-2 border-t border-white/10 px-3 py-3 text-[11px] text-slate-500">
        <span className="font-semibold text-slate-400">{tr(lang, 'createdBy')}</span>
        <span className="hidden sm:inline">·</span>
        <span className="hidden truncate sm:inline">{tr(lang, 'authorBlurb')}</span>
      </footer>
    </div>
  );
}
