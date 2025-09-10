package com.study.mate.repository;

import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.study.mate.repository.dto.StudyRoomWithParticipantCount;

import lombok.RequiredArgsConstructor;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

import static org.springframework.util.StringUtils.hasText;
import static com.study.mate.entity.QStudyRoom.studyRoom;
import static com.study.mate.entity.QRoomParticipant.roomParticipant;


/**
 * 스터디룸 조회용 QueryDSL 커스텀 리포지토리 구현체.
 *
 * 설계 포인트
 * - 참여자 수를 함께 반환해야 하므로, 방(StudyRoom)과 참여자(RoomParticipant)를 조인한 뒤
 *   countDistinct(roomParticipant.id)로 집계를 수행합니다.
 * - N+1 문제를 피하기 위해 컬렉션 로딩 대신 단일 집계 쿼리를 사용합니다.
 * - 가변 검색 조건(키워드, 호스트 ID)은 BooleanExpression 헬퍼로 분리하여 null 무시 전략을 적용합니다.
 * - DTO 프로젝션(StudyRoomWithParticipantCount)으로 필요한 필드만 선택해 반환합니다.
 */
@Repository
@RequiredArgsConstructor
public class StudyRoomRepositoryImpl implements StudyRoomRepositoryCustom {



    /**
     * QueryDSL 실행을 위한 팩토리(스레드 세이프, 스프링 빈 주입).
     */
    private final JPAQueryFactory queryFactory;

    @Override
    /**
     * 키워드와 호스트 ID로 스터디룸을 검색하고, 각 스터디룸의 참여자 수를 포함하여 페이지 형태로 반환합니다.
     *
     * - 프로젝션: StudyRoom의 식별자/제목/설명과 참여자 수를 DTO로 매핑
     * - 조인: LEFT JOIN(참여자 0명인 방도 포함)
     * - 집계: countDistinct(roomParticipant.id)로 중복 제거
     * - 그룹화: 방 단위 groupBy
     * - 정렬: 생성일 내림차순
     */
    public Page<StudyRoomWithParticipantCount> searchRooms(String keyword, Long hostId, Pageable pageable) {

        List<StudyRoomWithParticipantCount> content = queryFactory
                .select(Projections.constructor(
                        StudyRoomWithParticipantCount.class,
                        studyRoom.id,
                        studyRoom.title,
                        studyRoom.description,
                        // 참여자 수 집계(중복 제거)
                        roomParticipant.id.countDistinct()
                ))
                .from(studyRoom)
                // 참여자가 없어도 방을 보여주기 위해 LEFT JOIN 사용
                .leftJoin(roomParticipant).on(roomParticipant.room.eq(studyRoom))
                .where(
                        titleContains(keyword),
                        hostIdEq(hostId)
                )
                // 집계 쿼리이므로 그룹화 필수
                .groupBy(studyRoom.id, studyRoom.title, studyRoom.description)
                // 최신 생성 순으로 정렬
                .orderBy(studyRoom.createdAt.desc())
                .offset(pageable.getOffset())
                .limit(pageable.getPageSize())
                .fetch();

        // 페이징 total 계산(조건 동일)
        Long total = queryFactory
                .select(studyRoom.id.count())
                .from(studyRoom)
                .where(
                        titleContains(keyword),
                        hostIdEq(hostId)
                )
                .fetchOne();

        return new PageImpl<>(content, pageable, total == null ? 0 : total);
    }

    @Override
    /**
     * 스터디룸 ID로 단건 조회하고, 해당 방의 참여자 수까지 함께 반환합니다.
     *
     * - LEFT JOIN으로 참여자 0명인 방도 조회
     * - countDistinct로 참여자 중복 집계 방지
     */
    public Optional<StudyRoomWithParticipantCount> findByIdWithParticipantCount(Long roomId) {

        StudyRoomWithParticipantCount result = queryFactory
                .select(Projections.constructor(
                        StudyRoomWithParticipantCount.class,
                        studyRoom.id,
                        studyRoom.title,
                        studyRoom.description,
                        // 단일 방의 참여자 수 집계
                        roomParticipant.id.countDistinct()
                ))
                .from(studyRoom)
                // 참여자 유무와 관계없이 방 정보를 조회하기 위해 LEFT JOIN
                .leftJoin(roomParticipant).on(roomParticipant.room.eq(studyRoom))
                .where(studyRoom.id.eq(roomId))
                .groupBy(studyRoom.id, studyRoom.title, studyRoom.description)
                .fetchOne();

        return Optional.ofNullable(result);
    }

    /**
     * 키워드가 없으면 null을 반환하여 where 절에서 무시되도록 합니다.
     */
    private BooleanExpression titleContains(String keyword) {
        return hasText(keyword) ? studyRoom.title.containsIgnoreCase(keyword) : null;
    }

    /**
     * 호스트 ID가 없으면 null을 반환하여 조건을 생략합니다.
     */
    private BooleanExpression hostIdEq(Long hostId) {
        return hostId != null ? studyRoom.host.id.eq(hostId) : null;
    }
}


