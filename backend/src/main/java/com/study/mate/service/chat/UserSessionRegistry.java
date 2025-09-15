package com.study.mate.service.chat;

import org.springframework.stereotype.Component;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 사용자-세션-방 매핑 레지스트리 (메모리 기반)
 *
 * 왜 필요한가?
 * - 한 명의 사용자가 같은 방을 여러 브라우저 탭에서 동시에 열면, 서버 입장에서는
 *   "서로 다른 WebSocket 세션"으로 보입니다. 단순히 구독 이벤트만 보고 입장 알림을 보내면
 *   탭 수 만큼 입장 알림이 중복되고(예: 탭 3개 → 입장 3번), 접속자 수도 3 증가합니다.
 * - 본 레지스트리는 "사용자 단위(providerId)로 방 참여 카운트"를 관리하여
 *   첫 구독에서만 입장 알림을 1번 보내고, 마지막 구독이 해제될 때에만 퇴장 알림을 1번 보내도록 합니다.
 *
 * 동작 개요
 * - 구독(Subscribe) 발생: 세션이 해당 방을 처음 구독하는지 확인 → 사용자 카운트 +1 → 값이 1이 되면 첫 입장
 * - 구독 해제(Unsubscribe) 또는 세션 종료(Disconnect): 세션 수준에서 방 구독이 없어지면 → 사용자 카운트 -1 → 0이면 마지막 퇴장
 *
 * 주의(스레드 안전성)
 * - 이벤트 리스너는 멀티스레드로 호출될 수 있으므로, ConcurrentHashMap/Concurrent Set 등을 사용해 동시성 이슈를 줄입니다.
 * - 본 구현은 단일 애플리케이션 인스턴스 메모리 기준입니다. 서버가 여러 대라면(분산) 외부 저장소(예: Redis)로 확장해야 합니다.
 */
@Component
public class UserSessionRegistry {

    // sessionId → providerId (세션이 어떤 사용자에 속하는지)
    // - 같은 사용자가 탭을 3개 열면 세션도 3개가 됩니다. 세션별로 사용자 식별자를 보관합니다.
    private final Map<String, String> sessionToProvider = new ConcurrentHashMap<>();
    // sessionId → 구독 중인 roomId 집합 (세션이 어떤 방들을 구독 중인지)
    // - 하나의 세션이 여러 방을 동시에 구독할 수도 있어 집합(Set)으로 관리합니다.
    private final Map<String, Set<Long>> sessionToRooms = new ConcurrentHashMap<>();
    // (sessionId:subscriptionId) → roomId (UNSUBSCRIBE 시 어떤 방인지 역추적)
    // - STOMP의 UNSUBSCRIBE 이벤트에는 destination 정보가 없을 수 있어, 구독 시점에 역방향 매핑을 저장해둡니다.
    private final Map<String, Long> subKeyToRoom = new ConcurrentHashMap<>();
    // roomId → (providerId → 참여 카운트) (사용자 단위 카운트, 세션이 늘어나면 +1)
    // - 핵심 구조: "사용자 단위로 이 방에 몇 개의 세션이 연결되어 있는지"를 카운팅합니다.
    // - 예) 같은 사람이 탭 3개로 room 10을 구독하면 {10 → {userA: 3}}
    private final Map<Long, Map<String, Integer>> roomToProviderCount = new ConcurrentHashMap<>();

    /**
     * 구독 시 호출: "첫 입장인지" 여부를 반환합니다.
     *
     * 흐름
     * 1) 세션 → 사용자 매핑 저장 (처음 본 세션이면 기록)
     * 2) (세션, 구독ID) → roomId 역매핑 저장 (UNSUBSCRIBE 때 목적지 파악용)
     * 3) 해당 세션이 이 방을 "처음" 구독하는지 확인
     *    - 같은 세션이 같은 방을 중복 구독해도 사용자 카운트는 증가시키지 않음
     * 4) 세션 기준으로 처음 구독일 때만 사용자 카운트 +1
     * 5) 사용자 카운트가 1이라면 이 사용자가 "방 전체 기준"으로 첫 입장 → true 반환
     */
    public boolean handleSubscribe(String sessionId, String subscriptionId, Long roomId, String providerId) {
        if (sessionId == null || subscriptionId == null || roomId == null || providerId == null) return false;

        sessionToProvider.putIfAbsent(sessionId, providerId);
        subKeyToRoom.put(sessionKey(sessionId, subscriptionId), roomId);

        // 이 세션이 이 방을 처음 구독하는지 체크
        boolean firstInThisSession = sessionToRooms
                .computeIfAbsent(sessionId, k -> ConcurrentHashMap.newKeySet())
                .add(roomId);

        if (!firstInThisSession) return false; // 같은 세션에서 중복 구독이면 사용자 카운트는 증가하지 않음

        // 사용자 단위 카운트 증가 → 1이면 첫 입장
        int after = increaseProviderCount(roomId, providerId);
        return after == 1;
    }

    /**
     * 구독 해제 시 호출: "마지막 퇴장인지" 여부와 roomId/providerId 정보를 반환합니다.
     *
     * 핵심 아이디어
     * - STOMP UNSUBSCRIBE에는 destination이 없을 수 있어, (세션:구독ID)로 roomId를 역추적합니다.
     * - 이 세션이 해당 방에 대해 더 이상 구독이 없다면(마지막 구독 해제) 사용자 카운트를 -1 합니다.
     * - 감소 결과가 0이면 이 사용자는 해당 방에서 완전히 나간 것(lastLeave=true)입니다.
     */
    public LeaveResult handleUnsubscribe(String sessionId, String subscriptionId) {
        if (sessionId == null || subscriptionId == null) return null;
        Long roomId = subKeyToRoom.remove(sessionKey(sessionId, subscriptionId));
        if (roomId == null) return null;

        String providerId = sessionToProvider.get(sessionId);
        if (providerId == null) return new LeaveResult(roomId, null, false);

        Set<Long> rooms = sessionToRooms.get(sessionId);
        boolean lastInThisSession = rooms != null && rooms.remove(roomId);
        if (!lastInThisSession) return new LeaveResult(roomId, providerId, false);

        int after = decreaseProviderCount(roomId, providerId);
        // providerId가 이 방에서 완전히 나간 경우(카운트가 0),
        // 프론트에 보낼 "퇴장 시스템 메시지"의 트리거가 됩니다.
        boolean lastLeave = after == 0;
        
        return new LeaveResult(roomId, providerId, lastLeave);
    }

    /**
     * 세션 종료 시(브라우저 탭 닫힘/네트워크 끊김 등) 모든 구독 해제를 일괄 처리합니다. (선택 사용)
     *
     * 동작
     * - 해당 세션이 구독하던 모든 roomId를 찾아 사용자 카운트를 각각 1씩 감소시킵니다.
     * - 각 방에 대해 lastLeave 여부를 담은 결과 목록을 반환합니다.
     */
    public List<LeaveResult> handleDisconnect(String sessionId) {
        if (sessionId == null) return List.of();
        String providerId = sessionToProvider.remove(sessionId);
        Set<Long> rooms = sessionToRooms.remove(sessionId);
        List<LeaveResult> results = new ArrayList<>();
        if (rooms == null || providerId == null) return results;
        for (Long roomId : rooms) {
            int after = decreaseProviderCount(roomId, providerId);
            results.add(new LeaveResult(roomId, providerId, after == 0));
        }
        // 해당 세션의 구독 키들 제거
        subKeyToRoom.keySet().removeIf(k -> k.startsWith(sessionId + ":"));
        return results;
    }

    // (세션ID와 구독ID)를 합쳐 고유 키를 만듭니다. 예: "sess123:subA"
    private String sessionKey(String sessionId, String subscriptionId) {
        return sessionId + ":" + subscriptionId;
    }

    // 방 기준으로 사용자 카운트를 +1 합니다. 반환값은 증가 후의 카운트입니다.
    // - 반환값이 1이라면 "사용자 단위의 첫 입장"이라는 뜻입니다.
    private int increaseProviderCount(Long roomId, String providerId) {
        Map<String, Integer> map = roomToProviderCount.computeIfAbsent(roomId, k -> new ConcurrentHashMap<>());
        return map.merge(providerId, 1, Integer::sum);
    }

    // 방 기준으로 사용자 카운트를 -1 합니다. 반환값은 감소 후의 카운트입니다.
    // - 감소 결과가 0이 되면 이 사용자는 해당 방에서 완전히 나간 것입니다.
    private int decreaseProviderCount(Long roomId, String providerId) {
        Map<String, Integer> map = roomToProviderCount.get(roomId);
        if (map == null) return 0;
        Integer cur = map.get(providerId);
        if (cur == null || cur <= 1) {
            map.remove(providerId);
            if (map.isEmpty()) roomToProviderCount.remove(roomId);
            return 0;
        }
        int next = cur - 1;
        map.put(providerId, next);
        return next;
    }

    /**
     * 퇴장 처리 결과
     * - roomId: 어느 방의 퇴장/감소 이벤트인지
     * - providerId: 어떤 사용자인지 (null이면 세션-사용자 매핑이 없던 경우)
     * - lastLeave: true이면 "사용자 단위의 마지막 퇴장" → 이제 퇴장 알림을 1회만 보내면 됩니다.
     */
    public record LeaveResult(Long roomId, String providerId, boolean lastLeave) {}
}


