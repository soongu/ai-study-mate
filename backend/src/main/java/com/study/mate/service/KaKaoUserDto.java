package com.study.mate.service;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.ToString;

import java.time.LocalDateTime;

@Getter
@ToString
@NoArgsConstructor
@AllArgsConstructor
public class KaKaoUserDto {

    private Long id;

    @JsonProperty("connected_at")
    private LocalDateTime connectedAt;

    private Properties properties;

    @Getter @ToString
    public static class Properties {
        private String nickname;
        @JsonProperty("profile_image")
        private String profileImage;
    }
}
