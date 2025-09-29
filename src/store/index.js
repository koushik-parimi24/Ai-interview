import { configureStore, combineReducers } from '@reduxjs/toolkit'
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist'
import storage from 'redux-persist/lib/storage' // fallback to localStorage for redux state metadata; actual data via localForage inside slices if needed
import { candidatesReducer } from '../slices/candidatesSlice'
import { interviewReducer } from '../slices/interviewSlice'
import { authReducer } from '../slices/authSlice'
import { interviewerReducer } from '../slices/interviewerSlice'
import { intervieweeReducer } from '../slices/intervieweeSlice'

const rootReducer = combineReducers({
  auth: (state, action) => authReducer(state, action),
  interviewer: interviewerReducer,
  interviewee: intervieweeReducer,
  candidates: candidatesReducer,
  interview: interviewReducer,
})

const persistConfig = {
  key: 'root',
  storage,
}

const persistedReducer = persistReducer(persistConfig, rootReducer)

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
})

export const persistor = persistStore(store)

export const selectCandidates = (state) => state.candidates
export const selectInterview = (state) => state.interview
export const selectAuth = (state) => state.auth
