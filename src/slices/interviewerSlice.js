import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  dashboard: null, // placeholder for interviewer-specific data
}

const interviewerSlice = createSlice({
  name: 'interviewer',
  initialState,
  reducers: {
    setDashboard(state, action) {
      state.dashboard = action.payload
    },
    resetInterviewer(state) {
      state.dashboard = null
    },
  },
})

export const { setDashboard, resetInterviewer } = interviewerSlice.actions
export const interviewerReducer = interviewerSlice.reducer