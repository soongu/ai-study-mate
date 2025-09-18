package com.study.mate.service;


import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

@Service
public class RateLimiterService {

    private static final int REQUESTS_PER_MINUTE = 3;
    private static final int REQUESTS_PER_DAY = 10;
    private static final int TOKENS_PER_DAY = 100000;

    private final Map<String, MinuteWindow> minuteWindows = new ConcurrentHashMap<>();
    private final Map<String, DayCounter> dayCounters = new ConcurrentHashMap<>();

    /**
     * 사용자별 요청 한도를 검사하고 사용량을 기록합니다.
     *
     * @return 허용되면 true, 한도 초과 시 false
     */
    public boolean tryConsume(String providerId, int estimatedTokens) {
        if (providerId == null || providerId.isBlank()) {
            return false;
        }
        // 각 메소드가 true를 반환해야만 전체 요청이 허용됩니다.
        boolean minuteOk = checkMinuteLimit(providerId);
        boolean dayOk = checkDayLimit(providerId, estimatedTokens);

        return minuteOk && dayOk;
    }

    /**
     * 분당 요청 한도를 검사하고 갱신합니다.
     */
    private boolean checkMinuteLimit(String providerId) {
        long nowMillis = System.currentTimeMillis();
        // 1. 사용자의 분당 카운터를 가져오거나, 없으면 새로 만듭니다.
        MinuteWindow window = minuteWindows.computeIfAbsent(providerId, k -> new MinuteWindow(nowMillis));

        // 2. 분이 바뀌었는지 확인하고, 바뀌었다면 카운터를 리셋합니다.
        if (!window.isSameMinute(nowMillis)) {
            window.reset(nowMillis);
        }
        // 3. 현재 카운터가 한도를 넘었는지 확인합니다.
        if (window.count.get() >= REQUESTS_PER_MINUTE) {
            return false; // 한도 초과!
        }
        // 4. 한도 내라면 카운터를 1 증가시키고 통과시킵니다.
        window.count.incrementAndGet();
        return true;
    }

    /**
     * 일일 요청 및 토큰 한도를 검사하고 갱신합니다.
     */
    private boolean checkDayLimit(String providerId, int estimatedTokens) {
        long nowMillis = System.currentTimeMillis();
        DayCounter day = dayCounters.computeIfAbsent(providerId, k -> new DayCounter(nowMillis));

        if (!day.isSameDay(nowMillis)) {
            day.reset(nowMillis);
        }
        if (day.requests.get() >= REQUESTS_PER_DAY) {
            return false; // 일일 요청 한도 초과!
        }
        if (day.tokens.get() + estimatedTokens > TOKENS_PER_DAY) {
            return false; // 일일 토큰 한도 초과!
        }
        day.requests.incrementAndGet();
        day.tokens.addAndGet(estimatedTokens);
        return true;
    }

    /**
     * 현재 분(Window)에서 남아있는 요청 가능 횟수.
     */
    public int getRemainingRequestsPerMinute(String providerId) {
        long now = System.currentTimeMillis();
        MinuteWindow w = minuteWindows.get(providerId);
        if (w == null || !w.isSameMinute(now)) return REQUESTS_PER_MINUTE;
        return Math.max(0, REQUESTS_PER_MINUTE - w.count.get());
    }

    /**
     * 오늘(Day) 남은 요청 가능 횟수.
     */
    public int getRemainingRequestsPerDay(String providerId) {
        long now = System.currentTimeMillis();
        DayCounter d = dayCounters.get(providerId);
        if (d == null || !d.isSameDay(now)) return REQUESTS_PER_DAY;
        return Math.max(0, REQUESTS_PER_DAY - d.requests.get());
    }

    /**
     * 오늘(Day) 남은 토큰 가능 수.
     */
    public int getRemainingTokensPerDay(String providerId) {
        long now = System.currentTimeMillis();
        DayCounter d = dayCounters.get(providerId);
        if (d == null || !d.isSameDay(now)) return TOKENS_PER_DAY;
        return Math.max(0, TOKENS_PER_DAY - d.tokens.get());
    }


    // --- 내부 카운터 클래스들 ---

    private static final class MinuteWindow {
        long windowStartMillis;
        AtomicInteger count = new AtomicInteger(0);

        MinuteWindow(long now) {
            this.windowStartMillis = now;
        }
        
        boolean isSameMinute(long now) {
            return (this.windowStartMillis / 60000) == (now / 60000);
        }

        void reset(long now) {
            this.windowStartMillis = now;
            this.count.set(0);
        }
    }

    private static final class DayCounter {
        long dayStartMillis;
        AtomicInteger requests = new AtomicInteger(0);
        AtomicInteger tokens = new AtomicInteger(0);

        DayCounter(long now) {
            this.dayStartMillis = now;
        }

        /**
         * "일" 비교는 타임존 때문에 복잡해서 ZonedDateTime을 쓰는 것이 안전합니다.
         * (예: 새벽 1시에 KST는 같은 날, UTC는 다른 날일 수 있음)
         */
        boolean isSameDay(long now) {
            ZoneId zone = ZoneId.systemDefault();
            ZonedDateTime a = Instant.ofEpochMilli(this.dayStartMillis).atZone(zone);
            ZonedDateTime b = Instant.ofEpochMilli(now).atZone(zone);
            return a.toLocalDate().isEqual(b.toLocalDate());
        }

        void reset(long now) {
            this.dayStartMillis = now;
            this.requests.set(0);
            this.tokens.set(0);
        }
    }
}