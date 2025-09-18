import { create } from 'zustand';
import { AIService } from '../services/aiService';
import { estimateTokens } from '../utils/tokenEstimate';

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

// 최대 보관할 대화 히스토리 길이(슬라이딩 윈도우)
// - 메시지가 무한히 늘어나면 메모리/렌더링 비용이 커집니다.
// - 최근 N개만 유지하여 성능과 사용성을 함께 잡습니다.
const DEFAULT_MAX_HISTORY = 20;

// 메시지 배열을 슬라이싱하여 길이를 제한합니다(가장 오래된 것부터 제거).
// - system 역할 메시지는 가급적 남겨두고(user/assistant 위주로 자름)
// - 최신 메시지가 뒤에 있으므로 뒤에서 limit 만큼 취합니다.
const trimMessages = (messages, limit) => {
  if (!Array.isArray(messages)) return [];
  if (!limit || messages.length <= limit) return messages;
  // system 역할 메시지가 있다면 보존하고, 나머지는 뒤에서 limit-1개를 취합니다.
  const systemMsgs = messages.filter((m) => m.role === 'system');
  const others = messages.filter((m) => m.role !== 'system');
  const trimmedOthers = others.slice(
    Math.max(0, others.length - (limit - systemMsgs.length))
  );
  return [...systemMsgs, ...trimmedOthers];
};

// 현재 대화 내용을 기반으로 대략적인 토큰 사용량을 추정합니다.
// - LLM은 토큰 기준으로 과금/제한이 걸리는 경우가 많아
//   사용자에게 대략치를 보여주면 과도하게 긴 입력을 피할 수 있습니다.
const calcEstimatedTokens = (messages) => {
  try {
    const text = (messages || [])
      .map((m) => (m && typeof m.content === 'string' ? m.content : ''))
      .filter(Boolean)
      .join('\n');
    return estimateTokens(text, 'auto');
  } catch {
    return 0;
  }
};

// 최근 메시지들을 간단 포맷으로 이어붙여 컨텍스트 문자열을 생성합니다.
// - 형식: "User: ..." / "AI: ..." 를 줄바꿈으로 연결
// - 너무 길어지지 않도록 최대 글자수를 제한합니다.
const buildContextFromMessages = (messages, maxChars = 2000) => {
  if (!Array.isArray(messages) || messages.length === 0) return '';
  const lines = [];
  for (const m of messages) {
    if (!m || !m.content) continue;
    if (m.role === 'system') continue;
    const prefix = m.role === 'assistant' ? 'AI' : 'User';
    lines.push(`${prefix}: ${String(m.content).replace(/\s+/g, ' ').trim()}`);
  }
  let context = lines.join('\n');
  if (context.length > maxChars) {
    context = context.slice(context.length - maxChars);
  }
  return context;
};

export const useAIStore = create((set, get) => ({
  messages: [],
  isLoading: false,
  error: null,
  maxHistory: DEFAULT_MAX_HISTORY,
  estimatedTokens: 0,

  // 액션: 메시지 추가
  append: (msg) =>
    set((state) => {
      const next = trimMessages(
        [...state.messages, { ...msg, createdAt: Date.now() }],
        state.maxHistory
      );
      return {
        messages: next,
        estimatedTokens: calcEstimatedTokens(next),
      };
    }),

  // 액션: 전체 초기화
  clear: () => set({ messages: [], error: null, estimatedTokens: 0 }),
  resetConversation: () =>
    set({ messages: [], error: null, estimatedTokens: 0 }),
  setMaxHistory: (n) =>
    set({ maxHistory: Number.isFinite(n) && n > 4 ? n : DEFAULT_MAX_HISTORY }),

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
    // 1) 유저 메시지 추가(+슬라이딩 윈도우) + 로딩 시작
    set((state) => {
      const next = trimMessages(
        [...state.messages, { ...userMsg, createdAt: Date.now() }],
        state.maxHistory
      );
      return {
        messages: next,
        isLoading: true,
        error: null,
        estimatedTokens: calcEstimatedTokens(next),
      };
    });
    try {
      // 현재까지의 대화 내역을 간단 컨텍스트로 만들어 함께 전송합니다.
      const { messages: currentMsgs, maxHistory } = get();
      const context = buildContextFromMessages(currentMsgs.slice(-maxHistory));
      const res = await AIService.askQuestion({ question, context }); // API 호출은 서비스 레이어로 분리
      const content = res?.data?.content || res?.content || JSON.stringify(res);
      const aiMsg = { id: `ai-${Date.now()}`, role: 'assistant', content };
      // 2) AI 응답 메시지 추가(+슬라이딩 윈도우)
      set((state) => {
        const next = trimMessages(
          [...state.messages, { ...aiMsg, createdAt: Date.now() }],
          state.maxHistory
        );
        return {
          messages: next,
          estimatedTokens: calcEstimatedTokens(next),
        };
      });
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
