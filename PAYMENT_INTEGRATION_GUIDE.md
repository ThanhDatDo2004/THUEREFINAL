# 💳 PAYMENT INTEGRATION GUIDE

**Date**: 17/10/2025  
**Status**: ✅ ENDPOINT UPDATED & INTEGRATED

---

## 🔄 COMPLETE BOOKING → PAYMENT FLOW

### Step 1: Booking Confirmation (BookingPage)
```
URL: /bookings/:fieldCode
OLD Endpoint: POST /api/fields/:fieldCode/bookings/confirm
Status: ✅ STILL WORKS (for backward compatibility)
Returns: booking_code
Action: Auto-redirect to payment after 2 seconds
```

### Step 2: Payment Initiation (PaymentPage)
```
URL: /payment/:bookingCode
NEW Endpoint: POST /api/payments/bookings/:bookingCode/initiate
Required: Authorization Bearer token
Body: { "payment_method": "momo" }
```

### Step 3: Response Format (NEW EXPECTED)
```json
{
  "success": true,
  "data": {
    "paymentID": 1,
    "qr_code": "data:image/png;base64,...",
    "payUrl": "https://momo.vn/pay?amount=150000&requestId=xxx",
    "momo_url": "https://momo.vn/pay?...",
    "amount": 150000,
    "platformFee": 7500,
    "netToShop": 142500,
    "paymentStatus": "pending",
    "expiresIn": 900
  }
}
```

### Step 4: Polling (2-second intervals)
```
Endpoint: GET /api/payments/bookings/:bookingCode/status
Continues until: status = "paid" | "failed" | "refunded"
On Success: Auto-redirect to /bookings/:bookingCode
```

---

## 📋 IMPLEMENTATION CHANGES

### ✅ COMPLETED

1. **BookingPage.tsx**
   - After booking confirmation → redirect to `/payment/{bookingCode}`
   - 2-second delay to show success message
   - Passes `booking_code` from response

2. **PaymentPage.tsx**
   - Accepts both `payUrl` and `momo_url` field names
   - Supports old & new response formats
   - Error handling if no payment data
   - Button redirect: `window.open(momoUrl, "_blank")`

3. **payment.api.ts**
   - Endpoint: `POST /api/payments/bookings/:bookingCode/initiate`
   - Payload: `{ payment_method: "momo" }`
   - Returns: QR code, Momo URL, amount breakdown

---

## 🧪 TEST FLOW

### Flow 1: Complete Payment
```
1. Go to /fields/{fieldCode}
2. Select slots & fill info
3. Click "Xác nhận đặt sân"
4. Auto-redirect to /payment/{bookingCode} after 2 sec
5. See QR code & "Mở Momo" button
6. Click "Mở Momo" → Opens Momo in new tab
7. User completes payment in Momo
8. Poll detects payment → Auto-redirect to /bookings/{bookingCode}
```

### Flow 2: Test Payment (Dev)
```
1. On PaymentPage
2. Click "🧪 Thử Thanh Toán (Dev)"
3. Calls: POST /api/payments/{paymentID}/confirm
4. Poll immediately starts
5. After 2-4 seconds → Status = "paid"
6. Auto-redirect to booking detail
```

---

## 🔍 FIELD MAPPING

| Frontend Field | Backend Field | Purpose |
|---|---|---|
| `paymentID` | `paymentID` | Unique payment identifier |
| `qrCode` | `qr_code` | Displays QR code |
| `momoUrl` | `payUrl` or `momo_url` | Opens Momo payment page |
| `amount` | `amount` | Shows total price |
| `expiresIn` | `expiresIn` | QR code expiry (seconds) |

**Fallback Support**: PaymentPage checks `data.payUrl` first, then `data.momo_url`

---

## ✅ VERIFICATION CHECKLIST

### Backend Responses
- [ ] Payment initiation returns `payUrl` or `momo_url`
- [ ] QR code is base64 PNG format
- [ ] Amount is in VND (150000)
- [ ] Payment status polling works every 2 sec

### Frontend Redirect
- [ ] BookingPage: Auto-redirect after 2 sec
- [ ] PaymentPage: Window opens Momo in new tab
- [ ] PaymentPage: Polling stops on terminal status
- [ ] Auto-redirect to booking detail on success

### Error Handling
- [ ] Invalid booking code shows error
- [ ] Missing payment data shows error message
- [ ] Network errors show retry option
- [ ] Button disabled during processing

---

## 🐛 DEBUGGING

### If Redirect Not Working
```typescript
// Check BookingPage.tsx (line ~480)
if (response?.booking_code) {
  setTimeout(() => {
    navigate(`/payment/${response.booking_code}`);
  }, 2000);
}
```

### If Payment Data Missing
```typescript
// PaymentPage.tsx checks both field names
const momoUrl = data.payUrl || data.momo_url || null;
const qrCode = data.qr_code || null;

if (!qrCode && !momoUrl && !amount) {
  // Show error
}
```

### Check Console
```javascript
console.log('Booking response:', response);
console.log('Payment response:', response.data);
console.log('Momo URL:', state.momoUrl);
```

---

## 🚀 DEPLOYMENT

### Pre-flight Checklist
- [ ] Backend API returns correct field names
- [ ] Base URL configured: `http://localhost:5050/api`
- [ ] Authorization tokens working
- [ ] CORS configured for Momo redirects
- [ ] Polling interval set to 2000ms
- [ ] Error messages are user-friendly

### Production
- [ ] Use real Momo API keys
- [ ] Verify webhook signature
- [ ] Monitor payment success rate
- [ ] Set up error logging/alerting

---

**Status**: ✅ INTEGRATION COMPLETE

Frontend is ready to handle new payment endpoint!
