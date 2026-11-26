import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import QuestList from './pages/QuestList';
import QuestDetail from './pages/QuestDetail';
import MyQuests from './pages/MyQuests';
import PaymentHistory from './pages/PaymentHistory';
import AdminLayout from './pages/admin/AdminLayout';
import Dashboard from './pages/admin/Dashboard';
import AdminQuests from './pages/admin/Quests';
import AdminQuestions from './pages/admin/Questions';
import AdminUsers from './pages/admin/Users';

const ProtectedRoute: React.FC<{ children: React.ReactNode; admin?: boolean }> = ({ children, admin = false }) => {
  const { user, loading } = useAuth();

  if (loading) return <div className="loading">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (admin && user.role !== 'admin') return <Navigate to="/quests" replace />;

  return <>{children}</>;
};

const AppRoutes: React.FC = () => {
  return (
    <>
      <Navbar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/quests" element={<QuestList />} />
          <Route path="/quest/:id" element={<QuestDetail />} />
          <Route
            path="/my-quests"
            element={
              <ProtectedRoute>
                <MyQuests />
              </ProtectedRoute>
            }
          />
          <Route
            path="/payment-history"
            element={
              <ProtectedRoute>
                <PaymentHistory />
              </ProtectedRoute>
            }
          />
          {/* Admin Routes */}
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute admin>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="quests" element={<AdminQuests />} />
            <Route path="quests/:questId/questions" element={<AdminQuestions />} />
            <Route path="users" element={<AdminUsers />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Toaster position="top-right" />
    </>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;