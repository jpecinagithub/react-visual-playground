// Friendly, educational error classification. No AI involved: a curated map
// of the errors beginners actually hit in this playground.

export type ErrorKind =
  | 'undefined-prop'
  | 'not-defined'
  | 'not-function'
  | 'too-many-renders'
  | 'module'
  | 'invalid-child'
  | 'missing-key'
  | 'default-export'
  | 'syntax'
  | 'generic';

export interface ClassifiedError {
  kind: ErrorKind;
  detail?: string;
  line: number | null;
  raw: string;
}

export function classifyError(message: string, line: number | null): ClassifiedError {
  const raw = message;
  let m: RegExpMatchArray | null;

  if (
    (m = message.match(
      /Cannot read propert(?:y|ies) of (undefined|null)(?: \(reading '([^']+)'\))?/,
    ))
  )
    return { kind: 'undefined-prop', detail: m[2], line, raw };

  if ((m = message.match(/Cannot destructure property '([^']+)' of '([^']+)' as it is undefined/)))
    return { kind: 'undefined-prop', detail: m[1], line, raw };

  if ((m = message.match(/^\s*([^:\s]+) is not defined/)))
    return { kind: 'not-defined', detail: m[1], line, raw };

  if (/is not a function/.test(message)) return { kind: 'not-function', line, raw };

  if (/Too many re-renders/.test(message) || /Maximum update depth/.test(message))
    return { kind: 'too-many-renders', line, raw };

  if ((m = message.match(/Cannot find module '([^']+)'/)))
    return { kind: 'module', detail: m[1], line, raw };

  if (/Objects are not valid as a React child/.test(message))
    return { kind: 'invalid-child', line, raw };

  if (/unique ["“]key["”]/.test(message)) return { kind: 'missing-key', line, raw };

  if (/default export must be/i.test(message)) return { kind: 'default-export', line, raw };

  if (/Unexpected token|SyntaxError/.test(message)) return { kind: 'syntax', line, raw };

  return { kind: 'generic', line, raw };
}
