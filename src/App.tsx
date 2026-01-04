import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";

// Student Pages
import HomePage from "./pages/student/HomePage";
import SubmitPage from "./pages/student/SubmitPage";
import TrackPage from "./pages/student/TrackPage";
import AuthPage from "./pages/student/AuthPage";
import RiwayatPage from "./pages/student/RiwayatPage";
import ForgotPasswordPage from "./pages/student/ForgotPasswordPage";
import ResetPasswordPage from "./pages/student/ResetPasswordPage";
import InstallPage from "./pages/student/InstallPage";

// Admin Pages
import AdminLoginPage from "./pages/admin/LoginPage";
import RegisterPage from "./pages/admin/RegisterPage";
import AdminForgotPasswordPage from "./pages/admin/ForgotPasswordPage";
import AdminResetPasswordPage from "./pages/admin/ResetPasswordPage";
import DashboardPage from "./pages/admin/DashboardPage";
import PengajuanPage from "./pages/admin/PengajuanPage";
import JenisSuratPage from "./pages/admin/JenisSuratPage";
import MahasiswaPage from "./pages/admin/MahasiswaPage";
import SettingsPage from "./pages/admin/SettingsPage";

import { ProtectedRoute } from "./components/ProtectedRoute";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Memuat...</div>
      </div>
    );
  }
  
  if (user) {
    return <Navigate to="/admin/dashboard" replace />;
  }
  
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Student Routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/ajukan" element={<SubmitPage />} />
            <Route path="/lacak" element={<TrackPage />} />
            <Route path="/riwayat" element={<RiwayatPage />} />
            <Route path="/lupa-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/install" element={<InstallPage />} />

            {/* Admin Auth Routes */}
            <Route path="/admin" element={
              <AdminAuthGuard>
                <AdminLoginPage />
              </AdminAuthGuard>
            } />
            <Route path="/admin/register" element={
              <AdminAuthGuard>
                <RegisterPage />
              </AdminAuthGuard>
            } />
            <Route path="/admin/forgot-password" element={<AdminForgotPasswordPage />} />
            <Route path="/admin/reset-password" element={<AdminResetPasswordPage />} />

            {/* Admin Protected Routes */}
            <Route path="/admin/dashboard" element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            } />
            <Route path="/admin/pengajuan" element={
              <ProtectedRoute>
                <PengajuanPage />
              </ProtectedRoute>
            } />
            <Route path="/admin/jenis-surat" element={
              <ProtectedRoute>
                <JenisSuratPage />
              </ProtectedRoute>
            } />
            <Route path="/admin/mahasiswa" element={
              <ProtectedRoute>
                <MahasiswaPage />
              </ProtectedRoute>
            } />
            <Route path="/admin/settings" element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            } />

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
