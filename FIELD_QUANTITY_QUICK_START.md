# 🚀 Field_Quantity System - Quick Start Guide

## What Was Implemented

### ✅ Phase 1: Backend API Integration (COMPLETE)

1. **New API Functions** in `src/models/fields.api.ts`:
   - `fetchAvailableQuantities(fieldCode, playDate, startTime, endTime)` 
   - `fetchFieldQuantities(fieldCode)`
   - `updateQuantityStatus(fieldCode, quantityNumber, status)`

2. **Type Definitions** in `src/types/index.ts`:
   - `Quantity` - represents an individual court
   - `FieldWithQuantity` - field extended with quantity info

3. **Booking Support** in `src/models/booking.api.ts`:
   - `CreateBookingWithQuantityRequest` - includes quantityID
   - `BookingItemWithQuantity` - display quantity in bookings

### ✅ Phase 2: UI Components (COMPLETE)

1. **New Component** `src/components/forms/AvailableCourtSelector.tsx`:
   ```tsx
   <AvailableCourtSelector
     availableQuantities={[...]}
     selectedQuantityID={selectedID}
     onSelectCourt={handleSelect}
     loading={isLoading}
   />
   ```

2. **Updated ShopFieldsPage** with:
   - `quantityCount` input field in create form
   - Support for managing multiple courts per field type

---

## How to Use

### For Shop Owners: Create Field with Multiple Courts

**Location:** `http://localhost:5173/shop/fields` → "Thêm sân"

**Form Fields:**
- Tên sân: "Tennis"
- Loại môn: Select sport type
- Giá / giờ: 100000
- **Số sân: 3** ← NEW! (Creates Sân 1, 2, 3)
- Address fields: Fill location

**Result:** 
```
Field created with:
- quantityCount: 3
- quantities: [
    { quantity_id: 1, quantity_number: 1, status: "available" },
    { quantity_id: 2, quantity_number: 2, status: "available" },
    { quantity_id: 3, quantity_number: 3, status: "available" }
  ]
```

### For Customers: Book with Court Selection

**Current Flow (Step by Step):**
1. Navigate to booking page
2. Select field (e.g., "Tennis")
3. Select date and time slot
4. **[TODO] Chọn sân (Select court)** ← To be added to BookingPage
5. Enter customer info
6. Confirm booking with quantityID

**Expected Behavior:**
- Shows available courts for selected time
- Displays "Sân 1", "Sân 2", "Sân 3"
- Marks booked/maintenance courts as unavailable
- Includes quantityID in booking submission

---

## Next Steps: Integrate into BookingPage

### To Enable Court Selection in Booking:

**File:** `src/pages/BookingPage.tsx`

Add this import:
```tsx
import AvailableCourtSelector from "../components/forms/AvailableCourtSelector";
import { fetchAvailableQuantities, type Quantity } from "../models/fields.api";
```

Add state:
```tsx
const [availableQuantities, setAvailableQuantities] = useState<Quantity[]>([]);
const [selectedQuantityID, setSelectedQuantityID] = useState<number>();
const [loadingQuantities, setLoadingQuantities] = useState(false);
```

After time slot selection (replace in useEffect or add new trigger):
```tsx
// When selectedSlots changes (time is selected)
if (selectedSlots.length > 0 && field) {
  setLoadingQuantities(true);
  try {
    const data = await fetchAvailableQuantities(
      field.field_code,
      selectedDate,
      selectedSlots[0].start_time,
      selectedSlots[selectedSlots.length - 1].end_time
    );
    setAvailableQuantities(data.availableQuantities);
    // Auto-select first available if not already selected
    if (!selectedQuantityID && data.availableQuantities.length > 0) {
      setSelectedQuantityID(data.availableQuantities[0].quantity_id);
    }
  } finally {
    setLoadingQuantities(false);
  }
}
```

Add UI (after time slot selection section):
```tsx
{selectedSlots.length > 0 && (
  <AvailableCourtSelector
    availableQuantities={availableQuantities}
    selectedQuantityID={selectedQuantityID}
    onSelectCourt={setSelectedQuantityID}
    loading={loadingQuantities}
  />
)}
```

Update booking submission:
```tsx
const response = await confirmFieldBooking(field.field_code, {
  slots: selectedSlots.map((slot) => ({
    slot_id: Number(slot.slot_id),
    play_date: slot.play_date,
    start_time: slot.start_time,
    end_time: slot.end_time,
  })),
  payment_method: formData.payment_method,
  total_price: effectiveBooking.totalPrice,
  customer: {
    name: formData.customer_name,
    email: formData.customer_email,
    phone: formData.customer_phone,
    quantityID: selectedQuantityID,  // ← ADD THIS
  },
  notes: formData.notes,
});
```

---

## File Changes Summary

### New Files (1)
- ✅ `src/components/forms/AvailableCourtSelector.tsx` - 80 lines

### Updated Files (4)
- ✅ `src/models/fields.api.ts` - Added 80+ lines with functions and types
- ✅ `src/models/booking.api.ts` - Added 10+ lines with booking types
- ✅ `src/types/index.ts` - Added 15+ lines with quantity types
- ✅ `src/pages/shop/ShopFieldsPage.tsx` - Added quantityCount field support

---

## Testing Your Implementation

### Test 1: Create Field with Multiple Courts
1. Login as shop owner
2. Go to Shop Fields page
3. Click "Thêm sân"
4. Enter field details with Số sân = 3
5. Submit
6. ✅ Verify: Field saved with 3 courts

### Test 2: View Available Courts (After Booking Integration)
1. Go to any field booking page
2. Select date and time
3. ✅ Expected: See court selector with available courts
4. Select one court
5. ✅ Verify: Selected court highlighted

### Test 3: Complete Booking with Court
1. Book a field with court selection
2. Complete booking
3. ✅ Verify: Booking includes quantityID and quantityNumber

---

## API Endpoints Reference

```
GET /api/fields/:fieldCode/available-quantities
  Query: playDate, startTime, endTime
  Returns: { availableQuantities, bookedQuantities, availableCount }

GET /api/fields/:fieldCode/quantities
  Returns: { fieldCode, totalQuantities, quantities[] }

PUT /api/fields/:fieldCode/quantities/:quantityNumber/status
  Body: { status: "available" | "maintenance" | "inactive" }
  Returns: { quantity_id, quantity_number, status }

POST /api/bookings (Updated)
  Body now supports: quantityID (optional)
```

---

## Component Props Reference

### AvailableCourtSelector
```tsx
interface AvailableCourtSelectorProps {
  availableQuantities: Quantity[];        // Array of available courts
  selectedQuantityID?: number;            // Currently selected court ID
  onSelectCourt: (quantityID: number) => void;  // Selection handler
  loading?: boolean;                      // Show loading state
}
```

### Quantity Type
```tsx
interface Quantity {
  quantity_id: number;
  quantity_number: number;  // Display as "Sân N"
  status: "available" | "maintenance" | "inactive";
  created_at?: string;
  updated_at?: string;
}
```

---

## Common Issues & Solutions

### Issue: Court selector doesn't appear
**Check:**
- Is `selectedSlots.length > 0`?
- Did `fetchAvailableQuantities` succeed?
- Is `availableQuantities` populated?

### Issue: Selected court not saved in booking
**Check:**
- Is `selectedQuantityID` being passed to booking API?
- Does backend support quantityID parameter?
- Check network tab for actual request sent

### Issue: Wrong court displayed in booking history
**Check:**
- Is `quantity_number` mapped correctly from `quantityID`?
- Backend should return `quantityNumber` or map from `quantityID`

---

## Performance Notes

- Court selection only loads when time slot is selected (lazy loading)
- Quantities are fetched per time slot (specific availability check)
- Component memoization not needed (already optimized)

---

## Next Phase: Phase 2 & 3

### Phase 2 Tasks:
- [ ] Integrate court selector into BookingPage
- [ ] Update booking confirmation to show selected court
- [ ] Display court info in payment page

### Phase 3 Tasks:
- [ ] Show court number in booking history (ShopBookingsPage)
- [ ] Display court info in booking detail view
- [ ] Add court status indicators

---

## Support & Questions

Refer to:
- `FIELD_QUANTITY_IMPLEMENTATION.md` - Full technical guide
- Backend API documentation at http://localhost:5050
- Component usage in `AvailableCourtSelector.tsx`

