# 📖 Quick Reference - Shop Bookings Page

## 🎯 What Changed?

All field names updated from **snake_case** to **PascalCase** to match backend API response.

## 📊 Field Mapping

```typescript
// API Response Fields (PascalCase)
interface BookingItem {
  BookingCode: string;        // "BK-123ABC"
  FieldCode: number;          // 1
  FieldName: string;          // "Sân Bóng A"
  PlayDate: string;           // "2025-10-20"
  StartTime: string;          // "09:00"
  EndTime: string;            // "10:00"
  TotalPrice: number;         // 150000
  PaymentStatus: string;      // "pending" | "paid" | "failed"
  BookingStatus: string;      // "pending" | "confirmed" | ...
  CheckinCode: string;        // "ABC123"
  ShopName: string;           // "Shop A"
  SportType: string;          // "football"
}
```

## ✅ Usage in Component

```typescript
// Display values
<td>{b.BookingCode}</td>                          // ✅ Shows code
<td>{b.FieldName}</td>                            // ✅ Shows field name
<td>{formatDate(b.PlayDate)}</td>                // ✅ "20/10/2025"
<td>{formatTime(b.StartTime, b.EndTime)}</td>    // ✅ "09:00 - 10:00"
<td>{formatPrice(b.TotalPrice)}</td>             // ✅ "150,000đ"
<td>{formatPaymentStatus(b.PaymentStatus)}</td>  // ✅ "✅ Đã thanh toán"
<td>{b.BookingStatus}</td>                       // ✅ Status value
```

## 🔄 API Response Format

```javascript
// API Response
{
  "success": true,
  "data": {
    "data": [
      {
        "BookingCode": "BK-123ABC",
        "FieldCode": 1,
        "FieldName": "Sân Bóng A",
        "PlayDate": "2025-10-20",
        "StartTime": "09:00",
        "EndTime": "10:00",
        "TotalPrice": 150000,
        "PaymentStatus": "pending",
        "BookingStatus": "pending",
        "CheckinCode": "ABC123"
      },
      // ... more bookings
    ],
    "pagination": {
      "limit": 10,
      "offset": 0,
      "total": 28
    }
  }
}
```

## 🎯 Component Test Values

| Field | Test Value | Format |
|-------|-----------|--------|
| BookingCode | BK-123ABC | string |
| FieldCode | 1 | number |
| PlayDate | 2025-10-20 | ISO string → dd/MM/yyyy |
| StartTime | 09:00 | HH:mm |
| EndTime | 10:00 | HH:mm |
| TotalPrice | 150000 | number → 150,000đ |
| PaymentStatus | pending | "pending" \| "paid" \| "failed" |
| BookingStatus | pending | string |

## 📋 API Call

```typescript
// Fetch bookings from API
const response = await api.get<any>("/shops/me/bookings");

// Parse response
const bookingData = 
  response.data?.data?.data ||    // Handle nested structure
  response.data?.data ||           // Handle flat structure
  [];

// Use data
setBookings(bookingData);
```

## 🔍 Console Debug

```javascript
// In browser console, test:
console.log('bookings:', bookings);
console.log('first booking:', bookings[0]);
console.log('BookingCode:', bookings[0]?.BookingCode);
console.log('PlayDate:', bookings[0]?.PlayDate);
console.log('TotalPrice:', bookings[0]?.TotalPrice);
console.log('PaymentStatus:', bookings[0]?.PaymentStatus);
```

## ✅ Expected Output

```javascript
// Console should show:
bookings: Array(28)
first booking: {
  BookingCode: "BK-001",
  FieldCode: 48,
  FieldName: "Sân 1",
  PlayDate: "2025-10-20",
  StartTime: "09:00",
  EndTime: "10:00",
  TotalPrice: 200000,
  PaymentStatus: "paid",
  BookingStatus: "pending",
  CheckinCode: "XYZ789"
}
BookingCode: "BK-001"
PlayDate: "2025-10-20"
TotalPrice: 200000
PaymentStatus: "paid"
```

## 🚀 How to Test

1. **Login** as shop owner
2. **Navigate** to `/shop/bookings`
3. **Open DevTools** (F12)
4. **Go to Console** and check:
   - Bookings load?
   - Fields are correct?
   - Data displays in table?
5. **Test Filter** - Select different status options
6. **Test Pagination** - Click page numbers
7. **Verify Formatting**:
   - Dates show as "20/10/2025"?
   - Prices show as "200,000đ"?
   - Status icons show (✅/⏳)?

## 📝 Common Issues & Fix

| Issue | Cause | Fix |
|-------|-------|-----|
| "undefined" in table | Wrong field name | Use PascalCase (BookingCode not booking_code) |
| "Invalid Date" | Wrong field name | Use PlayDate not booking_date |
| "NaN" price | Wrong field name | Use TotalPrice not total_price |
| Filter not working | Wrong filter field | Use b.PaymentStatus not b.payment_status |
| No bookings shown | API call failed | Check auth token, check API endpoint |

## 🔗 Related Files

- Component: `/src/pages/shop/ShopBookingsPage.tsx`
- API Types: `/src/models/booking.api.ts`
- Documentation: `API_FIELD_CORRECTION.md`

## 📞 Support

- ✅ Build passes
- ✅ No linting errors
- ✅ TypeScript safe
- ✅ Ready to test

---

**Last Updated**: October 18, 2025  
**Status**: ✅ CORRECTED & READY

