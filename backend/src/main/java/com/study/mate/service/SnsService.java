package com.study.mate.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Service
@Slf4j
@RequiredArgsConstructor
public class SnsService {

    // 카카오로그인 처리 서비스 로직
    public void kakaoLogin(Map<String, Object> params) {

        // 1. 토큰 발급 요청
        String accessToken = getKakaoToken(params);

        // 2. 발급한 토큰으로 사용자 정보 가져오기
        getKakaoUserInfo(accessToken);

    }

    // 토큰으로 사용자 정보 조회
    private void getKakaoUserInfo(String accessToken) {

        // request uri
        String requestUri = "https://kapi.kakao.com/v2/user/me";

        // 헤더 설정
        HttpHeaders headers = new HttpHeaders();
        headers.add("Authorization", "Bearer " + accessToken);
        headers.add("Content-type", "application/x-www-form-urlencoded;charset=utf-8");

        // 요청 보내기
        RestTemplate template = new RestTemplate();
        ResponseEntity<KaKaoUserDto> response = template.exchange(
                requestUri
                , HttpMethod.POST
                , new HttpEntity<>(headers)
                , KaKaoUserDto.class
        );

        KaKaoUserDto responseBody = response.getBody();
        log.info("user info: {}", responseBody);

        String nickname = responseBody.getProperties().getNickname();
        String profileImage = responseBody.getProperties().getProfileImage();


    }

    // 인가코드로 토큰 발급 요청
    private String getKakaoToken(Map<String, Object> params) {

        // 요청 URI
        String uri = "https://kauth.kakao.com/oauth/token";

        // 요청 헤더 설정
        HttpHeaders headers = new HttpHeaders();
        headers.add("Content-Type", "application/x-www-form-urlencoded;charset=utf-8");


        /**
         - RestTemplate객체가 REST API 통신을 위한 API인데 (자바스크립트 fetch역할)
         - 서버에 통신을 보내면서 응답을 받을 수 있는 메서드가 exchange

         param1: 요청 URL
         param2: 요청 방식 (get, post, put, patch, delete...)
         param3: 요청 헤더와 요청 바디 정보 - HttpEntity로 포장해서 줘야 함
         param4: 응답결과(JSON)를 어떤 타입으로 받아낼 것인지 (ex: DTO로 받을건지 Map으로 받을건지)
         */

        // 요청 파라미터 만들기
        LinkedMultiValueMap<String, Object> valueMap = new LinkedMultiValueMap<>();
        valueMap.add("grant_type", "authorization_code");
        valueMap.add("client_id", params.get("client_id"));
        valueMap.add("redirect_uri", params.get("redirect_uri"));
        valueMap.add("code", params.get("code"));
        valueMap.add("client_secret", params.get("client_secret"));

        HttpEntity<Object> entity = new HttpEntity<>(valueMap, headers);

        // 카카오 서버로 POST 요청 보내기 (Server To Server)
        RestTemplate template = new RestTemplate();

        ResponseEntity<Map> response
                = template.exchange(uri, HttpMethod.POST, entity, Map.class);

        log.info("response data: {}", response);

        // 응답데이터의 JSON 추출
        Map<String, Object> responseBody = response.getBody();
        String accessToken = (String) responseBody.get("access_token");
        log.info("token: {}", accessToken);

        return accessToken;
    }
}
