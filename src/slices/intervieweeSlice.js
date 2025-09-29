import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  profile: null, // placeholder for interviewee-specific data
}

const intervieweeSlice = createSlice({
  name: 'interviewee',
  initialState,
  reducers: {
    setIntervieweeProfile(state, action) {
      state.profile = action.payload
    },
    resetInterviewee(state) {
      state.profile = null
    },
  },
})

export const { setIntervieweeProfile, resetInterviewee } = intervieweeSlice.actions
export const intervieweeReducer = intervieweeSlice.reducer