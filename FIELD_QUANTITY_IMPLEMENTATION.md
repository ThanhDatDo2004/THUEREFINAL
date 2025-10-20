# 🎾 Field_Quantity System - Frontend Implementation Guide

## ✅ Completed Tasks

### 1. **API Functions Added** ✓
**File:** `src/models/fields.api.ts`

Added new functions for quantity management:
- `fetchAvailableQuantities()` - Get available courts for a time slot
- `fetchFieldQuantities()` - Get all courts for a field
- `updateQuantityStatus()` - Update court maintenance status

New interfaces:
- `Quantity` - Individual court data
- `AvailableQuantitiesResponse` - Available courts response
- `QuantitiesListResponse` - All quantities response

### 2. **Booking API Updated** ✓
**File:** `src/models/booking.api.ts`

Added:
- `CreateBookingWithQuantityRequest` - Support for quantityID in bookings
- `BookingItemWithQuantity` - Display quantity info in booking details

### 3. **Types Updated** ✓
**File:** `src/types/index.ts`

Added:
- `Quantity` interface
- `FieldWithQuantity` interface extending `FieldWithImages`

### 4. **Court Selector Component Created** ✓
**File:** `src/components/forms/AvailableCourtSelector.tsx`

Beautiful court selection UI with:
- Grid layout for available courts
- Court number display (Sân 1, 2, 3...)
- Status badges (Available/Maintenance/Inactive)
- Selected state indication
- Loading state

### 5. **ShopFieldsPage Updated** ✓
**File:** `src/pages/shop/ShopFieldsPage.tsx`

Updated to support quantityCount:
- Added `quantityCount` to form state
- Added quantity input field in create form
- Support for displaying court information

---

## 📋 Implementation Checklist

### Phase 1: Core Field Management (P0 - Critical)

- [x] Add API functions for quantity endpoints
- [x] Update types with Quantity interface
- [x] Create AvailableCourtSelector component
- [x] Add quantityCount input to ShopFieldsPage create form
- [ ] Display individual court status on field cards
- [ ] Add maintenance toggle for individual courts
- [ ] Pass quantityCount to backend when creating fields

### Phase 2: Booking Flow Integration (P0 - Critical)

- [ ] Update BookingPage to fetch available quantities
- [ ] Integrate AvailableCourtSelector in booking flow
- [ ] Include quantityID in booking submission
- [ ] Display selected court in booking summary
- [ ] Update booking confirmation to show court number

### Phase 3: Booking Details Display (P1 - Important)

- [ ] Show quantity_number in booking history
- [ ] Display court info in booking detail page
- [ ] Update ShopBookingsPage to show court info
- [ ] Show quantity status in booking cards

### Phase 4: Admin Features (P2 - Nice to have)

- [ ] Add court maintenance UI in shop fields
- [ ] Display real-time availability stats
- [ ] Court usage analytics
- [ ] Bulk court status management

---

## 🔌 Backend API Reference

### 1. Create Field with Quantity
```
POST /api/shops/me/fields
Headers: Authorization: Bearer TOKEN
Body: {
  "fieldName": "Tennis",
  "sportType": "tennis",
  "address": "123 Nguyen Hue",
  "pricePerHour": 100000,
  "quantityCount": 3    ← NEW!
}

Response: {
  "success": true,
  "data": {
    "fieldCode": 1,
    "fieldName": "Tennis",
    "quantityCount": 3,
    "quantities": [
      { "quantityID": 1, "quantityNumber": 1, "status": "available" },
      { "quantityID": 2, "quantityNumber": 2, "status": "available" },
      { "quantityID": 3, "quantityNumber": 3, "status": "available" }
    ]
  }
}
```

### 2. Get Available Courts for Time Slot
```
GET /api/fields/1/available-quantities?playDate=2025-10-20&startTime=08:00&endTime=09:00

Response: {
  "success": true,
  "data": {
    "fieldCode": 1,
    "playDate": "2025-10-20",
    "timeSlot": "08:00-09:00",
    "totalQuantities": 3,
    "availableQuantities": [
      { "quantity_id": 1, "quantity_number": 1, "status": "available" },
      { "quantity_id": 3, "quantity_number": 3, "status": "available" }
    ],
    "bookedQuantities": [
      { "quantity_id": 2, "quantity_number": 2, "status": "booked" }
    ],
    "availableCount": 2
  }
}
```

### 3. Get All Quantities for Field
```
GET /api/fields/1/quantities

Response: {
  "success": true,
  "data": {
    "fieldCode": 1,
    "totalQuantities": 3,
    "quantities": [
      { "quantity_id": 1, "quantity_number": 1, "status": "available", ... },
      { "quantity_id": 2, "quantity_number": 2, "status": "maintenance", ... },
      { "quantity_id": 3, "quantity_number": 3, "status": "available", ... }
    ]
  }
}
```

### 4. Update Court Status (Admin)
```
PUT /api/fields/1/quantities/2/status
Body: { "status": "maintenance" }

Valid status: available | maintenance | inactive
```

### 5. Create Booking with Court
```
POST /api/bookings
Body: {
  "fieldCode": 1,
  "quantityID": 1,      ← NEW!
  "playDate": "2025-10-20",
  "startTime": "08:00",
  "endTime": "09:00",
  ...
}
```

---

## 🎯 Next Implementation Steps

### Step 1: Update Booking Flow
1. After customer selects time slot in BookingPage
2. Call `fetchAvailableQuantities()` with selected date/time
3. Display `AvailableCourtSelector` component
4. Store selected `quantityID` in form state
5. Include `quantityID` in booking submission

### Step 2: Update Booking Details
1. Fetch booking from API (should include quantityID)
2. Map quantityID to quantity_number for display
3. Show "Sân N" in confirmation page
4. Display in booking history

### Step 3: Shop Field Management
1. When creating field, send `quantityCount` to backend
2. Display available courts on field card
3. Show court status for each court
4. Add toggle to set individual court maintenance

---

## 📝 Code Examples

### Using AvailableCourtSelector
```tsx
import AvailableCourtSelector from "../../components/forms/AvailableCourtSelector";
import { fetchAvailableQuantities } from "../../models/fields.api";

const [availableQuantities, setAvailableQuantities] = useState([]);
const [selectedQuantityID, setSelectedQuantityID] = useState<number>();
const [loadingQuantities, setLoadingQuantities] = useState(false);

// When time slot is selected
const handleTimeSelect = async () => {
  setLoadingQuantities(true);
  try {
    const data = await fetchAvailableQuantities(
      fieldCode,
      selectedDate,
      startTime,
      endTime
    );
    setAvailableQuantities(data.availableQuantities);
  } finally {
    setLoadingQuantities(false);
  }
};

// In JSX
<AvailableCourtSelector
  availableQuantities={availableQuantities}
  selectedQuantityID={selectedQuantityID}
  onSelectCourt={setSelectedQuantityID}
  loading={loadingQuantities}
/>
```

### Including quantityID in Booking
```tsx
// In booking submission
const bookingData = {
  fieldCode: field.field_code,
  quantityID: selectedQuantityID,  // NEW!
  playDate: selectedDate,
  startTime: selectedTime,
  endTime: selectedEndTime,
  customerName: formData.customer_name,
  customerEmail: formData.customer_email,
  customerPhone: formData.customer_phone,
};

const response = await confirmFieldBooking(
  field.field_code,
  {
    slots: selectedSlots.map(slot => ({...})),
    payment_method: formData.payment_method,
    total_price: effectiveBooking.totalPrice,
    customer: {...},
  }
);
```

---

## 🧪 Testing Checklist

### Test Case 1: Create Field with 3 Courts
```
1. Go to Shop Fields page (http://localhost:5173/shop/fields)
2. Click "Thêm sân"
3. Fill form:
   - Name: "Tennis"
   - Sport: "Tennis"
   - Price: "100000"
   - Quantity: "3"
   - Address: Fill all fields
4. Submit
Expected: Field created with Sân 1, 2, 3 displayed
```

### Test Case 2: Book with Court Selection
```
1. Go to booking page
2. Select field (with multiple courts)
3. Select date and time
Expected: Show available courts (e.g., Sân 1, 3 available; Sân 2 booked)
4. Select court
5. Complete booking
Expected: Selected court saved in booking
```

### Test Case 3: Set Court to Maintenance
```
1. Go to Shop Fields
2. Find field with multiple courts
3. Click edit
Expected: Show individual court status
4. Set Sân 2 to maintenance
5. Go to booking page
Expected: Sân 2 not shown as available
```

---

## 🔗 File References

### New Files Created
- `src/components/forms/AvailableCourtSelector.tsx` - Court selector component

### Updated Files
- `src/models/fields.api.ts` - Added quantity functions
- `src/models/booking.api.ts` - Added quantity support
- `src/types/index.ts` - Added Quantity types
- `src/pages/shop/ShopFieldsPage.tsx` - Added quantityCount support

### To Be Updated
- `src/pages/BookingPage.tsx` - Add court selection
- `src/pages/BookingDetailPage.tsx` - Display court info
- `src/pages/shop/ShopBookingsPage.tsx` - Show court in booking list

---

## ✨ Key Points

✅ **quantityCount** - Number of physical courts per field  
✅ **quantityID** - Unique ID for specific court  
✅ **quantity_number** - Display name (Sân 1, 2, 3...)  
✅ **Status** - available / maintenance / inactive  
✅ **Availability Check** - Query by fieldCode + time slot  

---

## 💡 Notes

- All new API functions follow existing error handling patterns
- Component uses Tailwind CSS matching the current design system
- Type safety maintained with TypeScript interfaces
- Backward compatible with existing code

