package com.study.mate.service.notification;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.study.mate.dto.NotificationDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

/**
 * SSE 알림 서비스 
 * 
 * SSE(Server-Sent Events)란 무엇인가요?
 * - 서버에서 클라이언트로 실시간으로 데이터를 보내는 기술입니다.
 * - WebSocket과 달리 "단방향" 통신입니다 (서버 → 클라이언트만 가능).
 * - 브라우저가 탭을 백그라운드로 보내도 알림을 받을 수 있습니다.
 * 
 * WebSocket과 SSE의 차이점은?
 * - WebSocket: 양방향 통신 (서버 ↔ 클라이언트) - 채팅에 적합
 * - SSE: 단방향 통신 (서버 → 클라이언트) - 알림에 적합
 * 
 * SSE는 언제 사용하나요?
 * - 새 메시지가 왔을 때 브라우저 알림을 보내고 싶을 때
 * - 사용자가 다른 탭을 보고 있어도 알림을 받아야 할 때
 * - 실시간 상태 업데이트 (온라인/오프라인 등)를 알려주고 싶을 때
 * 
 * 이 서비스의 주요 역할:
 * 1. 사용자별로 SSE 연결을 관리합니다 (한 사용자가 여러 탭을 열 수 있음)
 * 2. 채팅 메시지, 입장/퇴장, 상태 변경 등의 알림을 전송합니다
 * 3. 연결이 끊어지지 않도록 주기적으로 하트비트를 보냅니다
 * 4. 오래된 연결을 자동으로 정리합니다
 * 
 * 💡 간단한 비유:
 * - WebSocket = 전화통화 (서로 대화 가능)
 * - SSE = 라디오 방송 (방송국에서 청취자에게만 전송)
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {
    
    /**
     * JSON 변환 도구
     * - 우리가 보내는 알림 데이터(NotificationDto)를 JSON 문자열로 변환해줍니다.
     * - 예: NotificationDto → "{"type":"CHAT_MESSAGE","message":"안녕하세요"}"
     * - 브라우저는 JSON 형태로 데이터를 받아야 이해할 수 있습니다.
     */
    private final ObjectMapper objectMapper;
    
    /**
     /**
      * 사용자별 SSE 연결을 관리하는 맵입니다.
      * Key: providerId (사용자 식별자)
      * Value: SseEmitter의 리스트 (CopyOnWriteArrayList)
      *
      * CopyOnWriteArrayList란?
      * - 자바의 스레드 안전한 리스트 구현체입니다.
      * - 여러 스레드가 동시에 읽고 쓸 때 충돌 없이 동작합니다.
      * - "CopyOnWrite"란, 리스트에 변경(추가/삭제)이 일어날 때마다
      *   내부적으로 전체 배열을 복사해서 새로 만듭니다.
      * - 읽기(알림 전송)는 매우 빠르고, 쓰기(연결 추가/제거)는 느릴 수 있습니다.
      * - 이 서비스처럼 "읽기(알림 전송)가 매우 많고, 쓰기(연결 추가/제거)는 드물게 일어나는" 상황에 적합합니다.
      * - 한 사용자가 여러 탭/브라우저에서 접속할 수 있으므로, providerId별로 여러 SseEmitter를 가질 수 있습니다.
      */
    private final Map<String, CopyOnWriteArrayList<SseEmitter>> userEmitters = new ConcurrentHashMap<>();
    
    /**
     * SSE 연결 타임아웃 (2시간)
     * 
     * 왜 타임아웃이 필요한가요?
     * - 브라우저와 서버 사이의 연결이 영원히 유지될 수는 없습니다.
     * - 네트워크 문제, 브라우저 종료 등으로 연결이 끊어질 수 있습니다.
     * - 2시간 후에 자동으로 연결을 끊어서 서버 자원을 보호합니다.
     * - 프론트엔드에서는 연결이 끊어지면 자동으로 다시 연결해야 합니다.
     */
    private static final long SSE_TIMEOUT = 2 * 60 * 60 * 1000L;
    
    /**
     * 새로운 SSE 연결을 등록합니다 (사용자가 알림을 받기 시작할 때 호출)
     * 
     * 동작 과정:
     * 1. 사용자가 웹페이지에 접속하면 프론트엔드에서 /api/notifications/subscribe를 호출
     * 2. 이 메서드가 실행되어 해당 사용자를 위한 SSE 연결을 만듦
     * 3. 이제 서버에서 이 사용자에게 실시간 알림을 보낼 수 있음
     * 
     * @param providerId 사용자 ID (JWT 토큰에서 추출된 식별자)
     * @return SseEmitter 객체 (스프링이 SSE 연결을 관리하는 도구)
     */
    public SseEmitter createConnection(String providerId) {
        log.info("SSE 연결 생성 시작: providerId={}", providerId);
        
        // 1) SseEmitter 생성 (SSE 연결을 관리하는 스프링의 도구)
        SseEmitter emitter = new SseEmitter(SSE_TIMEOUT);
        
        // 2) 사용자별 연결 목록에 추가 (한 사용자가 여러 탭을 열 수 있음)
        // computeIfAbsent: 해당 키(providerId)가 없으면 새 리스트를 만들고, 있으면 기존 리스트를 가져옴
        userEmitters.computeIfAbsent(providerId, k -> new CopyOnWriteArrayList<>()).add(emitter);
        
        // 3) 연결 성공 메시지를 클라이언트에게 즉시 전송 (연결이 잘 되었는지 확인용)
        try {
            emitter.send(SseEmitter.event()
                .name("connected")  // 이벤트 이름 (프론트엔드에서 addEventListener로 받음)
                .data("SSE 연결이 성공했습니다.")); // 실제 데이터
        } catch (IOException e) {
            log.warn("SSE 연결 완료 이벤트 전송 실패: providerId={}", providerId, e);
            removeEmitter(providerId, emitter); // 실패하면 연결 제거
        }
        
        // 4) 연결 상태 변경 시 자동 처리 설정 (이벤트 리스너 등록)
        
        // 타임아웃 발생 시 (2시간 후)
        emitter.onTimeout(() -> {
            log.info("SSE 연결 타임아웃: providerId={}", providerId);
            removeEmitter(providerId, emitter); // 연결 목록에서 제거
        });
        
        // 연결 정상 종료 시 (클라이언트가 페이지를 닫거나 새로고침)
        emitter.onCompletion(() -> {
            log.info("SSE 연결 정상 종료: providerId={}", providerId);
            removeEmitter(providerId, emitter); // 연결 목록에서 제거
        });
        
        // 연결 오류 발생 시 (네트워크 문제 등)
        emitter.onError((ex) -> {
            log.warn("SSE 연결 오류 발생: providerId={}", providerId, ex);
            removeEmitter(providerId, emitter); // 연결 목록에서 제거
        });
        
        log.info("현재 활성 SSE 연결 수: {}", getTotalConnections());
        return emitter; // 컨트롤러에게 반환 (스프링이 자동으로 SSE 응답 처리)
    }
    
    /**
     * 특정 사용자에게 알림을 전송합니다 (핵심 메서드!)
     * 
     * 언제 사용되나요?
     * - 누군가 채팅을 보냈을 때: "김철수님이 메시지를 보냈습니다"
     * - 누군가 방에 입장했을 때: "이영희님이 입장했습니다"  
     * - 누군가 상태를 변경했을 때: "박민수님이 학습 중입니다"
     * 
     * 동작 과정:
     * 1. 해당 사용자의 모든 SSE 연결을 찾음 (여러 탭을 열었을 수 있음)
     * 2. 각 연결에 JSON 형태로 알림 데이터를 전송
     * 3. 전송에 실패한 연결은 자동으로 제거 (이미 끊어진 연결)
     * 
     * @param providerId 알림을 받을 사용자 ID
     * @param notification 전송할 알림 데이터 (NotificationDto 객체)
     */
    public void sendToUser(String providerId, NotificationDto notification) {
        // 1) 해당 사용자의 SSE 연결 목록을 가져옴
        CopyOnWriteArrayList<SseEmitter> emitters = userEmitters.get(providerId);
        
        // 연결이 없다면 알림을 보낼 수 없음 (사용자가 오프라인이거나 SSE를 사용하지 않음)
        if (emitters == null || emitters.isEmpty()) {
            log.debug("SSE 연결이 없는 사용자 (알림 전송 불가): providerId={}", providerId);
            return;
        }
        
        log.info("사용자별 알림 전송 시작: providerId={}, type={}, message={}", 
            providerId, notification.type(), notification.message());
        
        // 2) 해당 사용자의 모든 연결(탭)에 알림 전송
        // removeIf: 조건에 맞는 요소를 리스트에서 제거하는 메서드
        emitters.removeIf(emitter -> {
            try {
                // JSON으로 변환된 알림 데이터를 SSE로 전송
                emitter.send(SseEmitter.event()
                    .name("notification")  // 이벤트 이름 (프론트엔드에서 구분용)
                    .data(objectMapper.writeValueAsString(notification))); // 객체 → JSON 문자열
                
                log.debug("알림 전송 성공: providerId={}", providerId);
                return false; // 성공하면 리스트에서 제거하지 않음 (연결 유지)
                
            } catch (IOException e) {
                log.warn("알림 전송 실패 (연결이 이미 끊어짐): providerId={}", providerId, e);
                return true; // 실패하면 리스트에서 제거 (끊어진 연결 정리)
            }
        });
        
        // 3) 모든 연결이 끊어졌다면 사용자 자체를 맵에서 제거 (메모리 절약)
        if (emitters.isEmpty()) {
            userEmitters.remove(providerId);
            log.debug("🗑️ 모든 연결이 끊어진 사용자 제거: providerId={}", providerId);
        }
    }
    
    /**
     * 특정 룸의 모든 참여자에게 알림을 전송합니다 (브로드캐스트)
     * 
     * 브로드캐스트란?
     * - 방송국에서 모든 청취자에게 동시에 방송을 보내는 것처럼
     * - 한 스터디룸의 모든 참여자에게 같은 알림을 보내는 것입니다
     * 
     * 사용 예시:
     * - 김철수가 채팅을 보냄 → 같은 방의 다른 모든 사람들에게 알림
     * - 이영희가 방에 입장함 → 이미 방에 있던 모든 사람들에게 알림
     * - 박민수가 학습 상태로 변경 → 같은 방의 모든 사람들에게 알림
     * 
     * 중요한 규칙:
     * - 자신이 한 행동은 자신에게 알림하지 않습니다
     * - 예: 내가 채팅을 보냈는데 나에게까지 알림이 오면 이상하겠죠?
     * 
     * @param roomParticipants 룸 참여자들의 providerId 목록
     * @param notification 전송할 알림 데이터
     */
    public void sendToRoomParticipants(java.util.List<String> roomParticipants, NotificationDto notification) {
        // 1) 참여자 목록이 비어있는지 확인
        if (roomParticipants == null || roomParticipants.isEmpty()) {
            log.debug("룸 참여자가 없음 (알림 전송 불가): roomId={}", notification.roomId());
            return;
        }
        
        log.info("룸 전체 브로드캐스트 시작: roomId={}, participants={}, type={}", 
            notification.roomId(), roomParticipants.size(), notification.type());
        
        // 2) 각 참여자에게 개별적으로 알림 전송 (반복문 사용)
        for (String providerId : roomParticipants) {
            // 중요: 자신이 발생시킨 이벤트는 자신에게 알림하지 않음
            // 예: 내가 채팅을 보냈는데 나에게 "새 메시지가 있습니다" 알림이 오면 이상함
            if (!providerId.equals(notification.providerId())) {
                sendToUser(providerId, notification); // 위에서 정의한 개별 전송 메서드 호출
                log.debug("개별 알림 전송 완료: providerId={}", providerId);
            } else {
                log.debug("본인에게는 알림 전송 스킵: providerId={}", providerId);
            }
        }
        
        log.info("룸 전체 브로드캐스트 완료: roomId={}", notification.roomId());
    }
    
    /**
     * 특정 emitter를 제거합니다.
     */
    private void removeEmitter(String providerId, SseEmitter emitter) {
        CopyOnWriteArrayList<SseEmitter> emitters = userEmitters.get(providerId);
        if (emitters != null) {
            emitters.remove(emitter);
            if (emitters.isEmpty()) {
                userEmitters.remove(providerId);
            }
        }
    }
    
    /**
     * 현재 총 연결 수를 반환합니다.
     */
    public int getTotalConnections() {
        return userEmitters.values().stream()
            .mapToInt(CopyOnWriteArrayList::size)
            .sum();
    }
    
    /**
     * 특정 사용자의 연결 수를 반환합니다.
     */
    public int getUserConnections(String providerId) {
        CopyOnWriteArrayList<SseEmitter> emitters = userEmitters.get(providerId);
        return emitters != null ? emitters.size() : 0;
    }
    
    /**
     * 현재 연결된 모든 사용자 ID를 반환합니다.
     */
    public Set<String> getConnectedUsers() {
        return userEmitters.keySet();
    }
    
    /**
     * 주기적으로 모든 연결에 하트비트를 전송하여 연결을 유지합니다
     * 
     * 하트비트가 왜 필요한가요?
     * - 사람의 심장박동처럼 "나는 살아있어요!"라는 신호를 보내는 것입니다
     * - SSE 연결이 2시간 동안 아무 데이터도 주고받지 않으면 자동으로 끊어집니다
     * - 10분마다 작은 메시지를 보내서 "연결이 살아있다"는 것을 알려줍니다
     * - 이렇게 하면 사용자가 아무것도 하지 않아도 알림을 계속 받을 수 있습니다
     * 
     * 동작 과정:
     * 1. 10분마다 자동으로 이 메서드가 실행됨 (@Scheduled 어노테이션)
     * 2. 현재 연결된 모든 사용자에게 하트비트 메시지 전송
     * 3. 전송에 실패한 연결은 이미 끊어진 것으로 간주하여 제거
     * 4. 프론트엔드에서는 이 하트비트를 받으면 "연결이 살아있구나"를 확인
     */
    @Scheduled(fixedRate = 10 * 60 * 1000) // 10분(600초)마다 실행
    public void sendHeartbeat() {
        // 1) 연결된 사용자가 없으면 하트비트를 보낼 필요 없음
        if (userEmitters.isEmpty()) {
            return; // 일찍 종료 (early return)
        }
        
        log.debug("💓SE 하트비트 전송 시작 - 연결된 사용자: {}", userEmitters.size());
        
        // 2) 하트비트 데이터 준비 (JSON 형태의 문자열)
        String heartbeatData = String.format("{\"type\":\"heartbeat\",\"timestamp\":\"%s\"}", LocalDateTime.now());
        
        // 3) 모든 사용자의 모든 연결에 하트비트 전송
        userEmitters.entrySet().removeIf(entry -> {
            String providerId = entry.getKey();
            CopyOnWriteArrayList<SseEmitter> emitters = entry.getValue();
            
            // 해당 사용자의 모든 연결(탭)에 하트비트 전송
            emitters.removeIf(emitter -> {
                try {
                    emitter.send(SseEmitter.event()
                        .name("heartbeat")  // 이벤트 이름
                        .data(heartbeatData)); // 하트비트 데이터
                    return false; // 성공하면 연결을 유지 (제거하지 않음)
                } catch (IOException e) {
                    log.debug("하트비트 전송 실패 (연결이 끊어짐): providerId={}", providerId);
                    return true; // 실패하면 끊어진 연결로 간주하여 제거
                }
            });
            
            // 모든 연결이 끊어진 사용자는 맵에서도 제거
            return emitters.isEmpty();
        });
        
        // 4) 하트비트 전송 결과 로깅
        int activeConnections = getTotalConnections();
        if (activeConnections > 0) {
            log.debug("💓 하트비트 전송 완료 - 살아있는 연결: {}", activeConnections);
        }
    }
    
    /**
     * 특정 사용자에게 연결 테스트 메시지를 전송합니다
     * 
     * 언제 사용하나요?
     * - 개발할 때 SSE가 제대로 동작하는지 확인하고 싶을 때
     * - 사용자가 "알림이 안 와요"라고 할 때 연결 상태를 확인할 때
     * - 디버깅할 때 특정 사용자의 연결이 살아있는지 테스트할 때
     * 
     * 동작 과정:
     * 1. 해당 사용자의 SSE 연결이 있는지 확인
     * 2. 있다면 테스트 메시지를 전송해봄
     * 3. 성공하면 true, 실패하면 false 반환
     * 
     * 💡 사용법:
     * - POST /api/notifications/test 엔드포인트에서 호출됩니다
     * - 프론트엔드에서는 "test" 이벤트를 받으면 "연결 테스트 완료" 메시지가 보입니다
     * 
     * @param providerId 테스트할 사용자의 ID
     * @return 테스트 성공 여부 (true: 성공, false: 실패)
     */
    public boolean testConnection(String providerId) {
        // 1) 해당 사용자의 SSE 연결이 있는지 확인
        CopyOnWriteArrayList<SseEmitter> emitters = userEmitters.get(providerId);
        if (emitters == null || emitters.isEmpty()) {
            log.debug("테스트 실패: SSE 연결이 없는 사용자 - providerId={}", providerId);
            return false; // 연결이 없으면 테스트 실패
        }
        
        // 2) 테스트 메시지 데이터 준비
        String testData = String.format(
            "{\"type\":\"test\",\"message\":\"연결 테스트 성공!\",\"timestamp\":\"%s\"}", 
            LocalDateTime.now()
        );
        
        // 3) 해당 사용자의 모든 연결(탭)에 테스트 메시지 전송 (안전하게 처리)
        boolean anySuccess = false;
        
        // removeIf를 사용해서 전송 실패한 연결은 자동으로 제거
        emitters.removeIf(emitter -> {
            try {
                emitter.send(SseEmitter.event()
                    .name("test")      // 이벤트 이름 (프론트엔드에서 구분용)
                    .data(testData));  // 테스트 데이터
                return false; // 성공하면 제거하지 않음
            } catch (IOException e) {
                log.debug("테스트 메시지 전송 실패 (연결이 끊어짐): providerId={}", providerId, e);
                return true; // 실패하면 리스트에서 제거
            }
        });
        
        // 전송 후 남은 연결이 있다면 성공으로 간주
        anySuccess = !emitters.isEmpty();
        
        // 빈 리스트가 되면 맵에서도 제거
        if (emitters.isEmpty()) {
            userEmitters.remove(providerId);
            log.debug("모든 연결이 끊어진 사용자 제거: providerId={}", providerId);
        }
        
        if (anySuccess) {
            log.info("SSE 연결 테스트 성공: providerId={}, activeConnections={}", providerId, emitters.size());
        } else {
            log.warn("SSE 연결 테스트 실패: 모든 연결이 끊어짐 - providerId={}", providerId);
        }
        
        return anySuccess;
    }
}
