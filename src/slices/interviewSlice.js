import { createSlice } from '@reduxjs/toolkit'

// difficulty order and timers in seconds
export const DIFFICULTY_FLOW = [
  { level: 'easy', seconds: 30 },
  { level: 'easy', seconds: 30 },
  { level: 'medium', seconds: 60 },
  { level: 'medium', seconds: 60 },
  { level: 'hard', seconds: 120 },
  { level: 'hard', seconds: 120 },
]

const initialState = {
  activeSession: null, // { candidateId, profile: {name,email,phone}, stepIndex, questions:[{id,level,text}], currentQuestionId, questionEndsAt, answers:[{questionId,text,timeTaken}], pausedAt }
}

const interviewSlice = createSlice({
  name: 'interview',
  initialState,
  reducers: {
    startSession: {
      reducer(state, action) {
        state.activeSession = action.payload
      },
      prepare({ candidateId, profile, questions }) {
        const first = questions[0]
        const seconds = DIFFICULTY_FLOW[0].seconds
        const now = Date.now()
        const hasAll = !!(profile?.name && profile?.email && profile?.phone)
        return {
          payload: {
            candidateId,
            profile,
            stepIndex: 0,
            questions,
            currentQuestionId: first.id,
            questionEndsAt: hasAll ? now + seconds * 1000 : null,
            answers: [],
            pausedAt: null,
          },
        }
      },
    },
    resumeSession(state) {
      if (!state.activeSession) return
      const { stepIndex } = state.activeSession
      const seconds = DIFFICULTY_FLOW[stepIndex].seconds
      state.activeSession.questionEndsAt = Date.now() + seconds * 1000
      state.activeSession.pausedAt = null
    },
    pauseSession(state) {
      if (!state.activeSession) return
      state.activeSession.pausedAt = Date.now()
    },
    updateProfile(state, action) {
      if (!state.activeSession) return
      state.activeSession.profile = { ...state.activeSession.profile, ...action.payload }
    },
    recordAnswer(state, action) {
      if (!state.activeSession) return
      const { questionId, text, timeTaken } = action.payload
      state.activeSession.answers.push({ questionId, text, timeTaken })
    },
    nextQuestion(state) {
      if (!state.activeSession) return
      const s = state.activeSession
      const nextIndex = s.stepIndex + 1
      if (nextIndex >= s.questions.length) {
        s.questionEndsAt = null
        return
      }
      s.stepIndex = nextIndex
      const q = s.questions[nextIndex]
      s.currentQuestionId = q.id
      s.questionEndsAt = Date.now() + DIFFICULTY_FLOW[nextIndex].seconds * 1000
    },
    endSession(state) {
      state.activeSession = null
    },
    bootstrapExistingSession(state, action) {
      // Allows restoring timers: recompute remaining time based on endsAt
      const session = action.payload
      state.activeSession = session
    },
  },
})

export const { startSession, resumeSession, pauseSession, updateProfile, recordAnswer, nextQuestion, endSession, bootstrapExistingSession } = interviewSlice.actions
export const interviewReducer = interviewSlice.reducer
