package com.study.mate.controller;

import com.study.mate.service.SnsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.Map;

@Controller
@Slf4j
@RequiredArgsConstructor
public class SnsController {

    private final SnsService service;

    @Value("${sns.appKey}")
    private String appKey;
    @Value("${sns.redirect}")
    private String redirectUri;
    @Value("${sns.clientSecret}")
    private String clientSecret;

    // 카카오 로그인 인가코드 발급 요청
    @GetMapping("/oauth2/kakao")
    public String kakao() {
        // 카카오 서버로 인가코드 발급 통신을 진행
        String uri = "https://kauth.kakao.com/oauth/authorize";
        uri += "?client_id=" + appKey;
        uri += "&redirect_uri=" + redirectUri;
        uri += "&response_type=code";

        return "redirect:" + uri;
    }

    // 인가코드를 전달받는 엔드포인트
    @GetMapping("/login/oauth2/code/kakao")
    public String kakaoCode(@RequestParam String code) {
        log.info("카카오가 전달한 인가코드 : {}", code);

        // 토큰 발급 요청하기
        service.kakaoLogin(Map.of(
                "client_id", appKey,
                "redirect_uri", redirectUri,
                "code", code,
                "client_secret", clientSecret
        ));

        return "redirect:/";
    }

}
