import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  type User as FirebaseUser,
  onAuthStateChanged,
  signOut,
} from 'firebase/auth';
import { auth } from '../config/firebase';
import api from '../utils/api';

export type UserRole = 'admin' | 'hospital' | 'donor';

export interface UserProfile {
  uid: string;
  email: string;
  role: UserRole;
  name: string;
  phone?: string;
  hospitalId?: string;
  donorId?: string;
}

interface AuthContextType {
  firebaseUser: FirebaseUser | null;
  profile: UserProfile | null;
  role: UserRole | null;
  roleData: any | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<UserProfile | null>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<UserProfile | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [roleData, setRoleData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (): Promise<UserProfile | null> => {
    try {
      const response = await api.get('/auth/me');
      const user = response.data.user as UserProfile;
      setProfile(user);
      setRoleData(response.data.profile);
      setFirebaseUser({ uid: user.uid, email: user.email } as any);
      return user;
    } catch (err: any) {
      console.warn('Could not fetch user profile from server:', err.message);
      setProfile(null);
      setRoleData(null);
      setFirebaseUser(null);
      return null;
    }
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      const localToken = localStorage.getItem('lifepulse_token');
      if (localToken) {
        await fetchProfile();
      } else {
        // Fallback check on Firebase Auth listener if active
        try {
          if (auth) {
            onAuthStateChanged(auth, async (fbUser) => {
              if (fbUser) {
                setFirebaseUser(fbUser);
                await fetchProfile();
              }
            });
          }
        } catch {
          // Local mode
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, pass: string): Promise<UserProfile | null> => {
    setLoading(true);
    try {
      // 1. Authenticate against local Express API
      const res = await api.post('/auth/login', { email, password: pass });
      const { token, user, profile: roleProfile } = res.data;

      // Save local JWT
      if (token) {
        localStorage.setItem('lifepulse_token', token);
      }

      setProfile(user);
      setRoleData(roleProfile);
      setFirebaseUser({ uid: user.uid, email: user.email } as any);
      return user;
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.message || 'Login failed';
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    localStorage.removeItem('lifepulse_token');
    try {
      if (auth) await signOut(auth);
    } catch {
      // Ignore
    }
    setProfile(null);
    setRoleData(null);
    setFirebaseUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        profile,
        role: profile?.role || null,
        roleData,
        loading,
        login,
        logout,
        refreshProfile: fetchProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
