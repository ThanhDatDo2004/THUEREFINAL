# ✅ Shop Bookings Page - Test Checklist

## 🧪 Manual Testing Guide

### 1. **API Connection Test** ✅
- [ ] Login as shop owner
- [ ] Navigate to `/shop/bookings`
- [ ] Wait for loading spinner
- [ ] Verify bookings loaded from API
- [ ] Check: 28 bookings displayed (or actual count from DB)

### 2. **Table Display Test** ✅
- [ ] Column headers visible: Mã, Sân, Khách, Ngày, Giờ, Tiền, Thanh toán, Trạng thái
- [ ] Data correctly populated in each column
- [ ] Row hover effect works (gray background)
- [ ] Pagination shows (if >10 items)

### 3. **Data Formatting Test** ✅

#### Ngày (PlayDate)
- [ ] Format: `dd/MM/yyyy` (e.g., 20/10/2025)
- [ ] No ISO datetime shown
- [ ] Correctly parsed from "2025-10-20T..."

#### Giờ (Time)
- [ ] Format: `HH:mm - HH:mm` (e.g., 14:00 - 15:00)
- [ ] No timezone info shown
- [ ] Start time and end time separated by " - "

#### Tiền (Price)
- [ ] Format: `X,XXXđ` (Vietnamese)
- [ ] Thousand separators correct (e.g., 200,000đ)
- [ ] "đ" symbol shown
- [ ] No decimals shown

#### Thanh toán (Payment Status)
- [ ] "paid" → "✅ Đã thanh toán"
- [ ] "pending" → "⏳ Chờ thanh toán"
- [ ] "failed" → "❌ Thất bại"
- [ ] Icons visible and correct

### 4. **Filter Test** ✅
- [ ] Filter dropdown visible with label "Trạng thái thanh toán:"
- [ ] Default option: "Tất cả (28)" or actual count
- [ ] Click "Chờ thanh toán" → only pending bookings shown
  - [ ] Table updates immediately
  - [ ] Count displayed (e.g., "Chờ thanh toán (8)")
  - [ ] Pagination resets to page 1
  - [ ] Empty state if no pending bookings
- [ ] Click "Đã thanh toán" → only paid bookings shown
- [ ] Click "Thất bại" → only failed bookings shown
- [ ] Click "Tất cả" → all bookings shown again

### 5. **Pagination Test** ✅

#### Visibility
- [ ] "Hiển thị X đến Y trong Z đơn" text visible
- [ ] Page numbers visible (1, 2, 3, ...)
- [ ] Previous/Next buttons visible
- [ ] First page number highlighted blue

#### Navigation
- [ ] Click page 2 → Shows items 11-20
- [ ] Click page 3 → Shows items 21-30
- [ ] Click Previous → Goes to previous page
- [ ] Click Next → Goes to next page
- [ ] Previous disabled on page 1
- [ ] Next disabled on last page

#### Interaction
- [ ] Change filter → Pagination resets to page 1
- [ ] Click different page → Table updates instantly
- [ ] Page highlights correctly (blue background)

### 6. **Loading State Test** ✅
- [ ] Loading spinner shows initially
- [ ] Spinner disappears after data loads
- [ ] No infinite loading

### 7. **Empty State Test** ✅
- [ ] Filter to "Thất bại" (if no failures)
- [ ] Message shows: "Không có đơn nào với trạng thái "failed""
- [ ] Filter to "Tất cả" → Data reappears

### 8. **Responsive Design Test** ✅

#### Desktop (>1024px)
- [ ] Full table visible
- [ ] Sidebar visible (280px)
- [ ] All columns visible
- [ ] Pagination buttons show all page numbers

#### Tablet (768px - 1024px)
- [ ] Table might scroll horizontally
- [ ] Sidebar can collapse
- [ ] Pagination shows previous/next + current page

#### Mobile (< 768px)
- [ ] Table scrolls horizontally
- [ ] Pagination buttons stack or scroll
- [ ] Filter dropdown fully visible
- [ ] Text readable

### 9. **Error Handling Test** ✅
- [ ] Logout → Redirect from /shop/bookings
- [ ] Network error → Error message shown (or graceful fallback)
- [ ] Invalid shop → Empty bookings shown

### 10. **Browser Compatibility** ✅
- [ ] Chrome/Edge: ✅
- [ ] Firefox: ✅
- [ ] Safari: ✅
- [ ] Mobile Safari: ✅

### 11. **Performance Test** ✅
- [ ] Page loads in < 2 seconds
- [ ] Filter change is instant
- [ ] Pagination change is instant
- [ ] No lag when scrolling table

### 12. **Data Accuracy Test** ✅
- [ ] Booking codes match backend
- [ ] Field names resolve correctly
- [ ] Customer names show correctly
- [ ] Prices match backend
- [ ] Payment statuses match backend

## 🐛 Common Issues to Check

### Issue: Dates showing as "Invalid Date"
- [ ] Check date parsing function
- [ ] Verify backend date format (ISO 8601)
- [ ] Check timezone handling

### Issue: Prices showing weird format
- [ ] Check locale setting (vi-VN)
- [ ] Verify number formatting function
- [ ] Check for null/undefined values

### Issue: Filter not working
- [ ] Check statusFilter state updates
- [ ] Verify filter logic in useMemo
- [ ] Check dropdown onChange handler

### Issue: Pagination resets unexpectedly
- [ ] Check if currentPage properly set to 1 on filter change
- [ ] Verify dependencies in useMemo

### Issue: Table not loading
- [ ] Check API endpoint is correct
- [ ] Verify authentication (Bearer token)
- [ ] Check browser console for errors

## 📊 Test Data

Expected columns with sample data:

| Mã | Sân | Khách | Ngày | Giờ | Tiền | Thanh toán | Trạng thái |
|----|-----|-------|------|-----|------|-----------|-----------|
| BK-001 | Sân Bóng 1 | Nguyễn Văn A | 20/10/2025 | 14:00 - 15:00 | 200,000đ | ✅ Đã thanh toán | Đúng giờ |
| BK-002 | Sân Bóng 2 | Trần Thị B | 20/10/2025 | 15:00 - 16:00 | 150,000đ | ⏳ Chờ thanh toán | Chưa xác nhận |
| BK-003 | Sân Tennis 1 | Phạm Văn C | 21/10/2025 | 10:00 - 11:00 | 250,000đ | ✅ Đã thanh toán | Trễ |

## ✅ Final Verification

Before deployment, verify:
- [ ] No console errors
- [ ] No TypeScript type errors
- [ ] Build passes (`npm run build`)
- [ ] All ESLint checks pass
- [ ] Mobile responsive works
- [ ] Data formatting correct
- [ ] Filter functionality works
- [ ] Pagination works
- [ ] Loading states work

---

**Status**: Ready for Testing 🚀
