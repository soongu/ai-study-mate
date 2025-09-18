package com.study.mate.config;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;
import io.swagger.v3.oas.annotations.info.Contact;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.info.License;
import io.swagger.v3.oas.annotations.security.SecurityScheme;
import io.swagger.v3.oas.annotations.servers.Server;
import org.springframework.context.annotation.Configuration;

/**
 * OpenAPI 3.0 (Swagger) 설정 클래스
 * 
 * - API 문서 메타데이터 정의
 * - Bearer 토큰 인증 스키마 설정
 * - Swagger UI에서 "Authorize" 버튼을 통해 토큰 입력 가능
 */
@Configuration
@OpenAPIDefinition(
    info = @Info(
        title = "AI Study Mate API",
        version = "1.0.0",
        description = """
            AI 학습 도우미 API 문서
            
            ## 주요 기능
            - 🤖 **AI 코드 리뷰**: 코드 품질 분석 및 개선 제안
            - 💬 **AI 질문 답변**: 프로그래밍 관련 질문 답변
            - 📚 **학습 히스토리**: AI 대화 기록 관리
            
            ## 인증 방법
            1. OAuth2 로그인을 통해 JWT 토큰 발급
            2. Swagger UI 우상단 "Authorize" 버튼 클릭
            3. "Bearer {your-jwt-token}" 형식으로 입력
            4. "Authorize" 버튼 클릭하여 인증 완료
            
            ## 사용 예시
            - 코드 리뷰: JavaScript, Java, Python 등 다양한 언어 지원
            - 질문 답변: 알고리즘, 프레임워크, 디자인 패턴 등
            """,
        contact = @Contact(
            name = "AI Study Mate Team",
            email = "support@aistudymate.com"
        ),
        license = @License(
            name = "MIT License",
            url = "https://opensource.org/licenses/MIT"
        )
    ),
    servers = {
        @Server(
            url = "http://localhost:9005",
            description = "개발 서버"
        )
    }
)
@SecurityScheme(
    name = "bearerAuth",
    type = SecuritySchemeType.HTTP,
    bearerFormat = "JWT",
    scheme = "bearer",
    description = """
        JWT Bearer 토큰 인증
        
        ## 토큰 획득 방법:
        1. `/api/auth/login` 엔드포인트로 OAuth2 로그인
        2. 응답에서 JWT 토큰 추출
        3. 아래 입력란에 "Bearer {your-token}" 형식으로 입력
        
        ## 개발용 테스트 토큰 (dev 프로필에서만):
        ```
        dev-test-token-12345
        ```
        
        ## 실제 JWT 토큰 예시:
        ```
        eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
        ```
        """
)
public class OpenApiConfig {
}
