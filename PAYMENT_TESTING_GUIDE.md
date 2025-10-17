# 💳 PAYMENT TESTING GUIDE

**Date**: 17/10/2025  
**Component**: PaymentPage.tsx  
**Base URL**: http://localhost:5050/api

---

## ✅ IMPLEMENTATION CHECKLIST

### Payment Initiation

- ✅ Removed mock payment logic
- ✅ Updated endpoint: `/api/payments/bookings/:bookingCode/initiate`
- ✅ Fixed null type error with data destructuring
- ✅ Added proper loading state (`initiating`)

### Payment Redirect

- ✅ Handle payUrl redirect with `window.open(momoUrl, "_blank")`
- ✅ Show "Chuyển hướng thanh toán..." message during redirect
- ✅ Disable buttons during payment processing

### Payment Verification

- ✅ Poll payment status every 2 seconds via `usePaymentPolling`
- ✅ Auto-stop polling when status = paid/failed/refunded
- ✅ Auto-redirect to booking detail on success

### UI/UX Updates

- ✅ Loading spinner on init
- ✅ "Chuyển hướng thanh toán..." message while redirecting
- ✅ Success message & redirect on payment completion
- ✅ Error handling for both initiation & verification
- ✅ Disabled states for buttons during processing

---

## 🧪 TEST CARD NUMBERS

### ✅ Success Test Card

```
Card Number: 0018 (VNPay test)
Expiry: Any future date
OTP: Any value
Expected: Payment succeeds → redirect to booking
```

### ❌ Failure Test Cards

```
Card #1 (Generic Decline):
Number: 0026
Expected: Payment fails → show error message

Card #2 (Timeout):
Number: 0034
Expected: Payment times out → retry option

Card #3 (Invalid):
Number: 0042
Expected: Payment invalid → show error
```

---

## 🔄 POLLING CONFIGURATION

### Payment Status Polling

```typescript
// 2-second interval (every 2000ms)
usePaymentPolling({
  bookingCode: "BK-123ABC",
  enabled: true,
  interval: 2000,
  onSuccess: (status) => {
    if (status === "paid") {
      // Auto-redirect to booking detail
      navigate(`/bookings/${bookingCode}`);
    }
  },
});
```

### Polling Flow

1. User clicks "Mở Momo"
2. State: `initiating: true` → Show "Chuyển hướng thanh toán..."
3. `window.open(momoUrl)` → Opens Momo in new tab
4. User completes payment in Momo
5. Polling checks status every 2 seconds
6. Status changes to "paid" → Redirect automatically

---

## 🧪 TEST SCENARIOS

### Scenario 1: Successful Payment (Card 0018)

```
1. Navigate to /payment/BK-TEST-001
2. See QR code & Momo button
3. Click "Mở Momo" → New tab opens
4. Status: "Chuyển hướng thanh toán..."
5. (In Momo tab) Complete payment with card 0018
6. Polling detects: status = "paid"
7. Show success badge ✅
8. Auto-redirect to /bookings/BK-TEST-001
```

### Scenario 2: Failed Payment (Card 0026)

```
1. Navigate to /payment/BK-TEST-002
2. Click "Mở Momo"
3. (In Momo) Use card 0026 → Payment fails
4. Return to payment page
5. Polling detects: status = "failed"
6. Show error badge ❌
7. Show error message: "Thanh Toán Thất Bại"
8. Allow retry: Click "Mở Momo" again
```

### Scenario 3: Test Payment Button (Development)

```
1. Navigate to /payment/BK-TEST-003
2. Click "🧪 Thử Thanh Toán (Dev)"
3. Status: "Xử Lý..."
4. Calls POST /payments/:paymentID/confirm
5. Polling starts immediately
6. After 2-4 seconds: status = "paid"
7. Auto-redirect to booking detail
```

### Scenario 4: Polling Timeout

```
1. Navigate to /payment/BK-TEST-004
2. Use card 0034 (timeout card)
3. Payment stuck in progress for 5+ minutes
4. Polling continues every 2 seconds
5. User can close tab or refresh page
6. On return: payment status still checking
7. Show: "Đang Chờ Thanh Toán"
```

### Scenario 5: Copy QR Code

```
1. Navigate to /payment/BK-TEST-005
2. See QR code displayed
3. Click "Copy QR Code"
4. Alert: "QR code copied to clipboard"
5. Can paste QR in other apps
6. User can scan from phone instead
```

### Scenario 6: Error Handling

```
1. Navigate to /payment/INVALID-CODE
2. API returns error: "Booking not found"
3. Show error message in red box
4. Button: "🧪 Thử Thanh Toán (Dev)" disabled
5. Allow try again after fix
```

---

## 🔍 VERIFICATION CHECKLIST

### API Endpoints

- [ ] POST `/api/payments/bookings/:bookingCode/initiate` returns QR + momoUrl
- [ ] GET `/api/payments/bookings/:bookingCode/status` returns status
- [ ] Status values: pending → paid / failed / refunded

### UI States

- [ ] Initial: Loading spinner
- [ ] Ready: QR code + buttons visible
- [ ] Processing: "Chuyển hướng thanh toán..." message
- [ ] Polling: Spinning loader + "Đang Chờ Thanh Toán"
- [ ] Success: ✅ badge + auto-redirect
- [ ] Failed: ❌ badge + error message

### User Interactions

- [ ] Momo button opens new tab
- [ ] Copy QR button copies to clipboard
- [ ] Test button works in dev mode
- [ ] Buttons disabled during processing
- [ ] Error messages are clear

### Polling Logic

- [ ] Starts after payment init
- [ ] Checks every 2 seconds
- [ ] Stops on terminal state (paid/failed)
- [ ] Handles network errors
- [ ] Auto-redirect on success

---

## 🐛 DEBUGGING TIPS

### Check Console

```javascript
// Polling status
console.log("Payment status:", paymentPolling.status);
console.log("Polling loading:", paymentPolling.loading);

// Component state
console.log("Payment state:", state);

// Error
console.log("Payment error:", paymentPolling.error);
```

### Network Debugging

```
1. Open DevTools → Network tab
2. Filter: Fetch/XHR
3. Look for:
   - POST /payments/bookings/:bookingCode/initiate
   - GET /payments/bookings/:bookingCode/status (repeating)
4. Check response: { success: true, data: {...} }
```

### Polling Issues

```
If polling doesn't detect status change:
1. Check backend is returning correct status
2. Verify polling interval (2000ms)
3. Check localStorage token is valid
4. Look for CORS errors in console
5. Try test button to simulate payment
```

---

## 📋 PAYMENT FLOW DIAGRAM

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. PaymentPage Load                                             │
│    - initiatePaymentApi() called                                │
│    - GET /api/payments/bookings/:bookingCode/initiate           │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. Display QR Code & Momo Button                                │
│    - QR code visible                                            │
│    - Amount shown: 150,000₫                                     │
│    - Copy & Momo buttons ready                                  │
└──────────────────────┬──────────────────────────────────────────┘
                       │
        ┌──────────────┴──────────────┐
        │                             │
        ▼                             ▼
   User Scans QR              User Clicks Momo
   (Manual Payment)           (Auto-redirect)
        │                             │
        ▼                             ▼
┌─────────────────────┐  ┌──────────────────────────────┐
│ Complete in Momo    │  │ window.open(momoUrl)         │
│ (external)          │  │ → New tab opens              │
│                     │  │ → State: initiating = true   │
│                     │  │ → Show: Chuyển hướng...      │
└────────┬────────────┘  └──────────┬───────────────────┘
         │                          │
         └──────────────┬───────────┘
                        │
                        ▼
        ┌───────────────────────────────────────────┐
        │ 3. Polling Starts (2-sec interval)        │
        │    GET /api/payments/bookings/:id/status  │
        │    Loop until status = "paid"/"failed"    │
        └───────────────────────────────────────────┘
                        │
         ┌──────────────┼──────────────┐
         │              │              │
         ▼              ▼              ▼
      PAID           FAILED        REFUNDED
   (Success)        (Error)        (Cancelled)
         │              │              │
         ▼              ▼              ▼
   ✅ Success     ❌ Failed        ⚠️ Refunded
   Auto-redirect  Show error      Show status
```

---

## 🚀 DEPLOYMENT CHECKLIST

- [ ] Remove console.log debugging statements
- [ ] Test with real payment provider (Momo API)
- [ ] Verify webhook signature validation
- [ ] Set proper timeout values
- [ ] Monitor error rates
- [ ] Add analytics tracking
- [ ] Test across browsers (Chrome, Firefox, Safari)
- [ ] Test on mobile devices
- [ ] Verify HTTPS in production

---

## 📞 QUICK REFERENCE

### Key Files

- Component: `src/pages/PaymentPage.tsx`
- Hook: `src/hooks/usePaymentPolling.ts`
- API: `src/models/payment.api.ts`
- Base URL: `http://localhost:5050/api`

### Key Endpoints

```
POST   /payments/bookings/:bookingCode/initiate
GET    /payments/bookings/:bookingCode/status
POST   /payments/:paymentID/confirm (testing only)
```

### Response Format

```json
{
  "success": true,
  "data": {
    "paymentID": 1,
    "qr_code": "base64-encoded-image",
    "momo_url": "https://momo.vn/pay?amount=150000",
    "amount": 150000,
    "platformFee": 7500,
    "netToShop": 142500,
    "paymentStatus": "pending",
    "expiresIn": 900
  }
}
```

---

**Status**: ✅ READY FOR TESTING

**Last Updated**: 17/10/2025
