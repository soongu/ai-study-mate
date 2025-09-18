package com.study.mate.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Schema(
    name = "ApiResponse",
    description = "API 응답 공통 래퍼 클래스",
    example = """
    {
        "success": true,
        "data": {
            "id": 1,
            "name": "example"
        },
        "message": "OK"
    }
    """
)
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class ApiResponse<T> {
    @Schema(
        description = "요청 성공 여부",
        example = "true",
        requiredMode = Schema.RequiredMode.REQUIRED
    )
    private boolean success;
    
    @Schema(
        description = "응답 데이터 (성공 시)",
        example = "{\"id\": 1, \"name\": \"example\"}",
        requiredMode = Schema.RequiredMode.NOT_REQUIRED
    )
    private T data;
    
    @Schema(
        description = "응답 메시지 (성공/실패 메시지)",
        example = "OK",
        requiredMode = Schema.RequiredMode.NOT_REQUIRED
    )
    private String message;

    public static <T> ApiResponse<T> ok(T data) {
        return new ApiResponse<>(true, data, null);
    }

    public static <T> ApiResponse<T> ok(T data, String message) {
        return new ApiResponse<>(true, data, message);
    }

    public static <T> ApiResponse<T> error(String message) {
        return new ApiResponse<>(false, null, message);
    }
}


