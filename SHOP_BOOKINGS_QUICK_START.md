# 🚀 Shop Bookings Page - Quick Start Guide

## Access the Page

### URL
```
http://localhost:5173/shop/bookings
```

### Prerequisites
- Must be logged in as shop owner
- Shop must have active bookings

---

## ✨ What You Can Do

### 1. View All Bookings
The page automatically loads and displays all bookings in a table with these columns:
- **Mã** - Booking code
- **Sân** - Field name (auto-resolved)
- **Khách** - Customer name
- **Ngày** - Date in dd/MM/yyyy format
- **Giờ** - Time in HH:mm - HH:mm format
- **Tiền** - Price in VND format (e.g., 200,000đ)
- **Thanh toán** - Payment status with icon (✅ paid / ⏳ pending)
- **Trạng thái** - Check-in status

### 2. Filter by Payment Status
Use the dropdown at the top to filter:
- **Tất cả** (All) - Shows all bookings with total count
- **Chờ thanh toán** (Pending) - Shows only unpaid bookings
- **Đã thanh toán** (Paid) - Shows only paid bookings  
- **Thất bại** (Failed) - Shows only failed bookings

**Tip**: Counts update in real-time based on your data

### 3. Navigate Pages
With 10 bookings per page, use pagination to navigate:
- Click **page numbers** to jump to specific page
- Click **◀** (Previous) to go to previous page
- Click **▶** (Next) to go to next page
- Current page is highlighted in blue

**Info**: Shows "Hiển thị X đến Y trong Z đơn" (Displaying X to Y of Z bookings)

---

## 💡 Tips & Tricks

### Loading Data
- Page loads automatically on first visit
- If slow, refresh the page (F5)
- Check browser console (F12) for any errors

### Filter Tricks
- Change filter → pagination resets to page 1
- All counts include full dataset
- Empty state shows if no bookings match filter

### Data Accuracy
- Dates parsed from ISO 8601 format
- Prices in Vietnamese Dong (VND)
- Payment status from backend (pending/paid/failed)
- Customer names auto-resolved from booking data

### Performance
- Filtering is instant (optimized with useMemo)
- Pagination is instant
- No page refresh needed for interactions

---

## 🎨 Understanding the UI

```
┌─────────────────────────────────────────────────┐
│ 📅 Đơn đặt sân                                  │
├─────────────────────────────────────────────────┤
│ Trạng thái thanh toán: [Tất cả (28) ▼]        │
├─────────────────────────────────────────────────┤
│ Mã  │ Sân  │ Khách │ Ngày  │ Giờ   │ Tiền │... │
├─────┼──────┼───────┼───────┼───────┼──────┼────┤
│ BK-1│ Sân 1│ Văn A │20/10  │14:00- │200k │ ✅ │
│ BK-2│ Sân 2│ Hằng B│20/10  │15:00- │150k │ ⏳ │
│ ... │ ...  │ ...   │ ...   │ ...   │ ... │... │
├─────────────────────────────────────────────────┤
│ Hiển thị 1 đến 10 trong 28 đơn                 │
│ [◀] [1][2][3][4] [▶]                          │
└─────────────────────────────────────────────────┘
```

---

## 🔍 Troubleshooting

### Problem: No bookings showing
**Solution**: 
- Check if you're logged in as a shop owner
- Verify shop has bookings in database
- Check browser console for errors (F12)
- Try refreshing (F5)

### Problem: Date showing wrong format
**Solution**:
- Dates should be dd/MM/yyyy (e.g., 20/10/2025)
- If showing wrong format, check backend date format
- Try refreshing page

### Problem: Filter not working
**Solution**:
- Try changing filter again
- Check if bookings exist for that filter
- Refresh page if still not working

### Problem: Pagination buttons disabled
**Solution**:
- This is normal if only 1 page of results
- Try filtering to get more items
- Previous/Next are disabled at boundaries

### Problem: Prices showing weird
**Solution**:
- Should show as `X,XXXđ` (e.g., 200,000đ)
- If not, check backend returns correct numbers
- Try refreshing page

---

## 📊 Data Format Reference

| Data | Format | Example |
|------|--------|---------|
| Date | dd/MM/yyyy | 20/10/2025 |
| Time | HH:mm - HH:mm | 14:00 - 15:00 |
| Price | X,XXXđ | 200,000đ |
| Payment | Icon + Label | ✅ Đã thanh toán |

---

## 🎯 Common Tasks

### Task: Find all pending payments
1. Click filter dropdown
2. Select "Chờ thanh toán"
3. Review bookings that need payment

### Task: Check revenue from paid bookings
1. Click filter dropdown
2. Select "Đã thanh toán"
3. Note total prices of all displayed bookings
4. Navigate through pages if more than 10

### Task: See specific booking details
1. Find booking in table
2. Note booking code (Mã)
3. Check customer name, date, time, amount
4. Verify payment status

---

## 🔐 Important Notes

- ⚠️ Only shop owners can access this page
- ⚠️ Data is read-only (view-only page)
- ⚠️ Refreshing doesn't lose unsaved data (it's all in DB)
- ✅ Safe to leave page and come back

---

## 🚀 Performance Tips

- **Tip 1**: Don't leave too many filters applied long-term
- **Tip 2**: Use pagination (don't load all data at once)
- **Tip 3**: Refresh if page becomes unresponsive
- **Tip 4**: Modern browsers (Chrome, Firefox, Edge) work best

---

## 📞 Need Help?

- Check this guide first
- See documentation files:
  - `SHOP_BOOKINGS_COMPLETED.md` - Features overview
  - `SHOP_BOOKINGS_FEATURES.md` - Detailed specs
  - `SHOP_BOOKINGS_TEST_CHECKLIST.md` - Testing guide
- Contact development team if issues persist

---

**Last Updated**: October 18, 2025  
**Status**: ✅ Ready for Use

