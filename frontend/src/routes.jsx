// 라우트 설정 - 데이터 방식 사용
// 각 라우트는 path, element, children 등의 속성을 가진 객체로 정의
export const routes = [
  {
    path: '/',
    element: 'Home',
    // meta 속성 설명:
    // - title: 해당 라우트의 페이지 제목(브라우저 탭, 헤더 등에서 사용)
    // - requiresAuth: true일 경우 인증(로그인)된 사용자만 접근 가능, false면 누구나 접근 가능
    //   (예: 로그인/회원가입 페이지는 false, 마이페이지/게시글 작성 등은 true로 설정)
    meta: {
      title: '홈',
      requiresAuth: false,
    },
  },
  // TODO: 실제 라우트는 기능 개발 시 추가
];
