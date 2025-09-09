package com.study.mate.exception;

import org.springframework.http.HttpStatus;

import lombok.AllArgsConstructor;
import lombok.Getter;

@AllArgsConstructor
@Getter
public enum ErrorCode {
    USER_NOT_FOUND(HttpStatus.NOT_FOUND, "user not found"),
    INVALID_TOKEN(HttpStatus.UNAUTHORIZED, "invalid token"),
    UNAUTHORIZED(HttpStatus.UNAUTHORIZED, "unauthorized"),
    FORBIDDEN(HttpStatus.FORBIDDEN, "forbidden"),
    BAD_REQUEST(HttpStatus.BAD_REQUEST, "bad request"),
    INTERNAL_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "internal error");

    private final HttpStatus status;
    private final String defaultMessage;
}


