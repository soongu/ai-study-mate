package com.study.mate.service.ai;

import com.study.mate.dto.request.ai.SaveConversationRequest;
import com.study.mate.dto.response.ai.SaveConversationResponse;
import com.study.mate.entity.AIConversation;
import com.study.mate.entity.StudyRoom;
import com.study.mate.entity.User;
import com.study.mate.exception.BusinessException;
import com.study.mate.exception.ErrorCode;
import com.study.mate.repository.AIConversationRepository;
import com.study.mate.repository.StudyRoomRepository;
import com.study.mate.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

/**
 * AIConversationService
 * - "AI와의 대화" 기록을 저장/조회하는 서비스입니다.
 * - 컨트롤러가 직접 JPA를 다루지 않도록, 비즈니스 로직을 이 계층에 둡니다.
 * - 이 프로젝트 컨벤션: 서비스 메서드는 Request DTO를 입력으로 받고, Response DTO를 반환합니다.
 */
@Service
@RequiredArgsConstructor
public class AIConversationService {

    // 저장/조회에 사용할 레포지토리들입니다.
    private final AIConversationRepository conversationRepository;
    private final UserRepository userRepository;
    private final StudyRoomRepository studyRoomRepository;

    /**
     * 대화 한 건을 저장합니다.
     * - 왜 DTO로 받나요? 컨트롤러 → 서비스 사이의 계약(입력 스키마)을 명확히 하고,
     *   필요한 값만 안전하게 전달하기 위해서입니다.
     * - 트랜잭션(@Transactional): 저장 도중 예외가 생기면 자동으로 롤백됩니다.
     */
    @Transactional
    public SaveConversationResponse saveConversation(final SaveConversationRequest req) {
        // 1) 사용자 엔티티 조회(필수). 없으면 비즈니스 예외를 던져 전역 핸들러가 처리하도록 합니다.
        User user = userRepository.findByProviderId(req.providerId())
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND, "user not found"));

        // 2) 스터디룸은 선택 값입니다. 존재하지 않으면 그냥 null 로 둡니다(연결 없이 저장).
        StudyRoom room = null;
        if (req.roomId() != null) {
            room = studyRoomRepository.findById(req.roomId()).orElse(null);
        }

        // 3) DTO의 정적 팩토리(of)로 엔티티를 생성합니다.
        AIConversation entity = SaveConversationRequest.of(user, room, req);

        // 4) 저장 후, 정적 팩토리(from)로 응답 DTO를 생성해 반환합니다.
        AIConversation saved = conversationRepository.save(entity);
        return SaveConversationResponse.from(saved);
    }

    /**
     * 사용자의 최근 대화 N개를 최신순으로 조회합니다.
     * - readOnly 트랜잭션: 조회 성능 최적화(쓰기 금지 힌트)입니다.
     * - limit 가 0 이하이면 기본값 10개로 보정합니다.
     */
    @Transactional(readOnly = true)
    public List<AIConversation> findRecentByUser(String providerId, int limit) {
        if (limit <= 0) limit = 10;
        Optional<User> userOpt = userRepository.findByProviderId(providerId);
        if (userOpt.isEmpty()) return List.of();
        return conversationRepository.findByUserOrderByCreatedAtDesc(userOpt.get(), PageRequest.of(0, limit));
    }
}


