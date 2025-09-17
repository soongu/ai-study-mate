// 매우 단순한 토큰 수 추정(교육용)
// - 대략 영어/코드 기준 1 토큰 ≈ 4 문자 가정
// - 한글/혼합 텍스트는 약간 가중치(+10%)

const BASE_CHARS_PER_TOKEN = 4;

export function estimateTokens(text = '', language = 'auto') {
  if (!text) return 0;
  const len = text.length;
  const ratio = language === 'auto' ? 3.6 : 4; // auto일 때 살짝 보수적
  const raw = Math.ceil(len / (ratio || BASE_CHARS_PER_TOKEN));
  // 한글/유니코드가 많으면 +10%
  const hasCJK =
    /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\u3130-\u318f\uac00-\ud7af]/.test(
      text
    );
  return hasCJK ? Math.ceil(raw * 1.1) : raw;
}
