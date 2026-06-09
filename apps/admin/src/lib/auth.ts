import { create } from 'zustand';
import type { User } from './api';

interface AuthState {
  token: string | null;
  user: User | null;
  setAuth: (token: string, user: User) => void;
  logout: () => void;
}

export const useAuth = create<AuthState>()((set) => ({
  token: localStorage.getItem('cloudedge-token'),
  user: JSON.parse(localStorage.getItem('cloudedge-user') || 'null'),
  setAuth: (token, user) => {
    localStorage.setItem('cloudedge-token', token);
    localStorage.setItem('cloudedge-user', JSON.stringify(user));
    set({ token, user });
  },
  logout: () => {
    localStorage.removeItem('cloudedge-token');
    localStorage.removeItem('cloudedge-user');
    set({ token: null, user: null });
  },
}));
