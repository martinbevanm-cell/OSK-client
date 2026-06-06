import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { rootReducer } from './rootReducer';
import { baseApi } from './api/baseApi';
import { listenerMiddleware } from './listenerMiddleware';
import { devLogger } from './middleware/devLogger';
import { loadSavedItems, savedPersistMiddleware } from '@/features/saved';
import { geoPersistMiddleware } from '@/features/geo';

/**
 * Store factory. Next.js App Router needs a fresh store per request, so the
 * store is created via this factory (see store/StoreProvider.tsx) rather than
 * as a module-level singleton.
 */
export const makeStore = () => {
  const store = configureStore({
    reducer: rootReducer,
    preloadedState: {
      /* Hydrate persisted saved-listings + chosen country on the client;
       * SSR returns defaults so the server render is deterministic, and
       * the client store rehydrates once StoreProvider mounts. */
      saved: { items: loadSavedItems() },
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware()
        .prepend(listenerMiddleware.middleware)
        .concat(
          baseApi.middleware,
          devLogger,
          savedPersistMiddleware,
          geoPersistMiddleware,
        ),
    devTools: process.env.NODE_ENV !== 'production',
  });

  // Enables refetchOnFocus / refetchOnReconnect behaviour.
  setupListeners(store.dispatch);
  return store;
};

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];
