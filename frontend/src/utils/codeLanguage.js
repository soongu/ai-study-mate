// 간단한 코드 언어 자동 감지 (MVP)
// - 정규식/키워드 기반 점수 매칭
// - 대상: java, javascript, typescript, python, sql

const patterns = {
  java: [
    /package\s+[\w.]+;/,
    /import\s+java\./,
    /public\s+class\s+\w+/,
    /public\s+static\s+void\s+main\s*\(/,
  ],
  typescript: [
    /:\s*string|:\s*number|:\s*boolean|:\s*any/,
    /interface\s+\w+\s*\{/,
    /type\s+\w+\s*=\s*/,
  ],
  javascript: [
    /function\s+\w+\s*\(/,
    /const\s+\w+\s*=\s*/,
    /=>\s*\{/,
    /import\s+.*\s+from\s+['"][\w/@.-]+['"]/,
  ],
  python: [
    /^\s*def\s+\w+\s*\(/m,
    /^\s*class\s+\w+\s*\(/m,
    /^\s*import\s+\w+/m,
    /^\s*if\s+__name__\s*==\s*['"]__main__['"]\s*:/m,
  ],
  sql: [
    /\bselect\b[\s\S]+\bfrom\b/i,
    /\binsert\b\s+into/i,
    /\bupdate\b\s+\w+\s+set/i,
    /\bcreate\s+table\b/i,
  ],
};

export function detectCodeLanguage(code) {
  if (!code || typeof code !== 'string') return 'auto';
  const sample = code.slice(0, 4000); // 비용 절약
  const scores = { java: 0, javascript: 0, typescript: 0, python: 0, sql: 0 };
  for (const lang of Object.keys(patterns)) {
    for (const re of patterns[lang]) {
      if (re.test(sample)) scores[lang] += 1;
    }
  }
  // typescript 우선 규칙: TS 신호가 있으면 JS보다 우선
  if (scores.typescript > 0 && scores.javascript > 0) {
    scores.typescript += 1; // 가중치
  }
  const best = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
  if (!best || best[1] === 0) return 'auto';
  return best[0];
}
