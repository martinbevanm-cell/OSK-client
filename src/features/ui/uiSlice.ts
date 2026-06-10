import { createSlice, nanoid, type PayloadAction } from '@reduxjs/toolkit';
import { THEMES, type ThemeName } from '@contracts';

const DEFAULT_THEME: ThemeName =
  (process.env.NEXT_PUBLIC_DEFAULT_THEME as ThemeName | undefined) &&
  THEMES.includes(process.env.NEXT_PUBLIC_DEFAULT_THEME as ThemeName)
    ? (process.env.NEXT_PUBLIC_DEFAULT_THEME as ThemeName)
    : 'theme-luxe-light';

export type ModalId = 'auth' | 'contact' | 'callback' | 'gallery' | 'filters' | null;

export interface Toast {
  id: string;
  kind: 'success' | 'error' | 'info';
  message: string;
}

/** Pure client UI state — never holds server data. */
interface UiState {
  theme: ThemeName;
  activeModal: ModalId;
  mobileNavOpen: boolean;
  toasts: Toast[];
}

const initialState: UiState = {
  theme: DEFAULT_THEME,
  activeModal: null,
  mobileNavOpen: false,
  toasts: [],
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    themeChanged: (state, action: PayloadAction<ThemeName>) => {
      if (THEMES.includes(action.payload)) state.theme = action.payload;
    },
    modalOpened: (state, action: PayloadAction<Exclude<ModalId, null>>) => {
      state.activeModal = action.payload;
    },
    modalClosed: (state) => {
      state.activeModal = null;
    },
    mobileNavToggled: (state, action: PayloadAction<boolean | undefined>) => {
      state.mobileNavOpen = action.payload ?? !state.mobileNavOpen;
    },
    toastPushed: {
      reducer: (state, action: PayloadAction<Toast>) => {
        state.toasts.push(action.payload);
      },
      prepare: (kind: Toast['kind'], message: string) => ({
        payload: { id: nanoid(), kind, message },
      }),
    },
    toastDismissed: (state, action: PayloadAction<string>) => {
      state.toasts = state.toasts.filter((t) => t.id !== action.payload);
    },
  },
  selectors: {
    selectTheme: (s) => s.theme,
    selectActiveModal: (s) => s.activeModal,
    selectMobileNavOpen: (s) => s.mobileNavOpen,
    selectToasts: (s) => s.toasts,
  },
});

export const {
  themeChanged,
  modalOpened,
  modalClosed,
  mobileNavToggled,
  toastPushed,
  toastDismissed,
} = uiSlice.actions;
export const { selectTheme, selectActiveModal, selectMobileNavOpen, selectToasts } =
  uiSlice.selectors;
export const uiReducer = uiSlice.reducer;
