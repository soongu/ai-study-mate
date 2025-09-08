# 🤖 AI 스터디 메이트 (AI Study Mate) - MVP

실시간 협업 학습 플랫폼 - Spring Boot & React 풀스택 프로젝트

## 📚 프로젝트 소개

AI 스터디 메이트는 학생들이 실시간으로 협업하며 AI의 도움을 받아 효과적으로 학습할 수 있는 온라인 스터디 플랫폼입니다.

### 핵심 기능 (MVP)

- 🔐 **OAuth2 소셜 로그인** (구글, 카카오만)
- 💬 **실시간 채팅** (WebSocket + SSE 알림)
- 🤖 **AI 학습 도우미** (코드 리뷰, 질문 답변)
- 📊 **스터디룸 관리** (최대 4명)

## 🛠 기술 스택

### Backend

- Spring Boot 3.2
- Spring Security + OAuth2
- Spring WebSocket (STOMP)
- Spring AI (Gemini API)
- JPA + QueryDSL
- H2 Database (개발용)

### Frontend

- React 19
- React Router v6
- Zustand (상태 관리)
- Tailwind CSS
- Axios (HTTP-Only 쿠키)
- Vite (빌드 도구)

## 🚀 시작하기

### 사전 요구사항

- JDK 17 이상
- Node.js 18 이상
- Git

### 설치 및 실행

#### 1. 프로젝트 클론

```bash
git clone https://github.com/your-repo/ai-study-mate.git
cd ai-study-mate
```

#### 2. 백엔드 실행

```bash
cd backend
./gradlew bootRun
```

#### 3. 프론트엔드 실행

```bash
cd frontend
npm install
npm run dev
```

#### 4. 환경 설정 (선택사항)

```bash
# 백엔드 환경변수 설정
cp backend/env.example backend/.env

# 프론트엔드 환경변수 설정
cp frontend/env.example frontend/.env
```

#### 포트 정보

- **백엔드**: http://localhost:9005
- **프론트엔드**: http://localhost:3000
- **H2 콘솔**: http://localhost:9005/h2-console

## 🔧 개발 가이드

### 첫 실행 체크리스트

- [ ] 백엔드 서버가 9005 포트에서 실행 중
- [ ] 프론트엔드 서버가 3000 포트에서 실행 중
- [ ] 브라우저에서 http://localhost:3000 접속
- [ ] Tailwind CSS 스타일이 정상 적용됨
- [ ] CORS 테스트 버튼으로 API 연결 확인

### 주요 설정 파일

- `backend/src/main/resources/application.yml` - 백엔드 기본 설정
- `frontend/tailwind.config.js` - Tailwind CSS 설정
- `frontend/vite.config.js` - Vite 프록시 설정
- `frontend/src/services/apiClient.js` - API 클라이언트 설정


## 📂 프로젝트 구조

### Backend

```
backend/
├── src/main/java/com/study/mate/
│   ├── config/          # 설정 클래스 (Security, QueryDSL)
│   ├── controller/      # REST 컨트롤러
│   ├── service/         # 비즈니스 로직
│   ├── repository/      # 데이터 접근 계층
│   ├── entity/          # JPA 엔티티 (User, StudyRoom, ChatMessage)
│   ├── dto/             # 데이터 전송 객체
│   ├── exception/       # 예외 처리
│   └── util/            # 유틸리티
└── src/main/resources/
    ├── application.yml  # 애플리케이션 설정
    ├── application-dev.yml  # 개발 환경 설정
    └── application-prod.yml # 운영 환경 설정
```

### Frontend

```
frontend/
├── src/
│   ├── components/      # 재사용 컴포넌트
│   ├── pages/           # 페이지 컴포넌트
│   ├── services/        # API 서비스 (apiClient.js)
│   ├── stores/          # Zustand 스토어
│   ├── styles/          # Tailwind CSS 스타일
│   ├── utils/           # 유틸리티 함수
│   ├── routes.jsx       # 라우트 설정
│   ├── App.jsx          # 메인 앱 컴포넌트
│   └── main.jsx         # 앱 진입점
├── public/              # 정적 파일
├── tailwind.config.js   # Tailwind 설정
├── postcss.config.js    # PostCSS 설정
└── package.json         # 프로젝트 설정
```

## 🎯 학습 목표

이 프로젝트를 통해 다음을 학습할 수 있습니다:

1. **인증/인가**: OAuth2 소셜 로그인, HTTP-Only 쿠키
2. **실시간 통신**: WebSocket + SSE를 활용한 실시간 기능
3. **AI 통합**: Spring AI + Gemini API 활용
4. **상태 관리**: Zustand를 활용한 클라이언트 상태 관리
5. **스타일링**: Tailwind CSS를 활용한 빠른 UI 개발
6. **풀스택 개발**: React와 Spring Boot를 활용한 전체 개발 사이클

## 👥 교육 정보

- **교육 과정**: Spring Boot & React 풀스택 개발자 양성과정
- **교육 기간**: 32시간 (라이브 코딩)
- **교육 방식**: MVP 중심의 실습 위주 학습

## 📝 라이선스

이 프로젝트는 교육 목적으로 제작되었습니다.

## 🤝 기여하기

학생들의 PR과 이슈 제보를 환영합니다!

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 문의

프로젝트에 대한 문의사항은 이슈를 통해 남겨주세요.
