import { useAuth } from '../contexts/AuthContext';
import Navigation from '../components/Navigation';

export default function HomePage() {
  const { state } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Welcome to Photo Review System
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              {state.isAuthenticated 
                ? `Hello, ${state.user?.email}!` 
                : 'Please sign in to access the system'
              }
            </p>
            
            {state.isAuthenticated ? (
              <div className="bg-white shadow rounded-lg p-6 max-w-md mx-auto">
                <div className="text-center">
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100">
                    <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <h3 className="mt-4 text-lg font-medium text-gray-900">
                    Limited Access
                  </h3>
                  <p className="mt-2 text-sm text-gray-500">
                    You are signed in but do not have access to Photo Review features.
                  </p>
                  <p className="mt-2 text-sm text-gray-500">
                    Contact your administrator to request access.
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-white shadow rounded-lg p-6 max-w-md mx-auto">
                <div className="text-center">
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100">
                    <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <h3 className="mt-4 text-lg font-medium text-gray-900">
                    Sign In Required
                  </h3>
                  <p className="mt-2 text-sm text-gray-500">
                    Please sign in to access the Photo Review system.
                  </p>
                  <div className="mt-6">
                    <a
                      href="/login"
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Sign In
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
