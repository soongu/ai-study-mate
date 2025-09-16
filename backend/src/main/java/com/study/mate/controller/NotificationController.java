package com.study.mate.controller;

import com.study.mate.service.notification.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.Map;

/**
 * SSE 알림 컨트롤러
 * 
 * 설명:
 * - Server-Sent Events(SSE) 연결을 관리하는 REST 엔드포인트를 제공합니다.
 * - 클라이언트는 /api/notifications/subscribe 에 연결하여 실시간 알림을 받을 수 있습니다.
 * - JwtAuthenticationFilter에서 자동으로 JWT 토큰 검증이 수행되므로 @AuthenticationPrincipal로 간단하게 사용자 정보를 가져올 수 있습니다.
 * 
 * 주요 기능:
 * 1. SSE 구독 엔드포인트 (/api/notifications/subscribe)
 * 2. 연결 상태 조회 엔드포인트 (/api/notifications/status)
 * 3. Spring Security 자동 인증 처리
 */
@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@Slf4j
public class NotificationController {
    
    private final NotificationService notificationService;
    
    /**
     * SSE 구독 엔드포인트
     * 
     * 클라이언트가 이 엔드포인트에 연결하면 실시간 알림을 받을 수 있습니다.
     * 연결은 최대 30분간 유지되며, 타임아웃이나 오류 발생 시 자동으로 해제됩니다.
     * 
     * @param providerId JWT 토큰에서 추출된 사용자 식별자 (JwtAuthenticationFilter에서 자동 처리)
     * @return SseEmitter 객체
     */
    @GetMapping(value = "/subscribe", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter subscribe(@AuthenticationPrincipal String providerId) {
        log.info("SSE 구독 요청 수신: providerId={}", providerId);
        
        // JwtAuthenticationFilter에서 이미 인증이 완료되었으므로 providerId는 항상 유효함
        return notificationService.createConnection(providerId);
    }
    
    /**
     * 현재 SSE 연결 상태를 조회합니다.
     * 
     * 개발 및 모니터링 목적으로 사용되는 엔드포인트입니다.
     * 현재 연결된 사용자 수와 총 연결 수를 반환합니다.
     * 
     * @return 연결 상태 정보
     */
    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getConnectionStatus() {
        int totalConnections = notificationService.getTotalConnections();
        int uniqueUsers = notificationService.getConnectedUsers().size();
        
        Map<String, Object> status = Map.of(
            "totalConnections", totalConnections,
            "uniqueUsers", uniqueUsers,
            "connectedUsers", notificationService.getConnectedUsers()
        );
        
        log.info("SSE 연결 상태 조회: totalConnections={}, uniqueUsers={}", totalConnections, uniqueUsers);
        return ResponseEntity.ok(status);
    }
    
    /**
     * SSE 연결 테스트 엔드포인트
     * 
     * 현재 로그인한 사용자의 SSE 연결 상태를 테스트합니다.
     * 개발 및 디버깅 목적으로 사용됩니다.
     * 
     * @param providerId JWT 토큰에서 추출된 사용자 식별자
     * @return 테스트 결과
     */
    @PostMapping("/test")
    public ResponseEntity<Map<String, Object>> testConnection(@AuthenticationPrincipal String providerId) {
        log.info("SSE 연결 테스트 요청: providerId={}", providerId);
        
        boolean success = notificationService.testConnection(providerId);
        int connections = notificationService.getUserConnections(providerId);
        
        Map<String, Object> result = Map.of(
            "success", success,
            "providerId", providerId,
            "connections", connections,
            "message", success ? "연결 테스트 성공" : "연결이 없거나 실패"
        );
        
        return ResponseEntity.ok(result);
    }
}
