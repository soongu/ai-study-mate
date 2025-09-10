package com.study.mate.controller;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestController
public class HealthController {

    @GetMapping("/health")
    public Map<String, Object> health() {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "UP");
        response.put("timestamp", LocalDateTime.now());
        response.put("service", "AI Study Mate");
        response.put("version", "1.0.0");
        return response;
    }

    @GetMapping("/")
    public Map<String, Object> root(HttpServletResponse res) {
        Map<String, Object> response = new HashMap<>();
        response.put("message", "AI Study Mate API Server");
        response.put("status", "running");
        response.put("timestamp", LocalDateTime.now());

        // 클라이언트에게 쿠키를 전송하는 법 - 쿠키는 서버에서 생성해서 응답메시지에 포함해서 보내야함
        Cookie cookie = new Cookie("choco-cookie", "delicious");
//        cookie.setDomain("http://localhost");
        cookie.setPath("/"); // 이 쿠키를 어떤 요청에서 사용할지
        cookie.setMaxAge(30); // 30초의 수명
//        cookie.setHttpOnly(true);

        res.addCookie(cookie); // 클라이언트에게 쿠키 전송

        return response;
    }
}
