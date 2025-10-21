import { useForm } from 'react-hook-form';
import { useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';

type LoginForm = { email: string; password: string };

export default function LoginPage() {
  const { state, login } = useAuth();
  const { register, handleSubmit, watch } = useForm<LoginForm>();

  const email = watch('email');
  const password = watch('password');
  const canSubmit = useMemo(() => Boolean(email && password) && !state.loading, [email, password, state.loading]);

  // Redirect if already authenticated and admin
  if (state.isAuthenticated && state.isAdmin) {
    return <Navigate to="/photos" replace />;
  }

  const onSubmit = handleSubmit(async (values) => {
    try {
      await login(values.email, values.password);
    } catch {
      // Error is handled by the context
    }
  });

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: 380 }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 12, letterSpacing: 1, color: '#6366f1', fontWeight: 600 }}>Photo Review</div>
          <h1 style={{ fontSize: 36, lineHeight: 1.2, margin: '8px 0 0', color: '#111827' }}>Sign in</h1>
        </div>
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 20, boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
          <form onSubmit={onSubmit}>
            <div style={{ display: 'grid', gap: 12 }}>
              <label style={{ display: 'grid', gap: 6 }}>
                <span style={{ fontSize: 12, color: '#6b7280' }}>Email</span>
                <input
                  style={{
                    border: '1px solid #d1d5db', borderRadius: 8, padding: '10px 12px', outline: 'none'
                  }}
                  placeholder="you@company.com"
                  type="email"
                  autoComplete="email"
                  {...register('email', { required: true })}
                />
              </label>
              <label style={{ display: 'grid', gap: 6 }}>
                <span style={{ fontSize: 12, color: '#6b7280' }}>Password</span>
                <input
                  style={{
                    border: '1px solid #d1d5db', borderRadius: 8, padding: '10px 12px', outline: 'none'
                  }}
                  placeholder="••••••••"
                  type="password"
                  autoComplete="current-password"
                  {...register('password', { required: true })}
                />
              </label>
              {state.error && <div style={{ color: '#dc2626', fontSize: 12 }}>{state.error}</div>}
              {state.isAuthenticated && !state.isAdmin && (
                <div style={{ color: '#dc2626', fontSize: 12 }}>
                  You are signed in but do not have access to Photo Review.
                </div>
              )}
              <button
                type="submit"
                disabled={!canSubmit}
                style={{
                  background: canSubmit ? '#111827' : '#9ca3af', color: 'white', border: 0, borderRadius: 8, padding: '10px 12px', cursor: canSubmit ? 'pointer' : 'not-allowed'
                }}
                aria-busy={state.loading}
              >
                {state.loading ? 'Signing in…' : 'Sign in'}
              </button>
            </div>
          </form>
        </div>
        <div style={{ textAlign: 'center', marginTop: 12, color: '#6b7280', fontSize: 12 }}>
          Use your Directus admin credentials
        </div>
      </div>
    </div>
  );
}
