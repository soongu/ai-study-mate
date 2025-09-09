package com.study.mate.service;

import com.study.mate.dto.UserResponseDto;
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

    @Transactional(readOnly = true)
    public UserResponseDto findMeByProviderId(String providerId) {
        return userRepository.findByProviderId(providerId)
                .map(UserResponseDto::from)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
    }
}


