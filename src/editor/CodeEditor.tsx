import { useEffect, useRef } from 'react';
import CodeMirror, { type ReactCodeMirrorRef } from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { keymap } from '@codemirror/view';
import { tr, type Lang } from '../i18n';

interface CodeEditorProps {
  value: string;
  onChange: (v: string) => void;
  onRun: () => void;
  fontSize: number;
  theme: 'dark' | 'light';
  learnLines: [number, number] | null;
  lang: Lang;
  onCopy: () => void;
  onClear: () => void;
  onReset: () => void;
  copied: boolean;
}

export default function CodeEditor({
  value,
  onChange,
  onRun,
  fontSize,
  theme,
  learnLines,
  lang,
  onCopy,
  onClear,
  onReset,
  copied,
}: CodeEditorProps) {
  const ref = useRef<ReactCodeMirrorRef>(null);
  const onRunRef = useRef(onRun);
  onRunRef.current = onRun;

  // Highlight the lines relevant to the current learn step.
  useEffect(() => {
    const view = ref.current?.view;
    if (!view || !learnLines) return;
    const [a, b] = learnLines;
    try {
      const lineA = view.state.doc.line(Math.max(1, Math.min(a, view.state.doc.lines)));
      const lineB = view.state.doc.line(Math.max(1, Math.min(b, view.state.doc.lines)));
      view.dispatch({
        selection: { anchor: lineA.from, head: lineB.to },
        scrollIntoView: true,
      });
      view.focus();
    } catch {
      /* noop */
    }
  }, [learnLines]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between border-b border-white/10 px-3 py-1.5">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          {tr(lang, 'code')} · JSX
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={onCopy}
            title={tr(lang, 'copyCode')}
            className="rounded px-2 py-1 text-xs text-slate-300 hover:bg-white/10"
          >
            {copied ? tr(lang, 'copied') : '⧉'}
          </button>
          <button
            onClick={onClear}
            title={tr(lang, 'clearCode')}
            className="rounded px-2 py-1 text-xs text-slate-300 hover:bg-white/10"
          >
            🗑
          </button>
          <button
            onClick={onReset}
            title={tr(lang, 'resetCode')}
            className="rounded px-2 py-1 text-xs text-slate-300 hover:bg-white/10"
          >
            ↺
          </button>
          <span className="ml-1 hidden rounded bg-white/10 px-1.5 py-0.5 font-mono text-[10px] text-slate-400 lg:inline">
            Ctrl+Enter
          </span>
        </div>
      </div>
      <div className="min-h-0 flex-1" style={{ fontSize }}>
        <CodeMirror
          ref={ref}
          value={value}
          height="100%"
          theme={theme === 'dark' ? 'dark' : 'light'}
          extensions={[
            javascript({ jsx: true }),
            keymap.of([
              {
                key: 'Ctrl-Enter',
                run: () => {
                  onRunRef.current();
                  return true;
                },
              },
              {
                key: 'Cmd-Enter',
                run: () => {
                  onRunRef.current();
                  return true;
                },
              },
            ]),
          ]}
          onChange={(v) => onChange(v)}
          className="h-full"
        />
      </div>
    </div>
  );
}
