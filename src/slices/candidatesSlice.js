import { createSlice, nanoid } from '@reduxjs/toolkit'

const initialState = {
  list: [], // { id, name, email, phone, score, summary, chats: [...], createdAt, updatedAt }
}

const candidatesSlice = createSlice({
  name: 'candidates',
  initialState,
  reducers: {
    upsertCandidate: {
      reducer(state, action) {
        const idx = state.list.findIndex((c) => c.id === action.payload.id)
        if (idx >= 0) {
          state.list[idx] = { ...state.list[idx], ...action.payload, updatedAt: Date.now() }
        } else {
          state.list.push({ ...action.payload, id: action.payload.id || nanoid(), createdAt: Date.now(), updatedAt: Date.now() })
        }
      },
      prepare(candidate) {
        return { payload: { ...candidate, id: candidate.id || nanoid() } }
      },
    },
    addChatEntry(state, action) {
      const { candidateId, entry } = action.payload // entry: { sender: 'system'|'ai'|'user', text, time, meta }
      const c = state.list.find((x) => x.id === candidateId)
      if (!c) return
      if (!c.chats) c.chats = []
      c.chats.push({ ...entry, time: entry.time || Date.now() })
      c.updatedAt = Date.now()
    },
    finalizeCandidate(state, action) {
      const { candidateId, score, summary, qa } = action.payload
      const c = state.list.find((x) => x.id === candidateId)
      if (!c) return
      c.score = score
      c.summary = summary
      if (qa) c.qa = qa
      c.updatedAt = Date.now()
    },
  },
})

export const { upsertCandidate, addChatEntry, finalizeCandidate } = candidatesSlice.actions
export const candidatesReducer = candidatesSlice.reducer
