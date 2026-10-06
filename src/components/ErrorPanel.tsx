import { tr, type Lang } from '../i18n';
import type { ClassifiedError } from '../playground/errors';

export default function ErrorPanel({
  lang,
  error,
}: {
  lang: Lang;
  error: ClassifiedError;
}) {
  const k = `errK_${error.kind}`;
  const title = tr(lang, `${k}_t`);
  const msg = tr(lang, `${k}_m`, {
    detail: error.detail ?? '',
    raw: error.raw.length > 220 ? error.raw.slice(0, 220) + '…' : error.raw,
  });
  const hint = tr(lang, `${k}_h`, { detail: error.detail ?? '' });

  return (
    <div className="rvp-fade-up border-b border-red-400/30 bg-red-500/10 px-3 py-2.5">
      <div className="flex items-center gap-2">
        <span className="text-base">⚠️</span>
        <p className="text-[13px] font-bold text-red-200">{title}</p>
        {error.line != null && (
          <span className="rounded bg-red-400/20 px-1.5 py-0.5 font-mono text-[11px] text-red-200">
            {tr(lang, 'errLine', { line: error.line })}
          </span>
        )}
      </div>
      <p className="mt-1 font-mono text-xs text-red-100/90">{msg}</p>
      {hint && (
        <p className="mt-1.5 text-xs text-slate-300">
          <span className="font-semibold text-slate-100">{tr(lang, 'errHint')}: </span>
          {hint}
        </p>
      )}
    </div>
  );
}
