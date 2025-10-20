# ⚡ Quantity ID Implementation - Quick Reference

## 🎯 What Changed?

Frontend now supports selecting specific courts (sân) when booking. Backend receives `quantity_id` to track which court was booked.

---

## 📝 User Flow

```
1. User selects time slot
   ↓
2. System fetches available courts from API
   ↓
3. Show all courts: green ✅ (available) + red ❌ (booked)
   ↓
4. User selects a court
   ↓
5. User clicks "Xác nhận đặt sân"
   ↓
6. System sends: quantity_id to backend
   ↓
7. Success! ✅ or Conflict 409? → Refresh and retry
```

---

## 🔑 Key Implementation Points

### 1. State Management (BookingPage.tsx)

```typescript
// NEW: Track booked courts
const [bookedQuantities, setBookedQuantities] = useState<Quantity[]>([]);

// EXISTING: Track available courts
const [availableQuantities, setAvailableQuantities] = useState<Quantity[]>([]);
const [selectedQuantityID, setSelectedQuantityID] = useState<number>();
```

### 2. Fetch Courts (BookingPage.tsx)

```typescript
// When slots are selected, fetch available courts
const data = await fetchAvailableQuantities(
  field.field_code,
  firstSlot.play_date,
  firstSlot.start_time,
  lastSlot.end_time
);

setAvailableQuantities(data.availableQuantities || []);
setBookedQuantities(data.bookedQuantities || []);
```

### 3. Send Booking (BookingPage.tsx)

```typescript
// Include quantity_id in booking payload
await confirmFieldBooking(field.field_code, {
  slots: [...],
  payment_method: "banktransfer",
  total_price: 500000,
  customer: {...},
  quantity_id: selectedQuantityID,  // ✅ THIS IS NEW
  notes: "..."
});
```

### 4. Display Courts (AvailableCourtSelector.tsx)

```typescript
// Component receives both lists
<AvailableCourtSelector
  availableQuantities={availableQuantities} // Green courts ✅
  bookedQuantities={bookedQuantities} // Red courts ❌
  selectedQuantityID={selectedQuantityID}
  onSelectCourt={setSelectedQuantityID}
  loading={loadingQuantities}
/>
```

### 5. Handle Errors (BookingPage.tsx)

```typescript
// If 409 error (court was booked by someone else)
if (error.message.includes("409") || error.message.includes("đã được đặt")) {
  // Refresh courts
  const data = await fetchAvailableQuantities(...);
  setAvailableQuantities(data.availableQuantities || []);
  setBookedQuantities(data.bookedQuantities || []);

  // Show error
  setSlotsError("Sân này đã được đặt trong khung giờ này");
}
```

---

## 🎨 UI Changes

### Before

```
Khung giờ: ☑ Trống ☐ Khoá
```

### After

```
Chọn sân *

[✓ Sân 1]  [✕ Sân 2]  [  Sân 3]  [✕ Sân 4]
  Trống    Đã được đặt  Trống   Đã được đặt

[Ghi chú: Sân ghi "Đã được đặt" không khả dụng...]
```

---

## 📊 API Integration

### Request → Backend

```
POST /api/fields/68/bookings/confirm
{
  "quantity_id": 1,        // ← NEW
  "slots": [...],
  "customer": {...},
  "payment_method": "banktransfer",
  "total_price": 500000
}
```

### Response ← Backend

```
GET /api/fields/68/available-quantities?playDate=...&startTime=...&endTime=...

{
  "data": {
    "availableQuantities": [
      {"quantity_id": 1, "quantity_number": 1},
      {"quantity_id": 3, "quantity_number": 3}
    ],
    "bookedQuantities": [
      {"quantity_id": 2, "quantity_number": 2},
      {"quantity_id": 4, "quantity_number": 4}
    ]
  }
}
```

---

## ✅ Files Modified

| File                                              | What Changed                                     |
| ------------------------------------------------- | ------------------------------------------------ |
| `src/pages/BookingPage.tsx`                       | Added court selection logic + 409 error handling |
| `src/components/forms/AvailableCourtSelector.tsx` | Redesigned to show available + booked courts     |

---

## 🧪 Quick Test

1. Go to booking page
2. Select a time slot
3. See courts appear with green/red badges
4. Select a green court
5. Submit booking
6. Verify backend receives `quantity_id`

---

## 🐛 Troubleshooting

| Issue                      | Fix                                              |
| -------------------------- | ------------------------------------------------ |
| Courts not showing         | Check if `availableQuantities` is populated      |
| Booked courts not disabled | Verify `bookedQuantities` is passed to component |
| 409 error not handled      | Check error message pattern matching             |
| quantity_id not sent       | Verify `selectedQuantityID` is set before submit |

---

## 📞 Key Variables

```typescript
selectedQuantityID; // Currently selected court ID
availableQuantities; // List of available courts
bookedQuantities; // List of booked courts
loadingQuantities; // Is fetching courts?
```

---

## 🎯 Status: ✅ COMPLETE

All requirements implemented. Project builds successfully. Ready for testing!

**Last Updated:** 2025-10-20
