/** Public surface of the global UI feature (theme, modals, toasts, nav). */
export {
  uiReducer,
  themeChanged,
  modalOpened,
  modalClosed,
  mobileNavToggled,
  toastPushed,
  toastDismissed,
  selectTheme,
  selectActiveModal,
  selectMobileNavOpen,
  selectToasts,
} from './uiSlice';
export type { ModalId, Toast } from './uiSlice';
