export interface RedactionResult {
  text: string;
  replacements: number;
}

const patterns: RegExp[] = [
  /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9_]{20,}\b/g,
  /\bsk-[A-Za-z0-9_-]{20,}\b/g,
  /\bxox[baprs]-[A-Za-z0-9-]{20,}\b/g,
  /\b[A-Za-z0-9._%+-]+:[A-Za-z0-9._~+/=-]{12,}@/g,
  /\b(?:api[_-]?key|token|secret|password|passwd|pwd)\s*[:=]\s*['\"]?[^\s'\"]{8,}/gi,
  /-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g
];

export function redactText(input: string): RedactionResult {
  let text = input;
  let replacements = 0;

  for (const pattern of patterns) {
    text = text.replace(pattern, (match) => {
      replacements += 1;
      if (match.includes('@') && match.includes(':') && !/token|secret|password/i.test(match)) {
        return '[REDACTED-CREDENTIAL]@';
      }
      return '[REDACTED]';
    });
  }

  return { text, replacements };
}

export function redactRecord<T>(value: T): { value: T; replacements: number } {
  let replacements = 0;

  const visit = (item: unknown): unknown => {
    if (typeof item === 'string') {
      const redacted = redactText(item);
      replacements += redacted.replacements;
      return redacted.text;
    }
    if (Array.isArray(item)) return item.map(visit);
    if (item && typeof item === 'object') {
      return Object.fromEntries(
        Object.entries(item as Record<string, unknown>).map(([key, nested]) => [key, visit(nested)])
      );
    }
    return item;
  };

  return { value: visit(value) as T, replacements };
}
