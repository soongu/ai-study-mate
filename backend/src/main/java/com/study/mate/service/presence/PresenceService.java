package com.study.mate.service.presence;

import com.study.mate.entity.ParticipantStatus;
import com.study.mate.service.UsersService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * PresenceService (아주 단순한 In-Memory 버전)
 *
 * 목표(쉬운 설명)
 * - "누가(사용자) 어느 방에서 ONLINE/STUDYING/BREAK/OFFLINE인지"를 메모리에 기록하고,
 *   변경이 생기면 해당 방을 구독한 모두에게 알려줍니다.
 */
@Service
@RequiredArgsConstructor
public class PresenceService {

  // 방마다(키: roomId) 사용자별(키: providerId) 현재 상태를 저장합니다.
    /**
     * store의 구조 예시 
     
      {
        1: { // roomId=1번 방
          "userA": "ONLINE",    // providerId="userA"가 ONLINE 상태
          "userB": "STUDYING"   // providerId="userB"가 STUDYING 상태
        },
        2: { // roomId=2번 방
          "userC": "BREAK"
        }
      }
     
      즉, 각 방(roomId)마다
        - 그 방에 있는 사용자(providerId)별로
        - 현재 상태(ONLINE/STUDYING/BREAK/OFFLINE)를 기록합니다.
     */
    private final Map<Long, Map<String, ParticipantStatus>> store = new ConcurrentHashMap<>();

    // 화면에 알림을 보내는 도구(스프링이 제공)
    private final SimpMessagingTemplate messagingTemplate;
    private final UsersService usersService;

    /** 사용자가 방에 처음 들어왔을 때: ONLINE으로 표시하고 알립니다. */
    public void online(Long roomId, String providerId) {
        store
            .computeIfAbsent(roomId, k -> new ConcurrentHashMap<>())
            .put(providerId, ParticipantStatus.ONLINE);
        broadcast(roomId, providerId, ParticipantStatus.ONLINE);
    }

    /** 사용자가 자신의 상태를 바꿀 때(예: ONLINE → STUDYING) */
    public void updateStatus(Long roomId, String providerId, ParticipantStatus status) {
        store
            .computeIfAbsent(roomId, k -> new ConcurrentHashMap<>())
            .put(providerId, status);
        broadcast(roomId, providerId, status);
    }

    /** 간단한 하트비트: 접속 유지 확인용.  */
    public void heartbeat(Long roomId, String providerId) {
        store.computeIfAbsent(roomId, k -> new ConcurrentHashMap<>())
            .putIfAbsent(providerId, ParticipantStatus.ONLINE);
    }

    /** 사용자가 방에서 완전히 나갔을 때: OFFLINE으로 표시하고 알립니다. */
    public void offline(Long roomId, String providerId) {
        store
            .computeIfAbsent(roomId, k -> new ConcurrentHashMap<>())
            .put(providerId, ParticipantStatus.OFFLINE);
        broadcast(roomId, providerId, ParticipantStatus.OFFLINE);
    }

    /** 실제로 화면으로 상태 변경을 보내는 부분(방 토픽의 presence 서브채널로 전송) */
    private void broadcast(Long roomId, String providerId, ParticipantStatus status) {
        var me = usersService.findMeByProviderId(providerId);
        Long userId = me.getId();
        String nickname = me.getNickname();
        messagingTemplate.convertAndSend(
            "/topic/rooms/" + roomId + "/presence",
            new PresencePayload("PRESENCE", providerId, userId, nickname, status.name())
        );
    }

    /** 프론트에서 타입별 렌더링을 쉽게 하도록 단순한 구조로 보냅니다. */
    public record PresencePayload(String type, String providerId, Long userId, String nickname, String status) {}
}


