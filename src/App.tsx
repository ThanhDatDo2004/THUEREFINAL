// src/App.tsx
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";

import Layout from "./components/layouts/Layout";
import PrivateRoute from "./components/common/PrivateRoute";

import HomePage from "./pages/HomePage";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import FieldsPage from "./pages/FieldsPage";
import FieldDetailPage from "./pages/FieldDetailPage";
import BookingPage from "./pages/BookingPage";
import BookingDetailPage from "./pages/BookingDetailPage";
import CheckinCodePage from "./pages/CheckinCodePage";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "./pages/auth/ResetPasswordPage";

// Shop
import ShopLayout from "./pages/shop/ShopLayout";
import ShopOverview from "./pages/shop/ShopOverview";
import ShopFieldsPage from "./pages/shop/ShopFieldsPage";
import ShopFieldPricingPage from "./pages/shop/ShopFieldPricingPage";
import ShopBookingsPage from "./pages/shop/ShopBookingsPage";
import ShopCustomersPage from "./pages/shop/ShopCustomersPage";
import ShopRevenuePage from "./pages/shop/ShopRevenuePage";
import ShopSettingsPage from "./pages/shop/ShopSettingsPage";

// Admin
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsersPage from "./pages/admin/AdminUsersPage";
import AdminShopsPage from "./pages/admin/AdminShopsPage";
import AdminRequestsPage from "./pages/admin/AdminRequestsPage";
import AdminInsightsPage from "./pages/admin/AdminInsightsPage";
import AdminTransactionsPage from "./pages/admin/AdminTransactionsPage";
import AdminActivityPage from "./pages/admin/AdminActivityPage";
import AdminSettingsPage from "./pages/admin/AdminSettingsPage";
import PaymentPage from "./pages/PaymentPage";
import PaymentResult from "./pages/PaymentResult";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Auth Routes (no layout) */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Public Routes (with layout) */}
          <Route
            path="/"
            element={
              <Layout>
                <HomePage />
              </Layout>
            }
          />
          <Route
            path="/fields"
            element={
              <Layout>
                <FieldsPage />
              </Layout>
            }
          />
          <Route
            path="/fields/:id"
            element={
              <Layout>
                <FieldDetailPage />
              </Layout>
            }
          />

          {/* Protected Routes */}
          <Route
            path="/booking/:id"
            element={
              <PrivateRoute>
                <Layout showFooter={false}>
                  <BookingPage />
                </Layout>
              </PrivateRoute>
            }
          />

          {/* Booking Detail Pages */}
          <Route
            path="/bookings/:bookingCode"
            element={
              <PrivateRoute>
                <Layout showFooter={false}>
                  <BookingDetailPage />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/bookings/:bookingCode/checkin-code"
            element={
              <PrivateRoute>
                <Layout showFooter={false}>
                  <CheckinCodePage />
                </Layout>
              </PrivateRoute>
            }
          />

          {/* Payment Transfer Instructions (SePay) */}
          <Route
            path="/payment/:bookingCode/transfer"
            element={
              <Layout showFooter={false}>
                <PaymentPage />
              </Layout>
            }
          />

          {/* Payment Result Page */}
          <Route
            path="/payment/:bookingCode"
            element={
              <Layout showFooter={false}>
                <PaymentResult />
              </Layout>
            }
          />

          {/* Shop Routes (nested) */}
          <Route
            path="/shop/*"
            element={
              <PrivateRoute requiredLevel="shop">
                <Layout showFooter={false}>
                  <ShopLayout />
                </Layout>
              </PrivateRoute>
            }
          >
            <Route index element={<ShopOverview />} />
            <Route path="fields" element={<ShopFieldsPage />} />
            <Route path="pricing" element={<ShopFieldPricingPage />} />
            <Route path="bookings" element={<ShopBookingsPage />} />
            <Route path="customers" element={<ShopCustomersPage />} />
            <Route path="revenue" element={<ShopRevenuePage />} />
            <Route path="settings" element={<ShopSettingsPage />} />
          </Route>

          {/* Admin Routes (nested) */}
          <Route
            path="/admin/*"
            element={
              <PrivateRoute requiredLevel="admin">
                <Layout showFooter={false}>
                  <AdminLayout />
                </Layout>
              </PrivateRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="shops" element={<AdminShopsPage />} />
            <Route path="requests" element={<AdminRequestsPage />} />
            <Route path="insights" element={<AdminInsightsPage />} />
            <Route path="transactions" element={<AdminTransactionsPage />} />
            <Route path="activity" element={<AdminActivityPage />} />
            <Route path="settings" element={<AdminSettingsPage />} />
          </Route>

          {/* Forgot / Reset password */}
          <Route path="/forgot" element={<ForgotPasswordPage />} />
          {/* Reset bằng QUERY ?token=... để khớp link email và ResetPasswordPage */}
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* 404 Route */}
          <Route
            path="*"
            element={
              <Layout>
                <div className="min-h-screen flex items-center justify-center">
                  <div className="text-center">
                    <h1 className="title-xl mb-4">404</h1>
                    <p className="text-gray-600 mb-8">Trang không tìm thấy</p>
                    <a href="/" className="btn-primary">
                      Về trang chủ
                    </a>
                  </div>
                </div>
              </Layout>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
