# 🔄 Backend-Frontend Synchronization

**Updated**: 18/10/2025  
**Status**: ✅ Frontend Updated to Match Backend Changes

---

## 📋 Backend Changes Applied

### Fix 1: Save Customer Information ✅

**Backend Changes:**
- Updated `booking.service.ts` to insert `CustomerName`, `CustomerEmail`, `CustomerPhone`
- Database migration added 3 new columns to `Bookings` table:
  ```sql
  ALTER TABLE Bookings ADD COLUMN CustomerName VARCHAR(255) NULL;
  ALTER TABLE Bookings ADD COLUMN CustomerEmail VARCHAR(255) NULL;
  ALTER TABLE Bookings ADD COLUMN CustomerPhone VARCHAR(20) NULL;
  ```

**Frontend Status:** ✅ ALREADY WORKING
- BookingPage.tsx Step 2 form captures customer info
- Form submits payload with:
  ```typescript
  {
    customer: {
      name: "Nguyễn Văn A",
      email: "a@example.com",
      phone: "0912345678"
    }
  }
  ```
- API endpoint: `POST /api/fields/:fieldCode/bookings/confirm`
- **No frontend changes needed** - Already sending correct data

---

### Fix 2: Hold-Lock Pattern for Slot Availability ✅

**Backend Changes:**

1. **Slot Status States:**
   - `available` → User can book this slot
   - `hold` → Slot is held for 15 minutes (NEW - waiting for payment)
   - `booked` → Slot is permanently locked (after payment success)
   - `blocked` → Admin blocked this slot

2. **When Booking Created:**
   - Slot status changes from `available` → `hold`
   - New column `HoldExpiresAt` set to now + 15 minutes
   - Backend: `slot.HoldExpiresAt = NOW() + INTERVAL 15 MINUTE`

3. **When Payment Succeeds:**
   - Booking status changes: `pending` → `confirmed`
   - Slot status changes: `hold` → `booked`
   - Payment status: `pending` → `paid`

4. **Smart Availability Check:**
   - Backend checks `HoldExpiresAt` when returning slot list
   - If `HoldExpiresAt < NOW()` → Treat as `available` (hold expired)
   - If `HoldExpiresAt >= NOW()` → Treat as `hold` (still held)
   - Frontend sees correct availability

5. **Database Migration:**
   ```sql
   ALTER TABLE Field_Slots ADD COLUMN HoldExpiresAt DATETIME NULL;
   ```

**Frontend Changes Required:** ✅ UPDATED

Updated `deriveSlotState()` function to recognize "hold" status:
```typescript
const isHeld = ["held", "on_hold", "holding", "hold"].includes(normalizedStatus);
//                                            ^^^^^ ADDED
```

Status array updated:
```typescript
[
  "booked",
  "blocked",
  "on_hold",
  "held",
  "hold",        // ← ADDED (new from backend)
  "confirmed",
  "reserved",
  "disabled",
]
```

---

### Fix 3: Smart Availability Calculation ✅

**Backend Changes:**
- Updated `field.service.ts` `mapSlotRow()` function
- Checks `HoldExpiresAt` for each slot
- Treats expired holds as available
- Returns correct availability status to frontend

**Frontend Status:** ✅ NO CHANGES NEEDED
- Frontend already handles display logic correctly
- Shows "Đang giữ chỗ" (Being held) for held slots
- Shows hold expiry time: "Giữ đến HH:mm"
- Shows "Có thể đặt" (Available) for available slots

---

## 🔄 Booking Flow - Updated Timeline

```
┌─────────────────────────────────────────────────────────────────┐
│                  BOOKING FLOW - NEW & IMPROVED                  │
└─────────────────────────────────────────────────────────────────┘

Step 1: User selects time on /booking/:id
├─ Frontend: Display available slots
├─ Backend: Slot status = "available" or expired "hold" treated as available
└─ UI shows: ✅ "Có thể đặt" (Can book)

Step 2: User fills customer info (name, email, phone)
├─ Frontend: Form collects customer data
├─ No API call yet
└─ UI shows: Form with customer fields

Step 3: User clicks "Xác nhận đặt sân" (Confirm Booking)
├─ Frontend: POST /api/fields/:fieldCode/bookings/confirm
│   Payload:
│   {
│     slots: [...],
│     payment_method: "banktransfer",
│     total_price: 300000,
│     customer: {
│       name: "Nguyễn Văn A",      ✅ SAVED TO DB
│       email: "a@example.com",    ✅ SAVED TO DB
│       phone: "0912345678"        ✅ SAVED TO DB
│     }
│   }
│
├─ Backend:
│   1. Create booking: status = "pending", payment_status = "pending"
│   2. Set slot status: "available" → "hold"
│   3. Set HoldExpiresAt: NOW() + 15 MINUTES
│   4. Save customer info to Bookings table
│   5. Return response:
│      {
│        booking_code: "BK-123ABC",
│        qr_code: "...",
│        paymentID: 1,
│        amount: 300000
│      }
│
└─ Frontend: Navigate to /payment/:bookingCode/transfer

Step 4: User scans QR or completes bank transfer
├─ Frontend: Payment polling (every 2 seconds)
├─ Endpoint: GET /api/payments/bookings/:bookingCode/status
└─ Checking: payment_status

Step 5: Payment verified ✅ PAYMENT SUCCESS
├─ Backend:
│   1. Update booking: status = "confirmed", payment_status = "paid"
│   2. Lock slots: "hold" → "booked"
│   3. Save transaction_id
│
├─ Frontend: Auto-redirect to /payment/:bookingCode
└─ UI shows: ✅ Thanh toán thành công (Payment successful)

Step 6: User navigates to /payment/:bookingCode
├─ Frontend: Display payment result with booking details
├─ Buttons:
│   - "Xem Chi Tiết Booking" → /bookings/:bookingCode
│   - "Xem Mã Check-In" → /bookings/:bookingCode/checkin-code
└─ API: GET /api/bookings/:bookingCode

Step 7: Backend updates /bookings/:bookingCode
├─ Returns: Booking details with customer info
│   {
│     BookingCode: "BK-123ABC",
│     CustomerName: "Nguyễn Văn A",      ✅ FROM DB
│     CustomerEmail: "a@example.com",    ✅ FROM DB
│     CustomerPhone: "0912345678",       ✅ FROM DB
│     slots: [
│       {
│         status: "booked",               ← LOCKED NOW
│         HoldExpiresAt: null             ← CLEARED
│       }
│     ]
│   }
└─ Frontend: Display in BookingDetailPage

Step 8: User returns to /booking/:id to book another time
├─ Frontend: Fetch available slots again
├─ Backend: Returns slots with updated status
│   - Previous booked slot: status = "booked" ❌ NOT AVAILABLE
│   - New slots still available: status = "available" ✅ AVAILABLE
└─ UI shows: Previous time is locked ✅ CORRECT
```

---

## 📊 Slot Status Mapping

| Status | Backend Meaning | Frontend Display | User Sees | Can Book |
|--------|-----------------|------------------|-----------|----------|
| `available` | Free to book | ✅ Có thể đặt | Green button | ✅ Yes |
| `hold` | Reserved for 15min | ⏳ Đang giữ chỗ | Amber/Yellow button | ❌ No |
| `booked` | Permanently locked | ❌ Đã đặt | Gray button | ❌ No |
| `blocked` | Admin blocked | 🚫 Không khả dụng | Gray button | ❌ No |
| `on_hold` | (Legacy) Being held | ⏳ Đang giữ chỗ | Amber/Yellow button | ❌ No |
| `held` | (Legacy) Being held | ⏳ Đang giữ chỗ | Amber/Yellow button | ❌ No |
| `holding` | (Legacy) Being held | ⏳ Đang giữ chỗ | Amber/Yellow button | ❌ No |

---

## ✅ Frontend Changes Made

### File: `src/pages/BookingPage.tsx`

**Function:** `deriveSlotState()`

**Before:**
```typescript
const isHeld = ["held", "on_hold", "holding"].includes(normalizedStatus);
```

**After:**
```typescript
const isHeld = ["held", "on_hold", "holding", "hold"].includes(normalizedStatus);
//                                           ^^^^^ ADDED
```

**Reason:** Backend now sends "hold" status when slot is held, not just legacy "on_hold" or "held"

---

## 🔐 Payment Success Flow

**When payment verification completes (backend):**

1. **Update Booking:**
   ```sql
   UPDATE Bookings 
   SET BookingStatus = 'confirmed', PaymentStatus = 'paid'
   WHERE BookingCode = 'BK-123ABC'
   ```

2. **Lock Slots:**
   ```sql
   UPDATE Field_Slots 
   SET Status = 'booked', HoldExpiresAt = NULL
   WHERE SlotID IN (...selected slots...)
   ```

3. **Response to Frontend:**
   - Frontend polling gets positive response
   - Auto-redirects to payment result page
   - User sees success message

---

## 🔓 Hold Expiry Flow (Auto-Release)

**After 15 minutes, if payment never completed:**

1. **Backend Check** (via smart availability calculation):
   - When fetching available slots for /booking/:id
   - Checks: `HoldExpiresAt < NOW()`?
   - If yes: Treat slot as `available`
   - If no: Treat slot as `hold`

2. **User Experience:**
   - User goes back to /booking/:id after 15 minutes
   - Previously held slot is now available again
   - User can re-book it or book a different time

---

## 📱 New Pages Using Customer Info

### BookingDetailPage (`/bookings/:bookingCode`)
**Displays:**
- Customer Name ✅ NEW
- Customer Email ✅ NEW
- Customer Phone ✅ NEW
- Booking status (pending/confirmed/completed/cancelled)
- Payment status (pending/paid/failed/refunded)
- All time slots
- Field info, shop info, total price

### CheckinCodePage (`/bookings/:bookingCode/checkin-code`)
**Displays:**
- Booking code
- Checkin code (large format)
- Step-by-step instructions
- Important warnings

---

## 🧪 Testing Scenarios

### Scenario 1: Successful Booking → Payment
```
1. Select time 18:00 on /booking/48
   → Slot shows: "Có thể đặt" (Available)
2. Fill customer info: Name, Email, Phone
3. Click "Xác nhận đặt sân"
   → Backend creates booking, sets slot to "hold"
4. Navigate to payment
5. Complete payment
   → Backend locks slot: "hold" → "booked"
6. Navigate to /bookings/BK-123ABC
   → Shows customer info saved ✅
7. Go back to /booking/48
   → 18:00 now shows "Đã đặt" (Booked) ✅
```

### Scenario 2: Abandoned Booking (15min timeout)
```
1. Select time 18:00
2. Fill customer info
3. Click "Xác nhận đặt sân"
   → Slot status: "hold"
4. DON'T complete payment
5. Wait 15+ minutes
6. Go back to /booking/48
   → 18:00 now shows "Có thể đặt" (Available) ✅
   → Can re-book same time
```

### Scenario 3: View Booking Details
```
1. After successful payment
2. Navigate to /bookings/BK-123ABC
   → Shows:
      - Customer Name: "Nguyễn Văn A" ✅
      - Customer Email: "a@example.com" ✅
      - Customer Phone: "0912345678" ✅
      - Booking Status: "confirmed"
      - Payment Status: "paid"
      - Time slots with status "booked"
```

---

## 🚨 Edge Cases Handled

### ✅ Hold Expires During Payment
- User takes 20 minutes to pay
- Hold expires after 15 minutes
- Backend: Smart check treats expired hold as available
- User can still complete payment (booking already created)
- Slot gets locked on payment success
- **Result**: ✅ Payment still succeeds

### ✅ User Goes Back Before Payment
- User completes Step 2, goes to payment page
- User navigates back to /booking/:id
- Slot still shows as "hold" (before 15min)
- **Result**: ✅ User can't re-book same time (correctly held)

### ✅ User Waits More Than 15 Minutes
- User completes Step 2, then forgets about payment
- Waits 20 minutes
- Goes back to /booking/:id
- Backend checks: HoldExpiresAt < NOW()
- Slot shown as available again
- **Result**: ✅ User can re-book same time (hold expired)

---

## 📋 Database Schema Update

### New Columns Added

**Table: `Bookings`**
```sql
ALTER TABLE Bookings ADD COLUMN CustomerName VARCHAR(255) NULL;
ALTER TABLE Bookings ADD COLUMN CustomerEmail VARCHAR(255) NULL;
ALTER TABLE Bookings ADD COLUMN CustomerPhone VARCHAR(20) NULL;
```

**Table: `Field_Slots`**
```sql
ALTER TABLE Field_Slots ADD COLUMN HoldExpiresAt DATETIME NULL;
```

---

## 🔍 Frontend Validation

### What Frontend Validates (Before Submit):
✅ Customer name: At least 2 characters  
✅ Customer email: Valid email format  
✅ Customer phone: 10-11 digits  
✅ Time slot: At least one selected  
✅ Payment method: Selected  

### What Backend Validates:
✅ Slot still available (not already booked)  
✅ Hold not expired  
✅ Booking request valid  
✅ Customer info not empty  

---

## 🎯 Summary

| Item | Before | After | Status |
|------|--------|-------|--------|
| Customer Info Saved | ❌ No | ✅ Yes | ✅ FIXED |
| Slot Lock Timing | ❌ Immediate | ✅ After Payment | ✅ FIXED |
| Hold Duration | ❌ No hold | ✅ 15 minutes | ✅ NEW |
| Frontend Handle "hold" | ❌ No | ✅ Yes | ✅ UPDATED |
| Expired Hold Detection | ❌ No | ✅ Smart Check | ✅ NEW |
| BookingDetailPage | ❌ No | ✅ Yes | ✅ NEW |
| CheckinCodePage | ❌ No | ✅ Yes | ✅ NEW |

---

## ✨ Benefits

1. **User Experience:**
   - ✅ Customer info is never lost
   - ✅ Slots aren't locked before payment
   - ✅ 15-minute window to complete payment
   - ✅ Can see booking details and checkin code after payment

2. **Data Integrity:**
   - ✅ Customer info properly persisted
   - ✅ Slot availability is accurate
   - ✅ Hold expires prevent ghost bookings

3. **Flexibility:**
   - ✅ Bookings remain if hold expires
   - ✅ Slots released if payment fails
   - ✅ Smart availability calculation

---

**Frontend Status**: ✅ **READY FOR TESTING**

All changes have been made and are compatible with backend updates.
