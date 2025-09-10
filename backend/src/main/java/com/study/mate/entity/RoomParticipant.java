package com.study.mate.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * RoomParticipant 엔터티의 관계차수(카디널리티) 설명
 *
 * - RoomParticipant : StudyRoom = N : 1
 *   하나의 StudyRoom(스터디룸)에는 여러 명의 RoomParticipant(참여자)가 참여할 수 있습니다.
 *   (즉, 한 스터디룸에 여러 명의 유저가 참여 가능)
 *
 * - RoomParticipant : User = N : 1
 *   하나의 User(유저)는 여러 RoomParticipant(참여기록)를 가질 수 있습니다.
 *   (즉, 한 유저가 여러 스터디룸에 참여할 수 있음)
 *
 * - RoomParticipant 엔터티는 중간 테이블 역할을 하며,
 *   각 참여자는 하나의 스터디룸에 한 번만 참여할 수 있도록 (room_id, user_id) 유니크 제약조건이 걸려 있습니다.
 *
 * - 역할(ParticipantRole)과 상태(ParticipantStatus)는 참여자의 속성으로 Enum 타입으로 관리됩니다.
 
 
 # 왜 양방향 연관관계를 두지 않았나요?
   1. MVP 단순화와 응집도 유지: 현재 요구사항은 “참여/조회/카운트” 중심이라 
      RoomParticipant → StudyRoom/User 단방향만으로 충분합니다. 
      불필요한 양방향 컬렉션을 두면 동기화 코드와 복잡성이 늘어납니다.
   2. 연관관계의 주인 명확화: 소유측은 RoomParticipant(N:1)입니다. 
      양방향을 열면 StudyRoom.participants, User.participants를 항상 수동 동기화해야 하고, 
      버그 여지가 커집니다.
   3. 성능/지연로딩 안전성: @OneToMany 컬렉션을 열면 무심코 컬렉션 접근으로 N+1이 발생하기 쉽습니다. 
      필요시 쿼리/프로젝션(QueryDSL)로 정확히 가져오는 편이 예측 가능합니다.
   4. 직렬화/응답 안정성: 컬렉션을 열면 Jackson 순환 참조(무한 재귀) 회피 설정이 필요합니다. 
      DTO 응답을 쓰더라도 불필요한 위험을 늘릴 이유가 없습니다.
   5. YAGNI 원칙: 당장 자주 쓰지 않는 탐색(방→참여자, 유저→참여기록)을 위해 양방향을 미리 열지 않습니다. 
      필요 시 그때 추가하는 것이 안전합니다.
 */

@Getter
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Entity
@Table(
        name = "room_participants",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_room_participant", columnNames = {"room_id", "user_id"})
        },
        indexes = {
                @Index(name = "idx_room_participants_room_id", columnList = "room_id"),
                @Index(name = "idx_room_participants_user_id", columnList = "user_id")
        }
)
public class RoomParticipant extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "room_id", nullable = false)
    private StudyRoom room;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ParticipantRole role;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ParticipantStatus status;
}


