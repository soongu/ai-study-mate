package com.study.mate.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Entity
@Table(name = "study_rooms")
public class StudyRoom extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String title;

    @Column(length = 1000)
    private String description;

    @Builder.Default
    @Column(name = "max_participants", nullable = false)
    private Integer maxParticipants = 4;

    // optional=false로 설정한 이유는 StudyRoom의 host(방장)는 반드시 존재해야 하는 필수 연관관계이기 때문입니다.
    // 즉, 스터디룸 생성 시 반드시 host(유저)가 지정되어야 하며, null이 될 수 없음을 JPA와 DB에 명확히 알리기 위함입니다.
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "host_id", nullable = false)
    private User host;

    
    @PrePersist
    void onPrePersist() {
        // MVP 요구사항: 항상 4명으로 고정
        this.maxParticipants = 4;
    }
}


