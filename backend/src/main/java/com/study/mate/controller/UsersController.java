package com.study.mate.controller;

import com.study.mate.dto.ApiResponse;
import com.study.mate.dto.UserResponseDto;
import com.study.mate.service.UsersService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UsersController {

    private final UsersService usersService;

    @GetMapping("/me")
    public ResponseEntity<?> me(@AuthenticationPrincipal String subject) {
        // subject는 OAuth2 nameAttributeKey(google: sub, kakao: id) → providerId로 사용 중
        UserResponseDto dto = usersService.findMeByProviderId(subject);
        return ResponseEntity.ok(ApiResponse.ok(dto));
    }
}


