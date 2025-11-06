import { createContext, useReducer, useEffect } from "react";
import type { ReactNode } from "react";
import {
  fetchCurrentUser,
  fetchPoliciesGlobals,
  isAuthenticated,
  login as directusLogin,
  logout as directusLogout,
} from "../lib/directus";
import { connectRealtime, disconnectRealtime, setupReconnection } from "../lib/realtime";

type AuthState = {
  isAuthenticated: boolean;
  isAdmin: boolean;
  user: { id: string; email: string; role?: { id: string; name: string; admin_access?: boolean } } | null;
  loading: boolean;
  error: string | null;
};

type AuthContextType = {
  state: AuthState;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
};

type AuthAction =
  | { type: "LOGIN_START" }
  | {
      type: "LOGIN_SUCCESS";
      payload: {
        user: {
          id: string;
          email: string;
          role?: { id: string; name: string; admin_access?: boolean };
        };
        isAdmin: boolean;
      };
    }
  | { type: "LOGIN_ERROR"; payload: string }
  | { type: "LOGOUT" }
  | { type: "CHECK_AUTH_START" }
  | {
      type: "CHECK_AUTH_SUCCESS";
      payload: {
        user: {
          id: string;
          email: string;
          role?: { id: string; name: string; admin_access?: boolean };
        };
        isAdmin: boolean;
      };
    }
  | { type: "CHECK_AUTH_ERROR" };

const initialState: AuthState = {
  isAuthenticated: false,
  isAdmin: false,
  user: null,
  loading: false,
  error: null,
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case "LOGIN_START":
      return { ...state, loading: true, error: null };
    case "LOGIN_SUCCESS":
      return {
        ...state,
        loading: false,
        isAuthenticated: true,
        isAdmin: action.payload.isAdmin,
        user: action.payload.user,
        error: null,
      };
    case "LOGIN_ERROR":
      return {
        ...state,
        loading: false,
        isAuthenticated: false,
        isAdmin: false,
        user: null,
        error: action.payload,
      };
    case "LOGOUT":
      return {
        ...state,
        isAuthenticated: false,
        isAdmin: false,
        user: null,
        error: null,
      };
    case "CHECK_AUTH_START":
      return { ...state, loading: true };
    case "CHECK_AUTH_SUCCESS":
      return {
        ...state,
        loading: false,
        isAuthenticated: true,
        isAdmin: action.payload.isAdmin,
        user: action.payload.user,
        error: null,
      };
    case "CHECK_AUTH_ERROR":
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

function isRoleObject(
  role: unknown,
): role is { id?: string; admin_access?: boolean } {
  return typeof role === "object" && role !== null;
}

async function fetchAuthData() {
  const [me, policies] = await Promise.all([
    fetchCurrentUser(),
    fetchPoliciesGlobals(),
  ]);

  return {
    user: {
      id: me.id,
      email: me.email,
      role: isRoleObject(me.role) ? me.role : undefined,
    },
    isAdmin: Boolean(policies.admin_access),
  };
}

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  const checkAuth = async () => {
    dispatch({ type: "CHECK_AUTH_START" });
    try {
      if (!isAuthenticated()) {
        dispatch({ type: "CHECK_AUTH_ERROR" });
        return;
      }

      const authData = await fetchAuthData();
      dispatch({
        type: "CHECK_AUTH_SUCCESS",
        payload: authData,
      });
    } catch (error) {
      console.error("Auth check error:", error);
      dispatch({ type: "CHECK_AUTH_ERROR" });
    }
  };

  const login = async (email: string, password: string) => {
    dispatch({ type: "LOGIN_START" });
    try {
      await directusLogin(email, password);
      const authData = await fetchAuthData();
      dispatch({
        type: "LOGIN_SUCCESS",
        payload: authData,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Login failed";
      dispatch({ type: "LOGIN_ERROR", payload: message });
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Disconnect realtime before logout
      await disconnectRealtime().catch(console.error);
      await directusLogout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      dispatch({ type: "LOGOUT" });
    }
  };

  // Check auth on mount and connect realtime if authenticated
  useEffect(() => {
    checkAuth();
  }, []);

  // Connect to realtime when authenticated
  useEffect(() => {
    if (state.isAuthenticated && !state.loading) {
      connectRealtime()
        .then(() => {
          setupReconnection();
        })
        .catch((error) => {
          console.warn("Failed to connect to realtime:", error);
        });
    }

    return () => {
      if (!state.isAuthenticated) {
        disconnectRealtime().catch(console.error);
      }
    };
  }, [state.isAuthenticated, state.loading]);

  return (
    <AuthContext.Provider value={{ state, login, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
}
