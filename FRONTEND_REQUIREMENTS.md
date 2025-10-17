# 🎯 FRONTEND REQUIREMENTS & IMPLEMENTATION GUIDE

**Phiên Bản**: 1.0 | **Ngày Cập Nhật**: 17/10/2025 | **Trạng Thái**: ✅ IN PROGRESS

---

## 📋 MỤC LỤC

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [API Integration](#api-integration)
4. [Pages Implemented](#pages-implemented)
5. [Polling Setup](#polling-setup)
6. [Error Handling](#error-handling)
7. [Routes Configuration](#routes-configuration)
8. [Testing Scenarios](#testing-scenarios)

---

## 🎨 Overview

Đây là hướng dẫn toàn diện để xây dựng frontend cho ứng dụng đặt sân bóng. Backend API đã hoàn thành với 35+ endpoints, frontend cần tích hợp tất cả các tính năng chính theo mức độ ưu tiên.

### Priority Levels

🔴 **CRITICAL (Hoàn Thành)**: 3/3

- ✅ Payment Page (QR code + polling)
- ✅ Wallet Dashboard (balance + history)
- ✅ Booking Management (list, detail, cancel, checkin)

🟠 **HIGH (Hoàn Thành)**: 3/3

- ✅ Reviews Page (CRUD)
- ✅ Notifications Center (polling)
- ✅ Admin Payout Management (approve/reject)

🟡 **MEDIUM (Tuỳ Chọn)**: 2 pages

- [ ] Admin Dashboard
- [ ] Analytics

---

## 🏗️ Architecture

### Project Structure

```
src/
├── models/                    # API calls & interfaces
│   ├── payment.api.ts        # ✅ Payment endpoints
│   ├── wallet.api.ts         # ✅ Wallet endpoints
│   ├── booking.api.ts        # ✅ Booking endpoints (enhanced)
│   ├── review.api.ts         # ✅ Review endpoints
│   ├── notification.api.ts   # ✅ Notification endpoints
│   ├── admin.api.ts          # ✅ Admin endpoints (enhanced)
│   ├── api.ts                # Base axios config
│   └── api.helpers.ts        # Error handling utilities
│
├── hooks/                     # Custom React hooks
│   ├── usePaymentPolling.ts  # ✅ Payment status polling
│   └── useNotificationPolling.ts # ✅ Notification polling
│
├── pages/
│   ├── PaymentPage.tsx       # ✅ CRITICAL - Payment with QR code
│   ├── BookingManagementPage.tsx # ✅ CRITICAL - Bookings CRUD
│   ├── ReviewsPage.tsx       # ✅ HIGH - Reviews CRUD
│   ├── NotificationsCenter.tsx # ✅ HIGH - Notifications
│   └── shop/
│       └── WalletDashboard.tsx # ✅ CRITICAL - Wallet info
│   └── admin/
│       └── AdminPayoutManagement.tsx # ✅ HIGH - Payout management
```

---

## 🔌 API Integration

### Base URL Configuration

```typescript
// src/models/api.ts (already configured)
const RAW_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5050";
export const API_BASE = "http://localhost:5050/api"; // Normalized

// Authorization header automatically added via interceptor
```

### API Models Implemented

#### 1. Payment API

```typescript
// payment.api.ts
initiatePaymentApi(bookingCode, paymentMethod?)
checkPaymentStatusApi(bookingCode)
confirmPaymentApi(paymentID)  // Testing endpoint
```

#### 2. Wallet API

```typescript
// wallet.api.ts
getWalletInfoApi()
getWalletTransactionsApi(type?, limit, offset)
createPayoutRequestApi(data)
getPayoutRequestsApi(status?, limit, offset)
```

#### 3. Booking API (Enhanced)

```typescript
// booking.api.ts
getMyBookingsApi(status?, limit, offset, sort, order)
getBookingDetailApi(bookingCode)
cancelBookingApi(bookingCode, reason?)
getCheckinCodeApi(bookingCode)
verifyCheckinApi(bookingCode, checkinCode)
```

#### 4. Review API

```typescript
// review.api.ts
getFieldReviewsApi(fieldCode, limit, offset);
createReviewApi(fieldCode, data);
updateReviewApi(reviewCode, data);
deleteReviewApi(reviewCode);
```

#### 5. Notification API

```typescript
// notification.api.ts
getNotificationsApi(isRead?, limit, offset)
markNotificationAsReadApi(notificationID)
markAllNotificationsAsReadApi()
deleteNotificationApi(notificationID)
```

#### 6. Admin API (Enhanced)

```typescript
// admin.api.ts
getAdminPayoutRequestsApi(status?, shopCode?, limit, offset)
approvePayoutRequestApi(payoutID, note?)
rejectPayoutRequestApi(payoutID, reason)
```

---

## 📄 Pages Implemented

### 1. 🔴 CRITICAL: Payment Page

**Route**: `/payment/:bookingCode`
**File**: `src/pages/PaymentPage.tsx`

**Features**:

- ✅ Display QR code for Momo payment
- ✅ Show payment amount breakdown
- ✅ Poll payment status every 2 seconds
- ✅ Auto-redirect on successful payment
- ✅ Copy QR code functionality
- ✅ Test payment button (development)
- ✅ Error handling with retry

**Key Components**:

```typescript
const PaymentPage: React.FC = () => {
  // Use usePaymentPolling hook for automatic status checks
  const paymentPolling = usePaymentPolling({
    bookingCode: bookingCode || "",
    enabled: !!bookingCode,
    interval: 2000, // Poll every 2 seconds
    onSuccess: (status) => {
      if (status === "paid") navigate(`/bookings/${bookingCode}`);
    },
  });
};
```

**API Flow**:

1. GET /payments/bookings/:bookingCode/initiate → Get QR code
2. Loop: GET /payments/bookings/:bookingCode/status → Check status
3. On paid: Navigate to booking detail

---

### 2. 🔴 CRITICAL: Wallet Dashboard

**Route**: `/shop/wallet` or `/shop/wallet-dashboard`
**File**: `src/pages/shop/WalletDashboard.tsx`

**Features**:

- ✅ Display current balance
- ✅ Show total credit (income)
- ✅ Show total debit (withdrawn)
- ✅ Display available balance
- ✅ Transaction history with pagination
- ✅ Filter by transaction type
- ✅ Quick action buttons (create payout request, view history)

**Sections**:

- Four stat cards (balance, credit, debit, available)
- Transaction table with sorting
- Load more pagination

**API Calls**:

- GET /shops/me/wallet
- GET /shops/me/wallet/transactions?type=...&limit=&offset=

---

### 3. 🔴 CRITICAL: Booking Management

**Route**: `/bookings` (list) | `/bookings/:bookingCode` (detail)
**File**: `src/pages/BookingManagementPage.tsx`

**Features**:

- ✅ List all bookings with filtering
- ✅ Filter by status (pending, confirmed, completed, cancelled)
- ✅ Display booking cards with key info
- ✅ Booking detail view with full information
- ✅ Cancel booking with reason input
- ✅ Get checkin code (modal display)
- ✅ Copy checkin code functionality
- ✅ Status badges with color coding
- ✅ Payment status display

**Two Views**:

1. **List View**: Grid of booking cards
2. **Detail View**: Full booking information with actions

**Actions Available**:

- Payment (if pending)
- Check-in (if confirmed & paid)
- Cancel (if not completed/cancelled)

**API Calls**:

- GET /bookings?status=...&limit=...&offset=...&sort=...&order=...
- GET /bookings/:bookingCode
- PATCH /bookings/:bookingCode/cancel
- GET /bookings/:bookingCode/checkin-code
- POST /bookings/:bookingCode/verify-checkin

---

### 4. 🟠 HIGH: Reviews Page

**Route**: `/fields/:fieldCode/reviews`
**File**: `src/pages/ReviewsPage.tsx`

**Features**:

- ✅ Display field reviews with ratings
- ✅ Show average rating and stats
- ✅ Create new review (rating + comment)
- ✅ Update existing review
- ✅ Delete review
- ✅ Star rating picker (interactive)
- ✅ Pagination for reviews

**Rating Display**:

- Average rating with star visualization
- Total review count
- Individual review ratings

**Review Actions**:

- Edit: Click edit icon → form pre-filled
- Delete: Click delete icon → confirm → delete

**API Calls**:

- GET /fields/:fieldCode/reviews?limit=...&offset=...
- POST /fields/:fieldCode/reviews
- PUT /reviews/:reviewCode
- DELETE /reviews/:reviewCode

---

### 5. 🟠 HIGH: Notifications Center

**Route**: `/notifications`
**File**: `src/pages/NotificationsCenter.tsx`

**Features**:

- ✅ Poll notifications every 10 seconds
- ✅ Filter: All / Unread only
- ✅ Mark single notification as read
- ✅ Mark all as read (button)
- ✅ Delete individual notifications
- ✅ Color-coded by type (booking, payment, wallet, payout)
- ✅ Unread count display
- ✅ Pagination

**Notification Types**:

- 🔵 Booking: Blue
- 🟢 Payment: Green
- 🟣 Wallet: Purple
- 🟠 Payout: Orange

**Polling**:

```typescript
useNotificationPolling({
  enabled: true,
  interval: 10000, // 10 seconds
  onNewNotification: (notification) => {
    // Optional: show toast notification
  },
});
```

**API Calls**:

- GET /notifications?isRead=...&limit=...&offset=...
- PATCH /notifications/:notificationID/read
- PATCH /notifications/read-all
- DELETE /notifications/:notificationID

---

### 6. 🟠 HIGH: Admin Payout Management

**Route**: `/admin/payout-management`
**File**: `src/pages/admin/AdminPayoutManagement.tsx`

**Features**:

- ✅ List all payout requests
- ✅ Filter by status (all, requested, processing, paid, rejected)
- ✅ View payout details (modal)
- ✅ Approve payout request
- ✅ Reject with reason input
- ✅ Status badges
- ✅ Pagination

**Approve/Reject Modal**:

- Display payout details
- If status="requested", show action buttons
- Rejection reason textarea (required for reject)
- Confirmation dialog before approval

**Statuses**:

- 🟡 Requested: Yellow
- 🔵 Processing: Blue
- 🟢 Paid: Green
- 🔴 Rejected: Red

**API Calls**:

- GET /admin/payout-requests?status=...&shop_code=...&limit=...&offset=...
- PATCH /admin/payout-requests/:payoutID/approve
- PATCH /admin/payout-requests/:payoutID/reject

---

## 🔄 Polling Setup

### 1. Payment Polling Hook

**File**: `src/hooks/usePaymentPolling.ts`

```typescript
export const usePaymentPolling = ({
  bookingCode,
  enabled = true,
  interval = 2000, // 2 seconds (default)
  onSuccess,
  onError,
}) => {
  // Automatically:
  // - Polls payment status
  // - Stops when paid/failed/refunded
  // - Calls onSuccess callback
  // - Handles errors

  return {
    status, // 'pending' | 'paid' | 'failed' | 'refunded'
    loading,
    error,
    isPaid,
    isFailed,
    isPending,
  };
};
```

**Usage in PaymentPage**:

```typescript
const paymentPolling = usePaymentPolling({
  bookingCode,
  enabled: true,
  interval: 2000,
  onSuccess: (status) => {
    if (status === "paid") {
      // Redirect to booking detail
      navigate(`/bookings/${bookingCode}`);
    }
  },
});
```

### 2. Notification Polling Hook

**File**: `src/hooks/useNotificationPolling.ts`

```typescript
export const useNotificationPolling = ({
  enabled = true,
  interval = 10000, // 10 seconds (default)
  onNewNotification,
}) => {
  // Automatically:
  // - Polls notifications
  // - Detects new unread notifications
  // - Calls onNewNotification callback

  return {
    notifications,
    unreadCount,
    loading,
    error,
  };
};
```

**Usage in NotificationsCenter**:

```typescript
useNotificationPolling({
  enabled: true,
  interval: 10000,
  onNewNotification: (notification) => {
    console.log("New notification:", notification);
    // Optional: show browser notification or toast
  },
});
```

---

## ⚠️ Error Handling

### Error Response Format

```typescript
// API returns success field
{
  "success": false,
  "error": {
    "statusCode": 400,
    "message": "Invalid input"
  }
}
```

### Helper Function

```typescript
// From api.helpers.ts
const errorMsg = extractErrorMessage(err, "Default message");

// Checks in order:
// 1. err.response.data.error.message
// 2. err.response.data.message
// 3. err.message
// 4. fallback message
```

### Error Handling Pattern

```typescript
try {
  const response = await apiCall();
  if (response.success && response.data) {
    setState(response.data);
  }
} catch (err: unknown) {
  const errorMsg = extractErrorMessage(err, "Operation failed");
  setState((prev) => ({ ...prev, error: errorMsg }));
  alert(errorMsg); // Or show toast
}
```

---

## 🛣️ Routes Configuration

Add these routes to your router configuration:

```typescript
// CRITICAL pages
{
  path: "/payment/:bookingCode",
  element: <PaymentPage />
},
{
  path: "/bookings",
  element: <BookingManagementPage />
},
{
  path: "/bookings/:bookingCode",
  element: <BookingManagementPage />
},
{
  path: "/shop/wallet",
  element: <WalletDashboard />
},

// HIGH priority pages
{
  path: "/fields/:fieldCode/reviews",
  element: <ReviewsPage />
},
{
  path: "/notifications",
  element: <NotificationsCenter />
},
{
  path: "/admin/payout-management",
  element: <AdminPayoutManagement />,
  requiredRole: "admin"
},
```

---

## 🧪 Testing Scenarios

### 1. Payment Flow

```
1. Navigate to /payment/BK-123ABC
2. See QR code displayed
3. Polling starts (2-sec interval)
4. Click "🧪 Thử Thanh Toán (Dev)" button
5. Status should change to "paid" within 2 seconds
6. Should auto-redirect to /bookings/BK-123ABC
```

### 2. Booking Management Flow

```
1. Navigate to /bookings
2. See list of bookings
3. Click on a booking card
4. View full details
5. Click "Cancel" → Enter reason → Confirm
6. Click "Check-in" → Copy code
7. Back to list → Apply filters
```

### 3. Wallet Dashboard Flow

```
1. Navigate to /shop/wallet
2. See 4 stat cards (balance, credit, debit, available)
3. View transaction history table
4. Scroll down → Click "Xem Thêm"
5. See more transactions loaded
```

### 4. Reviews Flow

```
1. Navigate to /fields/1/reviews
2. See average rating + stats
3. Click "+ Viết Đánh Giá"
4. Select rating (1-5 stars)
5. Add comment (optional)
6. Click "Gửi Đánh Giá"
7. New review appears at top
8. Edit or delete as needed
```

### 5. Notifications Flow

```
1. Navigate to /notifications
2. See list of notifications
3. Click filter buttons (All / Unread)
4. Click check icon → Mark as read
5. Click trash icon → Delete
6. Automatic polling (every 10 seconds)
7. New notifications should appear
```

### 6. Admin Payout Flow

```
1. Navigate to /admin/payout-management
2. See table of payout requests
3. Filter by status
4. Click "Chi Tiết" button
5. View payout details
6. Enter rejection reason
7. Click "Duyệt" or "Từ Chối"
8. Refresh → Status updated
```

---

## 📊 Component Dependencies

```
PaymentPage
├── usePaymentPolling hook
├── initiatePaymentApi
└── confirmPaymentApi (testing)

BookingManagementPage
├── getMyBookingsApi
├── getBookingDetailApi
├── cancelBookingApi
├── getCheckinCodeApi
└── verifyCheckinApi

WalletDashboard
├── getWalletInfoApi
├── getWalletTransactionsApi
└── Pagination logic

ReviewsPage
├── getFieldReviewsApi
├── createReviewApi
├── updateReviewApi
└── deleteReviewApi

NotificationsCenter
├── useNotificationPolling hook
├── getNotificationsApi
├── markNotificationAsReadApi
├── markAllNotificationsAsReadApi
└── deleteNotificationApi

AdminPayoutManagement
├── getAdminPayoutRequestsApi
├── approvePayoutRequestApi
└── rejectPayoutRequestApi
```

---

## 🚀 Implementation Checklist

- ✅ API models created (6 models)
- ✅ Polling hooks created (2 hooks)
- ✅ Payment Page
- ✅ Wallet Dashboard
- ✅ Booking Management
- ✅ Reviews Page
- ✅ Notifications Center
- ✅ Admin Payout Management
- ⏳ Route configuration (need to add to main router)
- ⏳ Tests for all scenarios
- ⏳ UI refinements & responsive design
- ⏳ Toast notifications (optional)
- ⏳ Loading states in forms
- ⏳ Keyboard shortcuts (optional)

---

## 📞 Next Steps

1. **Route Integration**: Add all routes to your main router (App.tsx or main router file)
2. **Navigation Links**: Update navigation menu to include new pages
3. **Testing**: Run through all testing scenarios
4. **UI Refinement**: Polish styling and responsiveness
5. **Toast Notifications**: Add toast library (Sonner, React Hot Toast, etc.) for better UX
6. **Error Recovery**: Implement retry logic for failed API calls
7. **Performance**: Optimize re-renders, add suspense boundaries

---

## 🔗 Backend Integration

All pages use the unified API base URL:

```
http://localhost:5050/api
```

Token is automatically injected via axios interceptor from localStorage:

```typescript
// src/models/api.ts
config.headers.Authorization = `Bearer ${token}`;
```

---

**Status**: ✅ MVP COMPLETE - Ready for integration & testing

**Last Updated**: 17/10/2025
**Version**: 1.0
