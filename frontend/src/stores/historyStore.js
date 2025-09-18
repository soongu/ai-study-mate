import { create } from 'zustand';

// History 전역 상태: 패널 열림/닫힘과 선택 항목, 로딩/에러 상태를 관리합니다.
const useHistoryStore = create((set) => ({
  open: false,
  items: [],
  selected: null,
  loading: false,
  error: null,

  openPanel: () => set({ open: true }),
  closePanel: () => set({ open: false, selected: null }),
  setItems: (items) => set({ items: Array.isArray(items) ? items : [] }),
  setSelected: (item) => set({ selected: item || null }),
  setLoading: (v) => set({ loading: !!v }),
  setError: (e) => set({ error: e || null }),
}));

export default useHistoryStore;
