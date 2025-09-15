package com.study.mate.service.chat;

import org.springframework.stereotype.Component;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 사용자-세션-방 매핑 레지스트리 (메모리 기반)
 *
 * 개념 쉬운 설명
 * - WebSocket은 브라우저 탭마다 "세션"이 따로 생깁니다.
 * - 같은 사람이 같은 방을 여러 탭에서 열면 서버는 서로 다른 세션으로 인식합니다.
 * - 이 클래스는 "사용자 기준으로 방 참여를 1로 보이게" 만들어, 중복 입장/퇴장 알림을 줄입니다.
 *
 * 하는 일
 * - 채팅 토픽 구독 수를 세션별/사용자별로 세어, 첫 구독에서만 JOIN, 마지막 해제에서만 LEAVE를 보냅니다.
 * - presence(온라인 상태) 토픽 구독도 따로 세어, 첫 구독에서 ONLINE, 마지막 해제에서 OFFLINE을 보냅니다.
 *
 * 왜 이렇게?
 * - 채팅 토픽(/topic/rooms/{id})과 presence 토픽(/topic/rooms/{id}/presence)를 동시에 구독하는 구조이기 때문입니다.
 * - 단순히 "구독 1개 생김/사라짐"으로 처리하면 채팅 닫기만 해도 OFFLINE이 되는 버그가 납니다.
 *
 * 스레드 안전
 * - 이벤트는 동시에 발생할 수 있어 ConcurrentHashMap 등을 사용합니다.
 * - 이 구현은 단일 인스턴스 메모리 기준입니다(분산 시 Redis 등 외부 저장소 필요).
 */
@Component
public class UserSessionRegistry {

    // -----------------------------------------------------
    // 기본 매핑: 세션과 사용자 연결
    // -----------------------------------------------------
    // sessionId → providerId (세션이 어떤 사용자에 속하는지)
    // - 같은 사용자가 탭을 3개 열면 세션도 3개가 됩니다. 세션별로 사용자 식별자를 보관합니다.
    private final Map<String, String> sessionToProvider = new ConcurrentHashMap<>();

    // -----------------------------------------------------
    // 채팅 토픽 구독 카운팅(세션 기준)
    // -----------------------------------------------------
    // sessionId → (roomId → 구독 카운트) (세션이 해당 방을 몇 개의 destination으로 구독 중인지)
    // - 같은 방에 대해 채팅 토픽과 presence 토픽을 따로 구독할 수 있으므로 카운트가 필요합니다.
    private final Map<String, Map<Long, Integer>> sessionToRoomSubCount = new ConcurrentHashMap<>();

    // -----------------------------------------------------
    // 구독ID 역추적 키
    // -----------------------------------------------------
    // (sessionId:subscriptionId) → roomId (UNSUBSCRIBE 시 어떤 방인지 역추적)
    // - STOMP의 UNSUBSCRIBE 이벤트에는 destination 정보가 없을 수 있어, 구독 시점에 역방향 매핑을 저장해둡니다.
    private final Map<String, Long> subKeyToRoom = new ConcurrentHashMap<>();
    // (sessionId:subscriptionId) → 이 구독이 presence 토픽인지 여부
    private final Map<String, Boolean> subKeyIsPresence = new ConcurrentHashMap<>();

    // -----------------------------------------------------
    // 채팅 토픽 구독 카운팅(사용자 기준)
    // -----------------------------------------------------
    // roomId → (providerId → 참여 카운트) (사용자 단위 카운트, 세션이 늘어나면 +1)
    // - 핵심 구조: "사용자 단위로 이 방에 몇 개의 세션이 연결되어 있는지"를 카운팅합니다.
    // - 예) 같은 사람이 탭 3개로 room 10을 구독하면 {10 → {userA: 3}}
    private final Map<Long, Map<String, Integer>> roomToProviderCount = new ConcurrentHashMap<>();

    // -----------------------------------------------------
    // presence 토픽 구독 카운팅
    // -----------------------------------------------------
    // presence 전용: 세션 → (roomId → presence 구독 카운트)
    private final Map<String, Map<Long, Integer>> sessionToRoomPresenceCount = new ConcurrentHashMap<>();
    // presence 전용: roomId → (providerId → presence 구독 카운트)
    private final Map<Long, Map<String, Integer>> roomToProviderPresenceCount = new ConcurrentHashMap<>();

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
        // 필수 파라미터가 없으면 처리하지 않습니다.
        if (sessionId == null || subscriptionId == null || roomId == null || providerId == null) return false;

        // 세션-사용자 매핑을 저장합니다. (이미 있으면 덮어쓰지 않음)
        sessionToProvider.putIfAbsent(sessionId, providerId);
        // (세션ID:구독ID) → roomId 역매핑을 기록합니다.
        subKeyToRoom.put(sessionKey(sessionId, subscriptionId), roomId);
        // 이 구독은 채팅 토픽임을 표시합니다.
        subKeyIsPresence.put(sessionKey(sessionId, subscriptionId), false);

        // 이 세션이 이 방을 처음 구독하는지 체크하고 카운트를 증가합니다.
        Map<Long, Integer> roomCountMap = sessionToRoomSubCount.computeIfAbsent(sessionId, k -> new ConcurrentHashMap<>());
        int newCount = roomCountMap.merge(roomId, 1, Integer::sum);
        if (newCount > 1) {
            // 이미 이 세션이 이 방을 구독 중이었다면(예: 채팅 + presence), 사용자 카운트는 증가하지 않습니다.
            return false;
        }
        // 세션 기준으로 이 방에 대한 첫 구독 → 사용자 단위 카운트 증가. 1이면 첫 입장
        int after = increaseProviderCount(roomId, providerId);
        return after == 1;
    }

    /** presence 토픽 구독 시 호출: presence 기준 첫 입장인지 여부를 반환합니다. */
    public boolean handlePresenceSubscribe(String sessionId, String subscriptionId, Long roomId, String providerId) {
        // 필수 파라미터가 없으면 처리하지 않습니다.
        if (sessionId == null || subscriptionId == null || roomId == null || providerId == null) return false;
        // 세션-사용자 매핑을 저장합니다.
        sessionToProvider.putIfAbsent(sessionId, providerId);
        // (세션ID:구독ID) → roomId 역매핑을 기록합니다.
        subKeyToRoom.put(sessionKey(sessionId, subscriptionId), roomId);
        // 이 구독은 presence 토픽임을 표시합니다.
        subKeyIsPresence.put(sessionKey(sessionId, subscriptionId), true);

        // presence 카운트를 세션 기준으로 +1 합니다.
        Map<Long, Integer> roomCountMap = sessionToRoomPresenceCount.computeIfAbsent(sessionId, k -> new ConcurrentHashMap<>());
        int newCount = roomCountMap.merge(roomId, 1, Integer::sum);
        if (newCount > 1) return false;
        // 사용자 단위 presence 카운트를 +1 합니다. 1이면 presence 기준 첫 입장입니다.
        int after = increaseProviderPresenceCount(roomId, providerId);
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
        // 채팅 토픽 구독 해제 처리
        if (sessionId == null || subscriptionId == null) return null;
        final String key = sessionKey(sessionId, subscriptionId);
        // presence 구독이면 여기서 처리하지 않습니다(전용 메서드 경로)
        Boolean isPresence = subKeyIsPresence.get(key);
        if (Boolean.TRUE.equals(isPresence)) return null;

        // 역매핑에서 roomId를 조회/제거합니다.
        Long roomId = subKeyToRoom.remove(key);
        // 이 키는 채팅 구독 키였으므로 presence 플래그도 함께 제거합니다.
        subKeyIsPresence.remove(key);
        if (roomId == null) return null;

        // 세션이 어떤 사용자인지 확인합니다.
        String providerId = sessionToProvider.get(sessionId);
        if (providerId == null) return new LeaveResult(roomId, null, false);

        // 세션 기준 방 구독 카운트를 감소시킵니다.
        Map<Long, Integer> roomCountMap = sessionToRoomSubCount.get(sessionId);
        if (roomCountMap == null) return new LeaveResult(roomId, providerId, false);
        Integer cur = roomCountMap.get(roomId);
        if (cur == null) return new LeaveResult(roomId, providerId, false);
        if (cur > 1) {
            // 같은 세션에서 해당 방을 여전히 다른 토픽으로 구독 중 → 사용자 카운트 변화 없음
            roomCountMap.put(roomId, cur - 1);
            return new LeaveResult(roomId, providerId, false);
        }
        // 이 세션에서 이 방에 대한 마지막 채팅 구독 해제 → 사용자 카운트 감소
        roomCountMap.remove(roomId);
        if (roomCountMap.isEmpty()) sessionToRoomSubCount.remove(sessionId);
        int after = decreaseProviderCount(roomId, providerId);
        boolean lastLeave = after == 0;
        return new LeaveResult(roomId, providerId, lastLeave);
    }

    /** presence 구독 해제 처리: presence 기준 마지막 퇴장인지 반환 */
    public LeaveResult handlePresenceUnsubscribe(String sessionId, String subscriptionId) {
        // presence 토픽 구독 해제 처리
        if (sessionId == null || subscriptionId == null) return null;
        final String key = sessionKey(sessionId, subscriptionId);
        // presence 구독이 아니면 무시합니다.
        Boolean isPresence = subKeyIsPresence.get(key);
        if (!Boolean.TRUE.equals(isPresence)) return null;
        // roomId를 안전하게 조회합니다.
        Long roomId = subKeyToRoom.get(key);
        if (roomId == null) return null;
        // 실제 키 제거는 마지막에 수행합니다(중간에 삭제되어 참조를 잃지 않도록)
        subKeyIsPresence.remove(key);
        subKeyToRoom.remove(key);

        // 세션이 어떤 사용자인지 확인합니다.
        String providerId = sessionToProvider.get(sessionId);
        if (providerId == null) return new LeaveResult(roomId, null, false);

        // 세션 기준 presence 카운트를 감소시킵니다.
        Map<Long, Integer> roomCountMap = sessionToRoomPresenceCount.get(sessionId);
        if (roomCountMap == null) return new LeaveResult(roomId, providerId, false);
        Integer cur = roomCountMap.get(roomId);
        if (cur == null) return new LeaveResult(roomId, providerId, false);
        if (cur > 1) {
            roomCountMap.put(roomId, cur - 1);
            return new LeaveResult(roomId, providerId, false);
        }
        // 이 세션에서 이 방에 대한 마지막 presence 구독 해제
        roomCountMap.remove(roomId);
        if (roomCountMap.isEmpty()) sessionToRoomPresenceCount.remove(sessionId);
        int after = decreaseProviderPresenceCount(roomId, providerId);
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
        // 세션이 완전히 끊겼을 때 전체 정리를 수행합니다.
        if (sessionId == null) return List.of();
        // 세션-사용자 매핑 제거 후 사용자ID를 얻습니다.
        String providerId = sessionToProvider.remove(sessionId);
        // 세션이 구독하던 채팅·presence 카운트를 각각 제거합니다.
        Map<Long, Integer> roomCountMap = sessionToRoomSubCount.remove(sessionId);
        Map<Long, Integer> presenceCountMap = sessionToRoomPresenceCount.remove(sessionId);
        List<LeaveResult> results = new ArrayList<>();
        if (providerId == null) return results;
        // 채팅 카운트: 각 방에 대해 사용자 카운트를 감소시키고, 마지막이면 lastLeave=true로 결과를 남깁니다.
        if (roomCountMap != null) {
            for (Long roomId : roomCountMap.keySet()) {
                int after = decreaseProviderCount(roomId, providerId);
                results.add(new LeaveResult(roomId, providerId, after == 0));
            }
        }
        // presence 카운트: 사용자 presence 카운트만 감소(OFFLINE 전송 여부는 리스너에서 결정)
        if (presenceCountMap != null) {
            for (Long roomId : presenceCountMap.keySet()) {
                decreaseProviderPresenceCount(roomId, providerId);
            }
        }
        // 해당 세션의 모든 역매핑 키를 제거합니다.
        subKeyToRoom.keySet().removeIf(k -> k.startsWith(sessionId + ":"));
        subKeyIsPresence.keySet().removeIf(k -> k.startsWith(sessionId + ":"));
        return results;
    }

    // (세션ID와 구독ID)를 합쳐 고유 키를 만듭니다. 예: "sess123:subA"
    private String sessionKey(String sessionId, String subscriptionId) {
        // 세션ID와 구독ID를 합쳐 고유 키를 만듭니다. 예: "sess123:subA"
        return sessionId + ":" + subscriptionId;
    }

    // 방 기준으로 사용자 카운트를 +1 합니다. 반환값은 증가 후의 카운트입니다.
    // - 반환값이 1이라면 "사용자 단위의 첫 입장"이라는 뜻입니다.
    private int increaseProviderCount(Long roomId, String providerId) {
        // 채팅 기준: 사용자 단위 카운트를 +1 (1이면 첫 입장)
        Map<String, Integer> map = roomToProviderCount.computeIfAbsent(roomId, k -> new ConcurrentHashMap<>());
        return map.merge(providerId, 1, Integer::sum);
    }

    // 방 기준으로 사용자 카운트를 -1 합니다. 반환값은 감소 후의 카운트입니다.
    // - 감소 결과가 0이 되면 이 사용자는 해당 방에서 완전히 나간 것입니다.
    private int decreaseProviderCount(Long roomId, String providerId) {
        // 채팅 기준: 사용자 단위 카운트를 -1 (0이면 마지막 퇴장)
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

    private int increaseProviderPresenceCount(Long roomId, String providerId) {
        // presence 기준: 사용자 단위 카운트를 +1 (1이면 ONLINE 전송 기준)
        Map<String, Integer> map = roomToProviderPresenceCount.computeIfAbsent(roomId, k -> new ConcurrentHashMap<>());
        return map.merge(providerId, 1, Integer::sum);
    }

    private int decreaseProviderPresenceCount(Long roomId, String providerId) {
        // presence 기준: 사용자 단위 카운트를 -1 (0이면 OFFLINE 전송 기준)
        Map<String, Integer> map = roomToProviderPresenceCount.get(roomId);
        if (map == null) return 0;
        Integer cur = map.get(providerId);
        if (cur == null || cur <= 1) {
            map.remove(providerId);
            if (map.isEmpty()) roomToProviderPresenceCount.remove(roomId);
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


