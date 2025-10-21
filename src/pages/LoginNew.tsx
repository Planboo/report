import { useForm } from 'react-hook-form';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import Navigation from '../components/Navigation';

type LoginForm = { email: string; password: string };

export default function LoginPage() {
  const { state, login } = useAuth();
  const { register, handleSubmit, formState: { errors, isValid } } = useForm<LoginForm>();

  // Redirect if already authenticated
  if (state.isAuthenticated) {
    if (state.isAdmin) {
      return <Navigate to="/photos" replace />;
    } else {
      return <Navigate to="/home" replace />;
    }
  }

  const onSubmit = handleSubmit(async (values) => {
    try {
      await login(values.email, values.password);
    } catch {
      // Error is handled by the context
    }
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Sign in to your account
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Access the Photo Review system
            </p>
          </div>
          
          <form className="mt-8 space-y-6" onSubmit={onSubmit}>
            <div className="rounded-md shadow-sm -space-y-px">
              <div>
                <label htmlFor="email" className="sr-only">
                  Email address
                </label>
                <input
                  {...register('email', { required: 'Email is required' })}
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Email address"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>
              <div>
                <label htmlFor="password" className="sr-only">
                  Password
                </label>
                <input
                  {...register('password', { required: 'Password is required' })}
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Password"
                />
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                )}
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={!isValid || state.loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {state.loading ? 'Signing in...' : 'Sign in'}
              </button>
            </div>
            
            {state.error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="text-sm text-red-700">
                  {state.error}
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
