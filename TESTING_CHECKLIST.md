# ✅ Testing Checklist - Booking Flow

**Date**: 18/10/2025  
**Status**: Ready for Testing  
**Tester**: [Your Name]

---

## 🎯 Test Objectives

1. ✅ Customer info is saved correctly
2. ✅ Slots are held (not locked) during Step 2
3. ✅ Slots are locked only after payment success
4. ✅ Held slots are released after 15 minutes
5. ✅ New pages display correctly
6. ✅ Navigation flow works seamlessly

---

## 📋 Pre-Test Setup

- [ ] Database migrations applied
  - [ ] `ALTER TABLE Bookings ADD CustomerName, CustomerEmail, CustomerPhone`
  - [ ] `ALTER TABLE Field_Slots ADD HoldExpiresAt`
- [ ] Backend running on http://localhost:5050
- [ ] Frontend running on http://localhost:5173
- [ ] Browser: Chrome/Firefox with DevTools open
- [ ] Test user: Log in before starting tests

---

## 🧪 TEST SCENARIO 1: Complete Booking Flow ✅

**Time Estimate**: 5-10 minutes

### Steps:
1. **Navigate to Field**
   - [ ] Go to /fields
   - [ ] Click on a field (or navigate to /booking/48)
   - [ ] Verify page loads

2. **Step 1: Select Time**
   - [ ] Select a time slot (e.g., 18:00)
   - [ ] Verify slot is highlighted
   - [ ] Check UI shows: "Có thể đặt" (Available)
   - [ ] Summary panel updates with time info

3. **Step 2: Enter Customer Info**
   - [ ] Enter Name: "Nguyễn Văn A"
   - [ ] Enter Email: "a@example.com"
   - [ ] Enter Phone: "0912345678"
   - [ ] Verify validation passes
   - [ ] Choose Payment Method: "Chuyển khoản ngân hàng"

4. **Submit Booking**
   - [ ] Click "Xác nhận đặt sân"
   - [ ] Verify loading state shows
   - [ ] Wait for API response
   - [ ] Verify redirect to `/payment/:bookingCode/transfer`

5. **Payment Page**
   - [ ] Verify QR code displays
   - [ ] Verify amount shows: VND 300,000
   - [ ] Verify booking code displays
   - [ ] Verify payment status polling starts

6. **Complete Payment** (Test Button)
   - [ ] Click "Thanh toán Thử Nghiệm" (if available)
   - [ ] OR wait for automatic mock payment
   - [ ] Verify status changes to "paid"
   - [ ] Verify auto-redirect to `/payment/:bookingCode`

7. **Payment Result Page**
   - [ ] Verify success message: "Thanh Toán Thành Công!"
   - [ ] Verify booking code displays
   - [ ] Verify transaction ID
   - [ ] Click "Xem Chi Tiết Booking"

8. **Booking Detail Page** (`/bookings/:bookingCode`)
   - [ ] Verify booking code displays
   - [ ] Verify **Customer Name**: "Nguyễn Văn A" ✅ **CRITICAL**
   - [ ] Verify **Customer Email**: "a@example.com" ✅ **CRITICAL**
   - [ ] Verify **Customer Phone**: "0912345678" ✅ **CRITICAL**
   - [ ] Verify Booking Status: "confirmed"
   - [ ] Verify Payment Status: "paid"
   - [ ] Verify time slots show status "booked"
   - [ ] Verify Field Name and Shop Name display
   - [ ] Click "Xem Mã Check-In"

9. **Checkin Code Page** (`/bookings/:bookingCode/checkin-code`)
   - [ ] Verify checkin code displays (large format)
   - [ ] Verify booking code displays
   - [ ] Click "Sao chép mã" and verify copy works
   - [ ] Verify instructions display
   - [ ] Click "Xem Chi Tiết Booking" to go back

10. **Back to Field Page**
    - [ ] Navigate back to `/booking/48`
    - [ ] Verify previously selected time (18:00) shows: "Đã đặt" ❌ **NOT AVAILABLE**
    - [ ] Verify UI is gray/disabled
    - [ ] Verify other times still show: "Có thể đặt" ✅ **AVAILABLE**

### Expected Results:
- ✅ Customer info saved and displayed
- ✅ Slot locked after payment
- ✅ Navigation flow smooth
- ✅ All pages render correctly

---

## 🧪 TEST SCENARIO 2: Slot Hold Status ✅

**Time Estimate**: 3-5 minutes

### Steps:
1. **Select Time on Field Page**
   - [ ] Navigate to /booking/48
   - [ ] Scroll to empty time slot (e.g., 19:00)
   - [ ] Click to select
   - [ ] Verify shows: "Có thể đặt" (Available) - GREEN button

2. **Fill Form Without Submitting**
   - [ ] Enter customer info
   - [ ] DO NOT click "Xác nhận đặt sân" yet
   - [ ] Verify slot still shows as available

3. **Submit Form**
   - [ ] Click "Xác nhận đặt sân"
   - [ ] Wait for response and redirect

4. **Immediately Go Back**
   - [ ] Click browser back button (or open new tab with /booking/48)
   - [ ] Refresh page to get fresh slot data
   - [ ] Find the time you just booked (19:00)
   - [ ] Verify it now shows: "Đang giữ chỗ" (Being held) - YELLOW/AMBER button
   - [ ] Verify expiry time displays: "Giữ đến HH:mm"

5. **Wait and Check**
   - [ ] Wait 5 seconds
   - [ ] Refresh page
   - [ ] Verify "Đang giữ chỗ" still displays
   - [ ] Verify button is disabled

### Expected Results:
- ✅ Slot shows "Có thể đặt" before booking
- ✅ Slot shows "Đang giữ chỗ" after booking created
- ✅ Expiry time displays correctly
- ✅ Slot is not available for selection

---

## 🧪 TEST SCENARIO 3: Hold Expiry (15 Minutes) ⏰

**Time Estimate**: 20+ minutes (including wait)

### Steps:
1. **Create Booking Without Paying**
   - [ ] Select time on /booking/48 (e.g., 20:00)
   - [ ] Fill customer info
   - [ ] Click "Xác nhận đặt sân"
   - [ ] Navigate to payment page
   - [ ] **DO NOT complete payment**
   - [ ] Note the time: 14:00

2. **Verify Hold Status**
   - [ ] Go back to /booking/48
   - [ ] Find your slot (20:00)
   - [ ] Verify shows: "Đang giữ chỗ" - YELLOW button
   - [ ] Note expiry time (should be ~14:15)

3. **Wait 15 Minutes**
   - [ ] Set a timer for 15 minutes
   - [ ] Keep the browser open
   - [ ] Or check in 15 minutes

4. **Check After 15 Minutes**
   - [ ] Refresh page
   - [ ] Find your slot (20:00)
   - [ ] Verify it now shows: "Có thể đặt" - GREEN button ✅
   - [ ] Verify you can click it again to re-book

### Expected Results:
- ✅ Slot initially held for payment
- ✅ After 15 minutes, hold expires
- ✅ Slot becomes available again
- ✅ User can re-book without conflicts

---

## 🧪 TEST SCENARIO 4: Form Validation ✅

**Time Estimate**: 3-5 minutes

### Steps:
1. **Empty Fields**
   - [ ] Select a time
   - [ ] Leave all fields empty
   - [ ] Click "Xác nhận đặt sân"
   - [ ] Verify error: "Vui lòng nhập họ và tên"
   - [ ] Verify no API call made

2. **Invalid Name**
   - [ ] Enter Name: "A" (only 1 character)
   - [ ] Enter valid Email and Phone
   - [ ] Click "Xác nhận đặt sân"
   - [ ] Verify error: "Ít nhất 2 ký tự"

3. **Invalid Email**
   - [ ] Enter valid Name
   - [ ] Enter Email: "invalid-email"
   - [ ] Enter valid Phone
   - [ ] Click "Xác nhận đặt sân"
   - [ ] Verify error: "Email không hợp lệ"

4. **Invalid Phone**
   - [ ] Enter valid Name and Email
   - [ ] Enter Phone: "123" (only 3 digits)
   - [ ] Click "Xác nhận đặt sân"
   - [ ] Verify error: "Số điện thoại phải có 10-11 chữ số"

5. **No Time Selected**
   - [ ] Clear all slot selections
   - [ ] Fill all customer info correctly
   - [ ] Click "Xác nhận đặt sân"
   - [ ] Verify error: "Vui lòng chọn khung giờ trống trước khi tiếp tục"

### Expected Results:
- ✅ All validations work correctly
- ✅ Error messages display
- ✅ No invalid data sent to API

---

## 🧪 TEST SCENARIO 5: Multiple Simultaneous Bookings ✅

**Time Estimate**: 5-10 minutes

### Steps:
1. **Open Two Browser Windows**
   - [ ] Window A: /booking/48 logged in as User 1
   - [ ] Window B: /booking/48 logged in as User 2

2. **Both Select Same Time**
   - [ ] Both select 21:00
   - [ ] Both fill their respective customer info

3. **User 1 Submits First**
   - [ ] User 1 clicks "Xác nhận đặt sân"
   - [ ] Verify success
   - [ ] Slot 21:00 now shows "Đang giữ chỗ"

4. **User 2 Submits**
   - [ ] User 2 clicks "Xác nhận đặt sân"
   - [ ] Verify error or success (depends on backend logic)
   - [ ] Backend should check: Is slot still "hold" for User 1?

5. **Verify Final State**
   - [ ] Refresh both pages
   - [ ] User 1: Slot should be held/locked
   - [ ] User 2: Should see error or slot unavailable

### Expected Results:
- ✅ Only one user can hold a slot
- ✅ Second user gets error or sees unavailable
- ✅ No double-booking occurs

---

## 🧪 TEST SCENARIO 6: Multiple Time Slots ✅

**Time Estimate**: 5-10 minutes

### Steps:
1. **Select Multiple Consecutive Slots**
   - [ ] Go to /booking/48
   - [ ] Select 3 consecutive time slots (e.g., 15:00-15:30-16:00)
   - [ ] Verify summary shows all 3 slots
   - [ ] Verify total duration shows correctly
   - [ ] Verify total price calculates correctly

2. **Fill and Submit**
   - [ ] Enter customer info
   - [ ] Click "Xác nhận đặt sân"
   - [ ] Complete payment flow

3. **Verify All Slots Locked**
   - [ ] Go back to /booking/48
   - [ ] Verify all 3 slots show "Đã đặt" (Booked)
   - [ ] Verify cannot click any of them

4. **Check Booking Details**
   - [ ] Navigate to booking detail page
   - [ ] Verify all 3 time slots display
   - [ ] Verify durations and times correct

### Expected Results:
- ✅ Multiple slots can be selected
- ✅ All slots are held during booking
- ✅ All slots are locked after payment
- ✅ All slots display in booking details

---

## 🧪 TEST SCENARIO 7: Error Handling ✅

**Time Estimate**: 5-10 minutes

### Steps:
1. **Network Error During Booking**
   - [ ] Open DevTools > Network tab
   - [ ] Select time and fill form
   - [ ] Throttle network to "Offline"
   - [ ] Click "Xác nhận đặt sân"
   - [ ] Verify error message displays
   - [ ] Verify user can retry

2. **Invalid Booking Code**
   - [ ] Navigate to `/bookings/invalid-code`
   - [ ] Verify error page displays
   - [ ] Verify buttons to go back/home work

3. **Missing Booking Code**
   - [ ] Navigate to `/bookings/`
   - [ ] Verify 404 or error handling

4. **Payment Endpoint Down** (if possible)
   - [ ] Simulate payment endpoint error
   - [ ] Verify error message
   - [ ] Verify can go back

### Expected Results:
- ✅ All errors handled gracefully
- ✅ User-friendly error messages
- ✅ Navigation recovery options provided

---

## 📱 TEST SCENARIO 8: Mobile Responsiveness ✅

**Time Estimate**: 5-10 minutes

### Steps:
1. **BookingPage Mobile**
   - [ ] Open DevTools: Toggle device toolbar (iPhone 12)
   - [ ] Verify form fields stack vertically
   - [ ] Verify buttons are touch-friendly
   - [ ] Verify summary panel is readable
   - [ ] Select slots and fill form
   - [ ] Verify submit works on mobile

2. **BookingDetailPage Mobile**
   - [ ] Navigate to `/bookings/:code` on mobile
   - [ ] Verify layout responsive
   - [ ] Verify customer info displays clearly
   - [ ] Verify buttons clickable
   - [ ] Verify badges readable

3. **CheckinCodePage Mobile**
   - [ ] Navigate to `/bookings/:code/checkin-code` on mobile
   - [ ] Verify checkin code large and readable
   - [ ] Verify copy button works
   - [ ] Verify instructions clear
   - [ ] Verify all text visible without scrolling too much

### Expected Results:
- ✅ All pages responsive on mobile
- ✅ Touch targets appropriately sized
- ✅ Text readable
- ✅ Forms usable

---

## 🔍 DATA VERIFICATION

After completing test scenarios, verify:

### Database Check
```sql
-- Verify customer info saved
SELECT BookingCode, CustomerName, CustomerEmail, CustomerPhone 
FROM Bookings 
WHERE BookingCode = 'BK-123ABC';

-- Verify slot hold status
SELECT SlotID, Status, HoldExpiresAt 
FROM Field_Slots 
WHERE SlotID = 123;
```

### API Response Check (using Postman/cURL)
```bash
# Get booking details
GET /api/bookings/BK-123ABC

# Expected response:
{
  "success": true,
  "data": {
    "BookingCode": "BK-123ABC",
    "CustomerName": "Nguyễn Văn A",      ✅ MUST EXIST
    "CustomerEmail": "a@example.com",    ✅ MUST EXIST
    "CustomerPhone": "0912345678",       ✅ MUST EXIST
    "slots": [
      {
        "status": "booked",              ✅ LOCKED (if paid)
        "HoldExpiresAt": null            ✅ CLEARED
      }
    ]
  }
}
```

---

## 📊 Test Results

### Test Scenario Results

| # | Scenario | Status | Notes |
|---|----------|--------|-------|
| 1 | Complete Booking Flow | [ ] Pass / [ ] Fail | |
| 2 | Slot Hold Status | [ ] Pass / [ ] Fail | |
| 3 | Hold Expiry (15min) | [ ] Pass / [ ] Fail | |
| 4 | Form Validation | [ ] Pass / [ ] Fail | |
| 5 | Multiple Simultaneous | [ ] Pass / [ ] Fail | |
| 6 | Multiple Time Slots | [ ] Pass / [ ] Fail | |
| 7 | Error Handling | [ ] Pass / [ ] Fail | |
| 8 | Mobile Responsive | [ ] Pass / [ ] Fail | |

### Overall Status
- [ ] ✅ ALL TESTS PASSED - Ready for Production
- [ ] ⚠️ SOME TESTS FAILED - Needs Fix
- [ ] ❌ CRITICAL FAILURES - Block Release

---

## 🐛 Bug Report Template (if needed)

```
### Bug Title: [Short Description]

**Scenario**: [Which test scenario]
**Steps to Reproduce**:
1. ...
2. ...
3. ...

**Expected**: [What should happen]
**Actual**: [What actually happened]
**Screenshot**: [If applicable]
**Environment**: 
- Browser: [Chrome/Firefox/Safari]
- OS: [Windows/Mac/Linux]
- Device: [Desktop/Tablet/Mobile]

**Severity**: 🔴 Critical / 🟠 High / 🟡 Medium / 🟢 Low
```

---

## ✅ Sign-Off

- [ ] Tester Name: _______________
- [ ] Date Completed: _______________
- [ ] All Tests Passed: Yes / No
- [ ] Notes: _______________

---

**Status**: Ready for Testing ✅
