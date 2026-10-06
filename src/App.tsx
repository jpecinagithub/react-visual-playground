import { useCallback, useEffect, useRef, useState } from 'react';
import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string';
import Header from './components/Header';
import Landing from './components/Landing';
import ExamplesModal from './components/ExamplesModal';
import LearnPanel from './components/LearnPanel';
import MindMapModal from './components/MindMapModal';
import ErrorPanel from './components/ErrorPanel';
import CodeEditor from './editor/CodeEditor';
import Visualizer from './visualizer/Visualizer';
import { useRuntime } from './playground/useRuntime';
import { loadPrefs, savePrefs, type Lang } from './playground/storage';
import { trackEvent } from './playground/analytics';
import { tr } from './i18n';
import { EXAMPLES, FREE_CODE, type Example } from './content/examples';

const DEFAULT_PANELS: [number, number, number] = [36, 34, 30];

function initialState() {
  const prefs = loadPrefs();
  let exampleId = prefs.exampleId ?? 'usestate';
  let codeByExample: Record<string, string> = prefs.codeByExample ?? {};

  // Shared via URL hash?
  if (typeof window !== 'undefined' && window.location.hash.startsWith('#c=')) {
    try {
      const code = decompressFromEncodedURIComponent(window.location.hash.slice(3));
      if (code) {
        exampleId = '__shared';
        codeByExample = { __shared: code };
      }
    } catch {
      /* ignore */
    }
  }
  if (exampleId !== '__free' && exampleId !== '__shared' && !EXAMPLES.some((e) => e.id === exampleId)) {
    exampleId = 'usestate';
  }
  return {
    lang: (prefs.lang ?? 'en') as Lang,
    theme: (prefs.theme ?? 'dark') as 'dark' | 'light',
    exampleId,
    codeByExample,
    live: prefs.live ?? true,
    fontSize: prefs.fontSize ?? 14,
    panels: (prefs.panels ?? DEFAULT_PANELS) as [number, number, number],
    highlight: prefs.highlight ?? true,
  };
}

function codeFor(exampleId: string, codeByExample: Record<string, string>): { code: string; example?: Example } {
  if (codeByExample[exampleId] != null) {
    const ex = EXAMPLES.find((e) => e.id === exampleId);
    return { code: codeByExample[exampleId], example: ex };
  }
  if (exampleId === '__free' || exampleId === '__shared') {
    return { code: codeByExample[exampleId] ?? FREE_CODE };
  }
  const ex = EXAMPLES.find((e) => e.id === exampleId) ?? EXAMPLES[0];
  return { code: ex.code, example: ex };
}

export default function App() {
  const [init] = useState(initialState);
  const [lang, setLang] = useState<Lang>(init.lang);
  const [theme, setTheme] = useState<'dark' | 'light'>(init.theme);
  const [exampleId, setExampleId] = useState(init.exampleId);
  const [codeByExample, setCodeByExample] = useState(init.codeByExample);
  const [live, setLive] = useState(init.live);
  const [fontSize, setFontSize] = useState(init.fontSize);
  const [panels, setPanels] = useState<[number, number, number]>(init.panels);
  const [learnMode, setLearnMode] = useState(false);
  const [learnStep, setLearnStep] = useState(0);
  const [examplesOpen, setExamplesOpen] = useState(false);
  const [mindmapOpen, setMindmapOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState<'code' | 'preview' | 'viz'>('code');
  const [shareCopied, setShareCopied] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  // Landing first, unless a shared snippet (#c=) wants the playground directly.
  const [view, setView] = useState<'landing' | 'playground'>(() =>
    typeof window !== 'undefined' && window.location.hash.startsWith('#c=')
      ? 'playground'
      : 'landing',
  );

  const runtime = useRuntime();
  const didInit = useRef(false);
  const lastRunCode = useRef<string | null>(null);
  const panelsRef = useRef(panels);
  panelsRef.current = panels;
  const codeRef = useRef('');
  const liveRef = useRef(live);
  liveRef.current = live;

  const { code: code, example: activeExample } = codeFor(exampleId, codeByExample);
  codeRef.current = code;

  const doRun = useCallback(
    (src: string) => {
      lastRunCode.current = src;
      runtime.run(src);
    },
    [runtime],
  );

  // ---- init: first run -------------------------------------------------------
  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;
    document.title = 'React Visual Playground';
    trackEvent('playground_opened');
    runtime.setHighlight(init.highlight);
    doRun(codeRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- live mode -------------------------------------------------------------
  useEffect(() => {
    if (!liveRef.current) return;
    if (lastRunCode.current === code) return;
    const t = window.setTimeout(() => doRun(code), 900);
    return () => window.clearTimeout(t);
  }, [code, doRun]);

  // ---- actions ---------------------------------------------------------------
  const selectExample = (id: string) => {
    setExampleId(id);
    setLearnStep(0);
    setExamplesOpen(false);
    trackEvent('example_selected');
    savePrefs({ exampleId: id });
    const { code: c } = codeFor(id, codeByExample);
    doRun(c);
  };

  const selectFree = () => {
    setCodeByExample((prev) => (prev['__free'] != null ? prev : { ...prev, __free: FREE_CODE }));
    selectExample('__free');
  };

  const handleCodeChange = (v: string) => {
    setCodeByExample((prev) => {
      const next = { ...prev, [exampleId]: v };
      savePrefs({ codeByExample: next });
      return next;
    });
  };

  const handleResetExample = () => {
    const ex = EXAMPLES.find((e) => e.id === exampleId);
    const fresh = ex ? ex.code : FREE_CODE;
    setCodeByExample((prev) => {
      const next = { ...prev, [exampleId]: fresh };
      savePrefs({ codeByExample: next });
      return next;
    });
    setLearnStep(0);
    doRun(fresh);
  };

  const handleResetAll = () => {
    runtime.clearRuntime();
    doRun(codeRef.current);
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(codeRef.current);
      setCopiedCode(true);
      window.setTimeout(() => setCopiedCode(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  };

  const handleShare = async () => {
    try {
      const packed = compressToEncodedURIComponent(codeRef.current);
      const url = `${window.location.origin}${window.location.pathname}#c=${packed}`;
      await navigator.clipboard.writeText(url);
      setShareCopied(true);
      window.setTimeout(() => setShareCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  };

  const changeLang = (l: Lang) => {
    setLang(l);
    savePrefs({ lang: l });
    trackEvent('language_changed');
  };

  const toggleLearn = () => {
    setLearnMode((v) => {
      if (!v) trackEvent('learn_mode_activated');
      return !v;
    });
    setLearnStep(0);
  };

  // ---- resizable panels ------------------------------------------------------
  const onDividerDown = (index: number) => (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const start = [...panelsRef.current];
    const el = e.currentTarget as HTMLElement;
    el.classList.add('dragging');
    const move = (ev: MouseEvent) => {
      const dx = ((ev.clientX - startX) / window.innerWidth) * 100;
      const next = [...start] as [number, number, number];
      next[index] = Math.min(65, Math.max(18, start[index] + dx));
      next[index + 1] = Math.min(65, Math.max(18, start[index + 1] - dx));
      setPanels(next);
    };
    const up = () => {
      el.classList.remove('dragging');
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
      savePrefs({ panels: panelsRef.current });
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  };

  const learnSteps = learnMode ? activeExample?.learn ?? [] : [];
  const learnLines = learnSteps.length > 0 ? learnSteps[Math.min(learnStep, learnSteps.length - 1)].lines ?? null : null;

  const previewUrl = `${import.meta.env.BASE_URL}preview.html`;
  const rs = runtime.state;

  const codePanel = (
    <CodeEditor
      value={code}
      onChange={handleCodeChange}
      onRun={() => doRun(codeRef.current)}
      fontSize={fontSize}
      theme={theme}
      learnLines={learnLines}
      lang={lang}
      onCopy={handleCopyCode}
      onClear={() => handleCodeChange('')}
      onReset={handleResetExample}
      copied={copiedCode}
    />
  );

  const previewPanel = (
    <div className="flex h-full min-h-0 flex-col">
      {learnSteps.length > 0 && (
        <LearnPanel
          lang={lang}
          steps={learnSteps}
          step={Math.min(learnStep, learnSteps.length - 1)}
          onStep={setLearnStep}
          onClose={() => setLearnMode(false)}
        />
      )}
      <div className="flex items-center justify-between border-b border-white/10 px-3 py-1.5">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          {tr(lang, 'preview')}
        </span>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => doRun(codeRef.current)}
            disabled={rs.compiling}
            className="rounded-lg bg-cyan-400 px-3 py-1 text-[13px] font-bold text-[#06202a] hover:bg-cyan-300 disabled:opacity-50"
          >
            {rs.compiling ? tr(lang, 'running') : `▶ ${tr(lang, 'run')}`}
          </button>
          <label className="flex cursor-pointer items-center gap-1.5 rounded-lg px-2 py-1 text-xs text-slate-300 hover:bg-white/5">
            <button
              role="switch"
              aria-checked={live}
              onClick={() => {
                setLive((v) => {
                  savePrefs({ live: !v });
                  return !v;
                });
              }}
              className={`relative h-5 w-9 rounded-full transition-colors ${live ? 'bg-cyan-500' : 'bg-white/15'}`}
            >
              <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${live ? 'left-[18px]' : 'left-0.5'}`} />
            </button>
            {tr(lang, 'live')}
          </label>
          <button
            onClick={handleResetAll}
            className="rounded-lg px-2 py-1 text-xs text-slate-300 hover:bg-white/10"
            title={tr(lang, 'reset')}
          >
            ↺ {tr(lang, 'reset')}
          </button>
        </div>
      </div>
      {rs.error && <ErrorPanel lang={lang} error={rs.error} />}
      <div className="min-h-0 flex-1 bg-white">
        <iframe
          ref={runtime.iframeRef}
          src={previewUrl}
          sandbox="allow-scripts allow-modals"
          title="React preview"
          className="h-full w-full border-0"
        />
      </div>
    </div>
  );

  const vizPanel = (
    <Visualizer
      rt={rs}
      lang={lang}
      code={code}
      onClearTimeline={runtime.clearTimeline}
      onClearLogs={runtime.clearLogs}
      onToggleHighlight={(on) => {
        runtime.setHighlight(on);
        savePrefs({ highlight: on });
      }}
    />
  );

  if (view === 'landing') {
    return <Landing lang={lang} onLang={changeLang} onStart={() => setView('playground')} />;
  }

  return (
    <div className="flex h-full flex-col bg-[#070b14] text-slate-200">
      <Header
        lang={lang}
        onLang={changeLang}
        onHome={() => setView('landing')}
        theme={theme}
        onTheme={() => {
          setTheme((t) => {
            const n = t === 'dark' ? 'light' : 'dark';
            savePrefs({ theme: n });
            return n;
          });
        }}
        onExamples={() => setExamplesOpen(true)}
        learnMode={learnMode}
        onToggleLearn={toggleLearn}
        onMindmap={() => setMindmapOpen(true)}
        onShare={handleShare}
        shareCopied={shareCopied}
        fontSize={fontSize}
        onFontSize={(n) => {
          setFontSize(n);
          savePrefs({ fontSize: n });
        }}
        onResetPanels={() => {
          setPanels(DEFAULT_PANELS);
          savePrefs({ panels: DEFAULT_PANELS });
        }}
      />

      {/* desktop: 3 resizable panels */}
      <div className="hidden min-h-0 flex-1 md:flex">
        <section className="min-w-0" style={{ width: `${panels[0]}%` }}>
          {codePanel}
        </section>
        <div className="rvp-divider w-1.5 shrink-0 bg-white/5" onMouseDown={onDividerDown(0)} />
        <section className="min-w-0 border-x border-white/10" style={{ width: `${panels[1]}%` }}>
          {previewPanel}
        </section>
        <div className="rvp-divider w-1.5 shrink-0 bg-white/5" onMouseDown={onDividerDown(1)} />
        <section className="min-w-0" style={{ width: `${panels[2]}%` }}>
          {vizPanel}
        </section>
      </div>

      {/* mobile: tabs */}
      <div className="flex min-h-0 flex-1 flex-col md:hidden">
        <div className="flex shrink-0 border-b border-white/10">
          {(['code', 'preview', 'viz'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setMobileTab(t)}
              className={`flex-1 px-3 py-2.5 text-[13px] font-semibold ${
                mobileTab === t ? 'border-b-2 border-cyan-400 text-white' : 'text-slate-400'
              }`}
            >
              {tr(lang, t === 'viz' ? 'inspector' : t)}
            </button>
          ))}
        </div>
        <div className="min-h-0 flex-1">
          {mobileTab === 'code' && codePanel}
          {mobileTab === 'preview' && previewPanel}
          {mobileTab === 'viz' && vizPanel}
        </div>
      </div>

      <footer className="flex shrink-0 items-center justify-center gap-2 border-t border-white/10 px-3 py-1.5 text-[11px] text-slate-500">
        <span className="font-semibold text-slate-400">{tr(lang, 'createdBy')}</span>
        <span className="hidden sm:inline">·</span>
        <span className="hidden truncate sm:inline">{tr(lang, 'authorBlurb')}</span>
      </footer>

      <ExamplesModal
        open={examplesOpen}
        onClose={() => setExamplesOpen(false)}
        lang={lang}
        examples={EXAMPLES}
        currentId={exampleId}
        onSelect={selectExample}
        onFree={selectFree}
      />
      <MindMapModal open={mindmapOpen} onClose={() => setMindmapOpen(false)} lang={lang} />
    </div>
  );
}
