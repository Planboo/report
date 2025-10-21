import { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { fetchCurrentUser, isAuthenticated, login as directusLogin, logout as directusLogout } from '../lib/directus';
import { ADMIN_ROLE_ID } from '../lib/env';

type AuthState = {
  isAuthenticated: boolean;
  isAdmin: boolean;
  user: { id: string; email: string } | null;
  loading: boolean;
  error: string | null;
};

type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: { user: { id: string; email: string }; isAdmin: boolean } }
  | { type: 'LOGIN_ERROR'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'CHECK_AUTH_START' }
  | { type: 'CHECK_AUTH_SUCCESS'; payload: { user: { id: string; email: string }; isAdmin: boolean } }
  | { type: 'CHECK_AUTH_ERROR' };

const initialState: AuthState = {
  isAuthenticated: false,
  isAdmin: false,
  user: null,
  loading: false,
  error: null,
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'LOGIN_START':
      return { ...state, loading: true, error: null };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        loading: false,
        isAuthenticated: true,
        isAdmin: action.payload.isAdmin,
        user: action.payload.user,
        error: null,
      };
    case 'LOGIN_ERROR':
      return {
        ...state,
        loading: false,
        isAuthenticated: false,
        isAdmin: false,
        user: null,
        error: action.payload,
      };
    case 'LOGOUT':
      return {
        ...state,
        isAuthenticated: false,
        isAdmin: false,
        user: null,
        error: null,
      };
    case 'CHECK_AUTH_START':
      return { ...state, loading: true };
    case 'CHECK_AUTH_SUCCESS':
      return {
        ...state,
        loading: false,
        isAuthenticated: true,
        isAdmin: action.payload.isAdmin,
        user: action.payload.user,
        error: null,
      };
    case 'CHECK_AUTH_ERROR':
      return {
        ...state,
        loading: false,
        isAuthenticated: false,
        isAdmin: false,
        user: null,
        error: null,
      };
    default:
      return state;
  }
}

type AuthContextType = {
  state: AuthState;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function isRoleObject(role: unknown): role is { id?: string; admin_access?: boolean } {
  return typeof role === 'object' && role !== null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  const checkAuth = async () => {
    dispatch({ type: 'CHECK_AUTH_START' });
    try {
      if (!isAuthenticated()) {
        dispatch({ type: 'CHECK_AUTH_ERROR' });
        return;
      }
      const me = await fetchCurrentUser();
      const role = me?.role;
      const hasAdminFlag = isRoleObject(role) ? Boolean(role.admin_access) : false;
      const matchesAdminRoleId = isRoleObject(role) && ADMIN_ROLE_ID ? role.id === ADMIN_ROLE_ID : false;
      
      // Debug logging
      console.log('Auth check:', {
        roleId: isRoleObject(role) ? role.id : 'no role',
        adminAccess: isRoleObject(role) ? role.admin_access : 'no role',
        adminRoleId: ADMIN_ROLE_ID,
        hasAdminFlag,
        matchesAdminRoleId
      });
      
      const isAdmin = hasAdminFlag || matchesAdminRoleId;
      
      dispatch({
        type: 'CHECK_AUTH_SUCCESS',
        payload: {
          user: { id: me.id, email: me.email },
          isAdmin,
        },
      });
    } catch {
      dispatch({ type: 'CHECK_AUTH_ERROR' });
    }
  };

  const login = async (email: string, password: string) => {
    dispatch({ type: 'LOGIN_START' });
    try {
      await directusLogin(email, password);
      const me = await fetchCurrentUser();
      const role = me?.role;
      const hasAdminFlag = isRoleObject(role) ? Boolean(role.admin_access) : false;
      const matchesAdminRoleId = isRoleObject(role) && ADMIN_ROLE_ID ? role.id === ADMIN_ROLE_ID : false;
      
      // Debug logging
      console.log('Login auth check:', {
        roleId: isRoleObject(role) ? role.id : 'no role',
        adminAccess: isRoleObject(role) ? role.admin_access : 'no role',
        adminRoleId: ADMIN_ROLE_ID,
        hasAdminFlag,
        matchesAdminRoleId
      });
      
      const isAdmin = hasAdminFlag || matchesAdminRoleId;
      
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: {
          user: { id: me.id, email: me.email },
          isAdmin,
        },
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Login failed';
      dispatch({ type: 'LOGIN_ERROR', payload: message });
      throw error;
    }
  };

  const logout = async () => {
    try {
      await directusLogout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      dispatch({ type: 'LOGOUT' });
    }
  };

  // Check auth on mount
  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ state, login, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
