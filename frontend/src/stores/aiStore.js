import { create } from 'zustand';
import { AIService } from '../services/aiService';

// 이 파일은 "AI 대화"의 전역 상태를 관리합니다(Zustand 사용).
// 왜 전역 상태인가?
// - 대화 내역(문맥, 컨텍스트)을 여러 컴포넌트(패널, 버튼 등)에서 공통으로 보여주기 위해서입니다.
// - 페이지 이동/리렌더링이 발생해도 대화 흐름을 유지하기 위함입니다.
//
// 왜 메시지들을 배열로 관리하나요?
// - LLM은 "대화 문맥(context)"을 기반으로 응답합니다.
// - 과거의 사용자/AI 메시지가 함께 전달되어야 더 자연스러운 답변이 나옵니다.
// - 그래서 messages 배열은 [user, assistant, user, assistant, ...] 순서를 보존합니다.
//
// 메시지 객체 형태(참고):
// { id: string, role: 'user'|'assistant'|'system', content: string, createdAt: number }

export const useAIStore = create((set) => ({
  messages: [],
  isLoading: false,
  error: null,

  // 액션: 메시지 추가
  append: (msg) =>
    set((state) => ({
      messages: [...state.messages, { ...msg, createdAt: Date.now() }],
    })),

  // 액션: 전체 초기화
  clear: () => set({ messages: [], error: null }),

  // 질문 전송: 프론트-백엔드 연동 준비
  // 흐름:
  // 1) 사용자의 질문을 즉시 messages 에 추가해 UI 피드백을 줍니다.
  // 2) 백엔드로 질문을 전송합니다.
  // 3) 응답을 assistant 메시지로 추가합니다.
  // 4) 실패하면 error 상태를 세팅합니다.
  //
  // 구현 팁:
  // - set의 함수형 업데이트를 사용해 레이스 컨디션을 줄입니다.
  sendQuestion: async (question) => {
    const userMsg = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: question,
    };
    // 1) 유저 메시지 추가 + 로딩 시작 (함수형 업데이트로 race 방지)
    set((state) => ({
      messages: [...state.messages, { ...userMsg, createdAt: Date.now() }],
      isLoading: true,
      error: null,
    }));
    try {
      const res = await AIService.askQuestion({ question }); // API 호출은 서비스 레이어로 분리
      const content = res?.data?.content || res?.content || JSON.stringify(res);
      const aiMsg = { id: `ai-${Date.now()}`, role: 'assistant', content };
      // 2) AI 응답 메시지 추가 (함수형 업데이트로 직전 상태 기반 병합)
      set((state) => ({
        messages: [...state.messages, { ...aiMsg, createdAt: Date.now() }],
      }));
    } catch (err) {
      set({ error: err?.message || 'AI 요청 중 오류가 발생했습니다.' }); // 사용자 친화적 메시지
    } finally {
      set({ isLoading: false });
    }
  },

}));

// 외부 셀렉터 (컴포넌트에서: useAIStore(selectLastMessage))
export const selectLastMessage = (state) =>
  state.messages.length ? state.messages[state.messages.length - 1] : null;

export default useAIStore;
