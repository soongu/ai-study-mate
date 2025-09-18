package com.study.mate.entity;

import jakarta.persistence.*;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "ai_conversation", indexes = {
        @Index(name = "idx_ai_conv_user_created", columnList = "user_id, created_at")
})
public class AIConversation extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 대화 주체(필수)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    // 스터디룸 연계(선택)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id")
    private StudyRoom room;

    // 대화 유형: QA(질문/답변), REVIEW(코드 리뷰)
    @Column(name = "type", length = 16, nullable = false)
    private String type;

    // 보낸 프롬프트(질문/요청)
    @Lob
    @Column(name = "prompt", nullable = false)
    private String prompt;

    // 받은 응답
    @Lob
    @Column(name = "response", nullable = false)
    private String response;

    // 모델 메타(예: gemini-2.0-flash)
    @Column(name = "model", length = 64)
    private String model;

    // 대략 토큰 사용량(백엔드 추정치)
    @Column(name = "tokens")
    private Integer tokens;
}


