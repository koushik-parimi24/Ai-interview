import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { supabase } from '../lib/supabaseClient'

// userType: 'interviewer' | 'interviewee'
const initialState = {
  status: 'idle', // 'idle' | 'loading' | 'authenticated' | 'error'
  error: null,
  session: null, // Supabase session
  user: null, // { id, email }
  profile: null, // { id, name, user_type }
}

export const signup = createAsyncThunk(
  'auth/signup',
  async ({ email, password, name, userType }, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase.auth.signUp({ 
        email, 
        password, 
        options: { 
          data: { 
            name, 
            user_type: userType,
            full_name: name
          } 
        } 
      })
      if (error) throw error

      // If email confirmations are disabled, session is available immediately.
      const user = data?.user
      if (user) {
        // Force create profile with upsert - this will work even if trigger fails
        const { error: pErr } = await supabase.from('profiles').upsert({
          id: user.id,
          email: user.email || email, // Use signup email as fallback
          name,
          full_name: name,
          user_type: userType,
        }, {
          onConflict: 'id'
        })
        
        if (pErr) {
          console.error('Profile creation failed:', pErr.message)
        } else {
          console.log('Profile created successfully for user:', user.id)
        }
      }

      // Attempt sign-in right away (works when confirmations disabled)
      if (!data?.session) {
        // Return a flag indicating email verification is required
        return { requiresVerification: true }
      }

      return { requiresVerification: false }
    } catch (e) {
      return rejectWithValue(e.message || 'Signup failed')
    }
  }
)

export const login = createAsyncThunk(
  'auth/login',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      return data // { user, session }
    } catch (e) {
      return rejectWithValue(e.message || 'Login failed')
    }
  }
)

export const fetchProfile = createAsyncThunk(
  'auth/fetchProfile',
  async (_, { rejectWithValue }) => {
    try {
      const { data: { user }, error: uErr } = await supabase.auth.getUser()
      if (uErr) throw uErr
      if (!user) return null
      
      const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      
      // If profile doesn't exist, create it as fallback
      if (error && error.code === 'PGRST116') {
        console.log('Profile not found, creating one for user:', user.id)
        const { data: newProfile, error: createErr } = await supabase.from('profiles').insert({
          id: user.id,
          email: user.email,
          name: user.user_metadata?.name || user.email.split('@')[0],
          full_name: user.user_metadata?.name || user.email.split('@')[0],
          user_type: user.user_metadata?.user_type || user.app_metadata?.user_type || 'interviewee'
        }).select().single()
        
        if (createErr) {
          console.error('Failed to create fallback profile:', createErr)
          throw createErr
        }
        console.log('Fallback profile created successfully')
        return newProfile
      }
      
      if (error) throw error
      return data || null
    } catch (e) {
      return rejectWithValue(e.message || 'Failed to fetch profile')
    }
  }
)

export const logout = createAsyncThunk('auth/logout', async () => {
  await supabase.auth.signOut()
})

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setSession(state, action) {
      state.session = action.payload?.session || null
      const user = action.payload?.user || null
      state.user = user ? { id: user.id, email: user.email } : null
      if (!state.user) state.profile = null
      state.status = state.user ? 'authenticated' : 'idle'
    },
    setProfile(state, action) {
      state.profile = action.payload
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(signup.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(signup.fulfilled, (state, action) => {
        // If verification required, remain idle state
        state.status = action.payload?.requiresVerification ? 'idle' : 'authenticated'
      })
      .addCase(signup.rejected, (state, action) => {
        state.status = 'error'
        state.error = action.payload || 'Signup failed'
      })
      .addCase(login.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(login.fulfilled, (state, action) => {
        state.status = 'authenticated'
        state.session = action.payload.session
        const u = action.payload.user
        state.user = u ? { id: u.id, email: u.email } : null
        // Fallback role from user metadata for instant redirects
        if (u?.user_metadata?.user_type && !state.profile) {
          state.profile = {
            id: u.id,
            name: u.user_metadata?.name || null,
            user_type: u.user_metadata.user_type,
          }
        }
      })
      .addCase(login.rejected, (state, action) => {
        state.status = 'error'
        state.error = action.payload || 'Login failed'
      })
      .addCase(fetchProfile.fulfilled, (state, action) => {
        state.profile = action.payload
      })
      .addCase(logout.fulfilled, (state) => {
        state.status = 'idle'
        state.error = null
        state.session = null
        state.user = null
        state.profile = null
      })
  },
})

export const { setSession, setProfile } = authSlice.actions
export const authReducer = authSlice.reducer