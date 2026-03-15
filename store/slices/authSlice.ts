// store/slices/authSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface UserSession {
  id: string;
  name: string;
  role: string;
  employeeId: string;
  region: string;
}

interface AuthState {
  currentUser: UserSession | null;
  isAuthenticated: boolean;
}

// Defaulting to Arjun for seamless dev testing, but normally this would be null
const initialState: AuthState = {
  currentUser: {
    id: 'user_arjun',
    name: 'Arjun',
    role: 'Senior Field Technician',
    employeeId: 'SY-TECH-042',
    region: 'Kerala North District',
  },
  isAuthenticated: true,
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    login: (state, action: PayloadAction<UserSession>) => {
      state.currentUser = action.payload;
      state.isAuthenticated = true;
    },
    logout: (state) => {
      state.currentUser = null;
      state.isAuthenticated = false;
    },
  },
});

export const { login, logout } = authSlice.actions;
export default authSlice.reducer;
