import { create } from 'zustand';
import { AIService } from '../services/aiService';

// History 전역 상태: 패널 열림/닫힘과 선택 항목, 로딩/에러 상태를 관리합니다.
const useHistoryStore = create((set, get) => ({
  open: false,
  items: [], // 서버 원본(최신순)
  selected: null,
  loading: false,
  error: null,

  // 검색/필터 상태
  query: '', // 검색어
  typeFilter: 'ALL', // ALL | QA | REVIEW | CONCEPT

  openPanel: () => set({ open: true }),
  closePanel: () => set({ open: false, selected: null }),
  setItems: (items) => set({ items: Array.isArray(items) ? items : [] }),
  setSelected: (item) => set({ selected: item || null }),
  setLoading: (v) => set({ loading: !!v }),
  setError: (e) => set({ error: e || null }),

  setQuery: (q) => set({ query: q ?? '' }),
  setTypeFilter: (t) => set({ typeFilter: t || 'ALL' }),

  // 서버에서 최근 히스토리를 불러옵니다.
  loadRecent: async (limit = 10) => {
    set({ loading: true, error: null });
    try {
      const res = await AIService.getHistory({ limit });
      const data = res?.data ?? res; // ApiResponse 래핑 고려
      const list = Array.isArray(data) ? data : data?.data || [];
      set({ items: list, loading: false });
      // 선택 상태 초기화(그룹핑 기준 첫 스레드의 대표 아이템 선택)
      const grouped = get()._groupByContinuity(list);
      set({ selected: grouped && grouped.length ? grouped[0] : null });
    } catch (err) {
      set({
        error: err?.message || '히스토리를 불러오지 못했습니다.',
        loading: false,
      });
    }
  },

  // 로컬 삭제(스텁): id로 항목을 제거하고, 선택된 항목이면 선택 해제
  removeItemById: (id) =>
    set((state) => {
      const nextItems = (state.items || []).filter((it) => it.id !== id);
      const nextSelected =
        state.selected && state.selected.id === id ? null : state.selected;
      return { items: nextItems, selected: nextSelected };
    }),

  // 내부: 대화 문맥 섹션을 제거합니다. ([대화 문맥], [컨텍스트])
  _stripContextSections: (text) => {
    if (!text) return '';
    let t = String(text);
    t = t.replace(/\[대화 문맥\][\s\S]*?(?=\n\[[^\n]+\]|$)/g, '');
    t = t.replace(/\[컨텍스트\][\s\S]*?(?=\n\[[^\n]+\]|$)/g, '');
    return t.trim();
  },

  // 내부: 사용자 질문만 추출합니다. ([질문] 섹션이 있으면 그 내용만 반환)
  _extractUserQuestion: (text) => {
    if (!text) return '';
    const stripped = get()._stripContextSections(text);
    const m = stripped.match(/\[질문\]\s*([\s\S]*?)(?=\n\[[^\n]+\]|$)/);
    if (m && m[1]) return m[1].trim();
    return stripped;
  },

  // 내부: 연속 대화를 하나의 스레드로 그룹핑(기본 5분 간격 이내면 같은 스레드)
  _groupByContinuity: (items, gapMs = 5 * 60 * 1000) => {
    if (!Array.isArray(items) || items.length === 0) return [];
    // items 는 최신순이라고 가정. 위에서 아래로 내려가며 묶습니다.
    const groups = [];
    let current = null;
    const parseTs = (v) =>
      typeof v === 'string' || typeof v === 'number'
        ? new Date(v).getTime()
        : 0;

    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      const ts = parseTs(it.createdAt);
      if (!current) {
        current = {
          id: `thread-${it.id}`,
          type: 'THREAD',
          createdAt: it.createdAt,
          children: [it],
        };
        groups.push(current);
        continue;
      }
      const lastChild = current.children[current.children.length - 1];
      const lastTs = parseTs(lastChild.createdAt);
      const withinGap = Math.abs(lastTs - ts) <= gapMs;
      // 스레드 지속 조건: 시간 간격 이내. (유형은 혼합 허용)
      if (withinGap) {
        current.children.push(it);
      } else {
        current = {
          id: `thread-${it.id}`,
          type: 'THREAD',
          createdAt: it.createdAt,
          children: [it],
        };
        groups.push(current);
      }
    }
    // 각 그룹의 미리보기 텍스트 생성(첫 child의 사용자 질문만 표시)
    const extract = get()._extractUserQuestion;
    for (const g of groups) {
      const first = g.children[0] || {};
      const preview = extract(first.prompt || '').slice(0, 40);
      g.prompt = (preview || '[대화]').trim();
      g.response = '';
      g.count = g.children.length;
    }
    return groups;
  },

  // 파생 셀렉터: 검색/필터 적용 리스트(그룹핑 후 적용)
  getFilteredItems: () => {
    const {
      items,
      query,
      typeFilter,
      _groupByContinuity,
      _extractUserQuestion,
    } = get();
    const groups = _groupByContinuity(items);
    const q = (query || '').trim().toLowerCase();
    return groups.filter((g) => {
      // 타입 필터: 그룹 내에 해당 타입이 하나라도 있으면 통과
      const typeOk =
        typeFilter === 'ALL' ||
        (g.children || []).some(
          (c) => (c?.type || '').toUpperCase() === typeFilter
        );
      if (!typeOk) return false;
      if (!q) return true;
      // 검색: 그룹 내 사용자 질문 텍스트 기준으로 필터
      return (g.children || []).some((c) => {
        const p = _extractUserQuestion(c?.prompt || '').toLowerCase();
        const r = (c?.response || '').toLowerCase();
        return p.includes(q) || r.includes(q);
      });
    });
  },
}));

export default useHistoryStore;
