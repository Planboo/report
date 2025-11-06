import { useAuth } from "../hooks/useAuth";
import Gallery from "../features/photos/Gallery";
import { Navigate } from "react-router-dom";
import Navigation from "../components/Navigation";

export default function PhotosPage() {
  const { state } = useAuth();

  if (state.loading)
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="p-6">Loading...</div>
      </div>
    );

  if (!state.isAuthenticated || !state.isAdmin)
    return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Photo Review</h1>
        <Gallery />
      </div>
    </div>
  );
}
