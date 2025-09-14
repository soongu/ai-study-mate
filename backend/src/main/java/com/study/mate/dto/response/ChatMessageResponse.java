package com.study.mate.dto.response;

import java.time.LocalDateTime;

import com.study.mate.entity.ChatMessage;

import lombok.Builder;

/**
 * 채팅 메시지 응답 DTO (record)
 */
@Builder
public record ChatMessageResponse(
    Long id,
    Long roomId,
    Long senderId,
    String senderNickname,
    String content,
    LocalDateTime createdAt
) {

  public static ChatMessageResponse from(ChatMessage chatMessage) {
    return ChatMessageResponse.builder()
        .id(chatMessage.getId())
        .roomId(chatMessage.getRoom().getId())
        .senderId(chatMessage.getSender().getId())
        .senderNickname(chatMessage.getSender().getNickname())
        .content(chatMessage.getContent())
        .createdAt(chatMessage.getCreatedAt())
        .build();
  }
}


