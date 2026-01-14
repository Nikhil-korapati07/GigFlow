import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from './store/hooks';
import { fetchMe } from './store/slices/authSlice';
import Login from './pages/Login';
import Register from './pages/Register';
import ClientDashboard from './pages/ClientDashboard';
import ClientGigBids from './pages/ClientGigBids';
import FreelancerDashboard from './pages/FreelancerDashboard';
import FreelancerGigBid from './pages/FreelancerGigBid';
import FreelancerBids from './pages/FreelancerBids';

function ProtectedRoute({ children, allowedRole }: { children: React.ReactElement; allowedRole: 'client' | 'freelancer' }) {
  const { user, loading } = useAppSelector((state) => state.auth);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== allowedRole) {
    return <Navigate to={user.role === 'client' ? '/client' : '/freelancer'} replace />;
  }

  return children;
}

function App() {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  useEffect(() => {
    dispatch(fetchMe());
  }, [dispatch]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={user ? <Navigate to={user.role === 'client' ? '/client' : '/freelancer'} replace /> : <Login />} />
        <Route path="/register" element={user ? <Navigate to={user.role === 'client' ? '/client' : '/freelancer'} replace /> : <Register />} />
        <Route
          path="/client"
          element={
            <ProtectedRoute allowedRole="client">
              <ClientDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/client/gigs/:gigId"
          element={
            <ProtectedRoute allowedRole="client">
              <ClientGigBids />
            </ProtectedRoute>
          }
        />
        <Route
          path="/freelancer"
          element={
            <ProtectedRoute allowedRole="freelancer">
              <FreelancerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/freelancer/gigs/:gigId"
          element={
            <ProtectedRoute allowedRole="freelancer">
              <FreelancerGigBid />
            </ProtectedRoute>
          }
        />
        <Route
          path="/freelancer/bids"
          element={
            <ProtectedRoute allowedRole="freelancer">
              <FreelancerBids />
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
