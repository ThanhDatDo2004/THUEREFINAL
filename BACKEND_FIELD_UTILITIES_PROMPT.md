# 🔧 Backend Task: Field Utilities APIs

**Frontend Status**: ✅ COMPLETE  
**Backend Status**: ⏳ PENDING  
**Date**: 2025-10-19

---

## 📋 Overview

Frontend hiển thị utilities cho từng sân trên trang chi tiết (`/fields/:id`). Cần backend APIs để:
1. Fetch utilities cho field
2. Lưu/update utilities cho field (từ shop)

---

## 🎯 Requirements

### Frontend Expectations

#### 1. **Get Field Utilities Endpoint**

```http
GET /api/fields/:fieldCode/utilities
Authorization: Bearer <token>
```

**Response**:
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Field utilities",
  "data": [
    {
      "utility_id": "parking",
      "field_code": 48,
      "utility_name": "Bãi Đỗ Xe",
      "is_available": 1
    },
    {
      "utility_id": "restroom",
      "field_code": 48,
      "utility_name": "Nhà Vệ Sinh",
      "is_available": 1
    },
    {
      "utility_id": "wifi",
      "field_code": 48,
      "utility_name": "WiFi",
      "is_available": 0
    }
  ]
}
```

**Expected Behavior**:
- If field has no utilities yet → Return empty array `[]`
- If field has utilities → Return with `is_available: 1` or `0`
- On error → Return empty array (frontend handles gracefully)

---

#### 2. **Available Utilities**

These are the utilities the frontend recognizes:

| utility_id | utility_name | Icon |
|------------|-------------|------|
| parking | Bãi Đỗ Xe | 🅿️ |
| restroom | Nhà Vệ Sinh | 🚻 |
| changing_room | Phòng Thay Đồ | 🚪 |
| ac | Điều Hoà | ❄️ |
| hot_water | Nước Nóng | 🚿 |
| wifi | WiFi | 📶 |
| racket_rental | Thuê Vợt | 🎾 |
| ball_rental | Thuê Bóng | ⚽ |

---

#### 3. **Display Logic**

**On `/fields/:id` page**:
```
✓ Bãi Đỗ Xe      (green checkmark if is_available = 1)
✕ Nhà Vệ Sinh     (red X if is_available = 0)
✓ Phòng Thay Đồ   (line-through + gray if not available)
...
```

**Default**: If no utilities found for field → Show all with ✕ (not available)

---

## 🗄️ Database Schema (Expected)

### Table: `Fields_Utilities`
```sql
CREATE TABLE Fields_Utilities (
  id INT PRIMARY KEY AUTO_INCREMENT,
  field_code INT NOT NULL,
  shop_code INT NOT NULL,
  utility_id VARCHAR(50) NOT NULL,
  utility_name VARCHAR(100),
  is_available TINYINT DEFAULT 0,        -- 1 = available, 0 = not available
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  UNIQUE KEY unique_field_utility (field_code, utility_id),
  FOREIGN KEY (field_code) REFERENCES Fields(FieldCode),
  FOREIGN KEY (shop_code) REFERENCES Shops(shop_code)
);
```

---

## 📝 Implementation Notes

### Logic Flow

**Frontend Fetch**:
```
GET /fields/:fieldCode/utilities
  ↓
Backend Query:
  SELECT * FROM Fields_Utilities 
  WHERE field_code = :fieldCode
  ↓
Return data
  ↓
Frontend converts to boolean map:
  {
    "parking": true,      // is_available = 1
    "restroom": true,
    "wifi": false,        // is_available = 0
    ...
  }
  ↓
Display ✓ or ✕
```

### Error Handling
- **404 / No utilities**: Return empty array `[]`
- **Validation**: Validate `fieldCode` is numeric
- **Auth**: Check user is shop owner (if needed)
- **General error**: Return 500 with error message

---

## 🧪 Testing Examples

### Test 1: Field with utilities
```bash
curl -X GET "http://localhost:5050/api/fields/48/utilities" \
  -H "Authorization: Bearer <token>"

Expected: [
  { "utility_id": "parking", "is_available": 1 },
  { "utility_id": "restroom", "is_available": 1 },
  { "utility_id": "wifi", "is_available": 0 }
]
```

### Test 2: Field without utilities
```bash
curl -X GET "http://localhost:5050/api/fields/999/utilities" \
  -H "Authorization: Bearer <token>"

Expected: []
```

### Test 3: Invalid field code
```bash
curl -X GET "http://localhost:5050/api/fields/invalid/utilities" \
  -H "Authorization: Bearer <token>"

Expected: 400 Bad Request or empty array
```

---

## 🔗 Related Frontend Features

### 1. Shop Utilities Management (`/shop/utilities`)
- Shop selects utilities via UI
- Sends: `POST /api/shops/:shopCode/utilities`
- Saves to `Fields_Utilities` table

### 2. Field Detail Page (`/fields/:id`)
- Fetches from: `GET /api/fields/:fieldCode/utilities`
- Displays with ✓/✕ based on `is_available`

---

## ✅ Checklist for Backend

- [ ] Create `Fields_Utilities` table
- [ ] Implement `GET /api/fields/:fieldCode/utilities` endpoint
- [ ] Return empty array if no utilities
- [ ] Include `is_available` field (0 or 1)
- [ ] Test with Postman/curl
- [ ] Handle edge cases (invalid fieldCode, etc.)
- [ ] Add proper error handling
- [ ] Return proper response format

---

## 📊 Response Format Standard

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success message",
  "data": [...]
}
```

**On error**:
```json
{
  "success": false,
  "statusCode": 400/500,
  "message": "Error message",
  "data": null
}
```

---

## 🚀 Timeline

1. **Now**: Frontend complete and waiting
2. **Step 1**: Create database table
3. **Step 2**: Implement GET endpoint
4. **Step 3**: Test with frontend
5. **Step 4**: Deploy

---

## 📞 Frontend Integration

Once API is ready:
1. Frontend will auto-fetch on page load
2. Display utilities with ✓/✕ status
3. If API returns empty → show all as ✕
4. If API fails → show all as ✕ (graceful fallback)

---

## 💡 Tips

- Keep API simple: just return existing utilities for field
- If field has no utilities yet → return `[]`
- Don't create default records; return empty on first load
- Use `is_available` field to determine display (1 = ✓, 0 = ✕)

---

**Status**: Frontend ✅ READY → Waiting for Backend 🔧

