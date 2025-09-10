package com.study.mate.service;

import com.study.mate.dto.UserResponseDto;
import com.study.mate.repository.RoomParticipantRepository;
import com.study.mate.exception.BusinessException;
import com.study.mate.exception.ErrorCode;
import com.study.mate.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UsersService {

    private final UserRepository userRepository;
    private final RoomParticipantRepository roomParticipantRepository;

    @Transactional(readOnly = true)
    public UserResponseDto findMeByProviderId(String providerId) {
        var user = userRepository.findByProviderId(providerId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        // 참여한 스터디룸 수는 RoomParticipant 기준으로 실시간 카운트
        long joinedCount = roomParticipantRepository.countByUserId(user.getId());

        return UserResponseDto.builder()
                .id(user.getId())
                .email(user.getEmail())
                .nickname(user.getNickname())
                .profileImageUrl(user.getProfileImageUrl())
                .provider(user.getProvider())
                .totalStudyTime(user.getTotalStudyTime())
                .studyRoomCount((int) joinedCount)
                .build();
    }
}


