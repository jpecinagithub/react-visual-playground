import { useState } from 'react';
import { tr, type Lang } from '../i18n';

interface HeaderProps {
  lang: Lang;
  onLang: (l: Lang) => void;
  onHome: () => void;
  theme: 'dark' | 'light';
  onTheme: () => void;
  onExamples: () => void;
  learnMode: boolean;
  onToggleLearn: () => void;
  onMindmap: () => void;
  onShare: () => void;
  shareCopied: boolean;
  fontSize: number;
  onFontSize: (n: number) => void;
  onResetPanels: () => void;
}

export default function Header(p: HeaderProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { lang } = p;

  const btn =
    'flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[13px] font-medium text-slate-200 hover:bg-white/10 transition-colors';

  return (
    <header className="relative z-30 flex h-13 shrink-0 items-center justify-between gap-2 border-b border-white/10 bg-[#0b1220]/95 px-3 py-2 backdrop-blur">
      <button onClick={p.onHome} className="flex min-w-0 items-center gap-2.5 text-left" title="React Visual Playground">
        <span className="text-2xl leading-none">⚛️</span>
        <div className="min-w-0">
          <h1 className="truncate text-[15px] font-bold tracking-tight text-white">
            React Visual Playground
          </h1>
          <p className="hidden truncate text-[11px] text-slate-400 lg:block">
            {tr(lang, 'appTagline')}
          </p>
        </div>
      </button>

      <div className="flex items-center gap-0.5 sm:gap-1">
        <button onClick={p.onExamples} className={btn} title={tr(lang, 'examples')}>
          <span>📚</span>
          <span className="hidden md:inline">{tr(lang, 'examples')}</span>
        </button>
        <button
          onClick={p.onToggleLearn}
          className={`${btn} ${p.learnMode ? 'bg-cyan-400/20 text-cyan-200' : ''}`}
          title={tr(lang, 'learnMode')}
        >
          <span>🎓</span>
          <span className="hidden md:inline">{tr(lang, 'learnMode')}</span>
        </button>
        <button onClick={p.onMindmap} className={btn} title={tr(lang, 'howItWorks')}>
          <span>🧠</span>
          <span className="hidden xl:inline">{tr(lang, 'howItWorks')}</span>
        </button>
        <button onClick={p.onShare} className={btn} title={tr(lang, 'share')}>
          <span>{p.shareCopied ? '✅' : '🔗'}</span>
          <span className="hidden md:inline">
            {p.shareCopied ? tr(lang, 'linkCopied') : tr(lang, 'share')}
          </span>
        </button>

        <div className="mx-1 flex overflow-hidden rounded-lg border border-white/15 text-[12px] font-bold">
          {(['es', 'en'] as Lang[]).map((l) => (
            <button
              key={l}
              onClick={() => p.onLang(l)}
              className={`px-2 py-1.5 uppercase transition-colors ${
                lang === l ? 'bg-cyan-400/25 text-cyan-200' : 'text-slate-400 hover:bg-white/5'
              }`}
            >
              {l}
            </button>
          ))}
        </div>

        <button onClick={p.onTheme} className={btn} title={tr(lang, 'theme')}>
          {p.theme === 'dark' ? '☀️' : '🌙'}
        </button>

        <div className="relative">
          <button onClick={() => setSettingsOpen((v) => !v)} className={btn} title={tr(lang, 'settings')}>
            ⚙️
          </button>
          {settingsOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setSettingsOpen(false)} />
              <div className="absolute right-0 z-50 mt-1 w-60 rounded-xl border border-white/15 bg-[#111a2e] p-3 shadow-2xl">
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  {tr(lang, 'fontSize')}: {p.fontSize}px
                </p>
                <input
                  type="range"
                  min={11}
                  max={20}
                  value={p.fontSize}
                  onChange={(e) => p.onFontSize(Number(e.target.value))}
                  className="mb-3 w-full accent-cyan-400"
                />
                <button
                  onClick={() => {
                    p.onResetPanels();
                    setSettingsOpen(false);
                  }}
                  className="w-full rounded-lg bg-white/10 px-2 py-1.5 text-[13px] text-slate-200 hover:bg-white/15"
                >
                  {tr(lang, 'resetPanels')}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
