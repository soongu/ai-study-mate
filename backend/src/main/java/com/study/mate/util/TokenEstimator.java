package com.study.mate.util;

/**
 * LLM 토큰 사용량을 대략 추정하는 유틸리티입니다.
 * - 매우 단순한 휴리스틱: 영문/숫자 위주 텍스트는 1토큰≈4자, CJK(한글/한자) 비율이 높으면 1토큰≈2자 근사치를 사용합니다.
 * - 과금/제한 안내 등 대략치가 필요할 때만 사용합니다(정확한 값은 모델/벤더별 상이).
 */
public final class TokenEstimator {
    private TokenEstimator() {}

    public static int estimate(String text) {
        if (text == null || text.isBlank()) return 0;
        int length = text.length();
        int cjkCount = 0;
        for (int i = 0; i < text.length(); i++) {
            char ch = text.charAt(i);
            // 한글/한자/가나 등 CJK 대역 간략 판정
            if (isCjk(ch)) cjkCount++;
        }
        double cjkRatio = (double) cjkCount / (double) length;
        // CJK 비율이 30% 이상이면 더 보수적인(짧은 글자당 토큰↑) 근사 사용
        double charsPerToken = cjkRatio >= 0.3 ? 2.0 : 4.0;
        return (int) Math.ceil(length / charsPerToken);
    }

    private static boolean isCjk(char ch) {
        Character.UnicodeBlock block = Character.UnicodeBlock.of(ch);
        return block == Character.UnicodeBlock.CJK_UNIFIED_IDEOGRAPHS
                || block == Character.UnicodeBlock.CJK_UNIFIED_IDEOGRAPHS_EXTENSION_A
                || block == Character.UnicodeBlock.CJK_UNIFIED_IDEOGRAPHS_EXTENSION_B
                || block == Character.UnicodeBlock.CJK_COMPATIBILITY_IDEOGRAPHS
                || block == Character.UnicodeBlock.HANGUL_SYLLABLES
                || block == Character.UnicodeBlock.HANGUL_JAMO
                || block == Character.UnicodeBlock.HANGUL_COMPATIBILITY_JAMO
                || block == Character.UnicodeBlock.HIRAGANA
                || block == Character.UnicodeBlock.KATAKANA;
    }
}


