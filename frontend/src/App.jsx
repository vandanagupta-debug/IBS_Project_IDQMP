import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ToastProvider } from './contexts/ToastContext';
import ProtectedRoute from './routes/ProtectedRoute';
import PublicRoute from './routes/PublicRoute';
import MainLayout from './components/layout/MainLayout';
import ComingSoon from './components/common/ComingSoon';

import Login from './pages/Login/Login';
import Register from './pages/Register/Register';
import ForgotPassword from './pages/ForgotPassword/ForgotPassword';
import ResetPassword from './pages/ForgotPassword/ResetPassword';
import Upload from './pages/Upload/Upload';
import Profiling from './pages/Profiling/Profiling';
import Validation from './pages/Validation/Validation';
import Anomaly from './pages/Anomaly/Anomaly';
import QualityScore from './pages/Quality/QualityScore';
import Suggestions from './pages/Suggestions/Suggestions';
import Cleaning from './pages/Cleaning/Cleaning';
import Visualization from './pages/Visualization/Visualization';
import Reports from './pages/Reports/Reports';
import Settings from './pages/Settings/Settings';
import Profile from './pages/Profile/Profile';

function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              {/* Public routes */}
              <Route element={<PublicRoute />}>
                <Route path="/" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
              </Route>

              {/* Protected routes */}
              <Route element={<ProtectedRoute />}>
                <Route element={<MainLayout />}>
                  <Route path="/upload" element={<Upload />} />
                  <Route path="/profiling" element={<Profiling />} />
                  <Route path="/validation" element={<Validation />} />
                  <Route path="/anomaly" element={<Anomaly />} />
                  <Route path="/quality-score" element={<QualityScore />} />
                  <Route path="/suggestions" element={<Suggestions />} />
                  <Route path="/cleaning" element={<Cleaning />} />
                  <Route path="/visualization" element={<Visualization />} />
                  <Route path="/reports" element={<Reports />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/profile" element={<Profile />} />
                </Route>
              </Route>

              <Route path="*" element={<ComingSoon title="Page not found" />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
