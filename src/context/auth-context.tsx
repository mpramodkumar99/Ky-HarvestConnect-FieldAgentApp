import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { type AuthSession, verifyToken, revokeSession } from '@/services/auth-api';

const SESSION_KEY    = '@ft_agent_session';
const ONBOARDED_PFX  = '@ft_agent_onboarded_';

let _inMemorySession: AuthSession | null = null;

async function readStoredSession(): Promise<AuthSession | null> {
  return _inMemorySession;
}
async function writeSession(s: AuthSession | null): Promise<void> {
  _inMemorySession = s;
}

async function isOnboarded(userId: string): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(`${ONBOARDED_PFX}${userId}`)) === 'true';
  } catch {
    return false;
  }
}

async function setOnboarded(userId: string): Promise<void> {
  try {
    await AsyncStorage.setItem(`${ONBOARDED_PFX}${userId}`, 'true');
  } catch {}
}

interface AuthContextValue {
  initializing:    boolean;
  isAuthenticated: boolean;
  needsOnboarding: boolean;
  session:         AuthSession | null;
  login:               (s: AuthSession) => Promise<void>;
  logout:              () => Promise<void>;
  markOnboardingDone:  () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [initializing,    setInitializing]    = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [session,         setSession]         = useState<AuthSession | null>(null);

  useEffect(() => {
    async function bootstrap() {
      try {
        const stored = await readStoredSession();
        if (stored) {
          const result = await verifyToken(stored.token);
          if (result.valid) {
            setSession(stored);
            setIsAuthenticated(true);
            const onboarded = await isOnboarded(stored.userId);
            setNeedsOnboarding(!onboarded);
          } else {
            await writeSession(null);
          }
        }
      } catch {
        // Network down — treat as unauthenticated
      } finally {
        setInitializing(false);
      }
    }
    bootstrap();
  }, []);

  const login = useCallback(async (s: AuthSession) => {
    await writeSession(s);
    setSession(s);
    setIsAuthenticated(true);
    const onboarded = await isOnboarded(s.userId);
    setNeedsOnboarding(!onboarded);
  }, []);

  const logout = useCallback(async () => {
    if (session) {
      try { await revokeSession(session.sessionId, session.token); } catch {}
    }
    await writeSession(null);
    setSession(null);
    setIsAuthenticated(false);
    setNeedsOnboarding(false);
  }, [session]);

  const markOnboardingDone = useCallback(async () => {
    if (session) await setOnboarded(session.userId);
    setNeedsOnboarding(false);
  }, [session]);

  return (
    <AuthContext.Provider value={{ initializing, isAuthenticated, needsOnboarding, session, login, logout, markOnboardingDone }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
