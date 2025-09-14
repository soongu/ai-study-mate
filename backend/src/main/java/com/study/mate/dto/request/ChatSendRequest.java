package com.study.mate.dto.request;

/**
 * 채팅 전송 요청 (MVP: 텍스트만)
 *
 * 설명:
 * - 브라우저가 서버로 보낼 때 사용하는 간단한 요청입니다.
 * - 예) client.send('/app/rooms/1/chat', {}, JSON.stringify({ content: '안녕하세요' }))
 */
public record ChatSendRequest(
        String content
) {}


