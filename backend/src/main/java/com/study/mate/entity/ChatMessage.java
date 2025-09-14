package com.study.mate.entity;

import jakarta.persistence.*;
import lombok.*;

/**
 * 채팅 메시지 엔티티 (MVP: 텍스트 전용)
 *
 * 설명:
 * - 이 테이블은 "누가 어떤 방에서 어떤 메시지를 언제 보냈는지"를 저장합니다.
 * - User(보낸 사람), StudyRoom(어느 방), content(내용), createdAt(보낸 시각)
 */
@Getter
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Entity
@Table(name = "chat_messages", indexes = {
    @Index(name = "idx_chat_room_created", columnList = "room_id, created_at")
})
public class ChatMessage extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "room_id", nullable = false)
    private StudyRoom room;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "sender_id", nullable = false)
    private User sender;

    @Column(nullable = false, length = 1000)
    private String content;
}


