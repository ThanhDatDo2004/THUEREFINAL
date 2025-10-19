# 🐛 Bug Fix - Admin Payout Approve Error

## 🔴 Vấn Đề

Khi click nút **"Xác Nhận Thanh Toán"** trên trang Admin Payouts (`/admin/payouts`), xuất hiện lỗi:

```json
{
  "success": false,
  "statusCode": 500,
  "data": null,
  "error": {
    "status": "error",
    "message": "Unknown column 'UpdateAt' in 'field list'"
  }
}
```

## 📍 Nguyên Nhân

Backend đang cố gắng cập nhật một cột tên `UpdateAt` trong bảng `Payout_Requests`, nhưng cột này **không tồn tại** trong database.

### Các Khả Năng:

1. **Database sử dụng tên cột khác**, ví dụ:

   - `UpdatedAt` (với chữ 'd')
   - `updated_at` (snake_case)
   - `LastUpdated`
   - Hoặc không có cột này

2. **Backend gửi đúng tên nhưng database schema không đúng**

3. **Typo trong code backend**

## ✅ Cách Khắc Phục

### Backend - Option 1: Sửa Tên Cột (Recommended)

Kiểm tra database schema:

```sql
-- Xem tất cả cột trong bảng Payout_Requests
DESCRIBE Payout_Requests;
-- hoặc
SHOW COLUMNS FROM Payout_Requests;
```

Nếu tên cột không phải `UpdateAt`, hãy cập nhật code backend:

**Nếu database có `UpdatedAt`:**

```javascript
// Trong file update payout (backend)
// Sửa từ:
UPDATE Payout_Requests SET UpdateAt = NOW(), Status = 'paid' WHERE PayoutID = ?

// Sang:
UPDATE Payout_Requests SET UpdatedAt = NOW(), Status = 'paid' WHERE PayoutID = ?
```

**Nếu database có `updated_at` (snake_case):**

```javascript
UPDATE Payout_Requests SET updated_at = NOW(), status = 'paid' WHERE PayoutID = ?
```

### Backend - Option 2: Thêm Cột (Nếu Không Tồn Tại)

Nếu cột `UpdateAt` không tồn tại, hãy thêm:

```sql
ALTER TABLE Payout_Requests ADD COLUMN UpdateAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;
```

### Backend - Option 3: Xem Code Approve Logic

Tìm hàm approve payment trong backend:

- Kiểm tra file xử lý approve payout request
- Tìm câu lệnh UPDATE
- Đảm bảo tên cột khớp với database

Ví dụ (Node.js/Express):

```javascript
// Sai:
const query = `UPDATE Payout_Requests SET UpdateAt = NOW(), Status = 'paid' WHERE PayoutID = ?`;

// Đúng (nếu database có UpdatedAt):
const query = `UPDATE Payout_Requests SET UpdatedAt = NOW(), Status = 'paid' WHERE PayoutID = ?`;
```

## 🔍 Debugging Steps

### Step 1: Xem Tên Cột Database

```sql
-- Kiểm tra schema
DESCRIBE Payout_Requests;

-- Hoặc chi tiết hơn:
SELECT COLUMN_NAME, COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'Payout_Requests' AND TABLE_SCHEMA = 'your_database';
```

### Step 2: Xem Backend Code

- Tìm endpoint: `PATCH /admin/payout-requests/:id/approve`
- Kiểm tra SQL query
- Tìm cột `UpdateAt` và verify tên

### Step 3: Xem Frontend API Call

Frontend code gọi:

```typescript
// src/models/admin.api.ts - Line 360-369
export const approvePayoutRequestApi = async (
  payoutID: number,
  data?: ApprovePayoutRequest
): Promise<IApiSuccessResponse<ApprovePayoutResponse>> => {
  const response = await api.patch<IApiSuccessResponse<ApprovePayoutResponse>>(
    `/admin/payout-requests/${payoutID}/approve`,
    data || {} // Gửi {}
  );
  return response.data;
};
```

Frontend chỉ gửi `{}` hoặc `{ note?: string }`, vậy backend phải tự set `UpdateAt`.

## 📋 Database Schema Expected

Bảng `Payout_Requests` nên có:

```sql
CREATE TABLE Payout_Requests (
  PayoutID INT PRIMARY KEY AUTO_INCREMENT,
  ShopCode INT NOT NULL,
  ShopName VARCHAR(255),
  Amount DECIMAL(15,2),
  Status ENUM('requested', 'processing', 'paid', 'rejected'),
  BankName VARCHAR(255),
  AccountNumber VARCHAR(50),
  RequestedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  -- Chọn một trong các tên sau:
  UpdateAt TIMESTAMP,          -- ← Option 1
  -- UpdatedAt TIMESTAMP,        -- ← Option 2 (Recommended)
  -- updated_at TIMESTAMP,       -- ← Option 3
  -- LastUpdated TIMESTAMP,      -- ← Option 4
  CreateAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  Note TEXT,
  RejectionReason TEXT
);
```

## 🔧 Quick Fix Checklist

- [ ] Kiểm tra database schema: `DESCRIBE Payout_Requests`
- [ ] Ghi chú tên cột timestamp (ví dụ: UpdatedAt, updated_at)
- [ ] Tìm backend code xử lý approve (tìm endpoint `/admin/payout-requests/:id/approve`)
- [ ] Sửa tên cột trong UPDATE query
- [ ] Test lại click "Xác Nhận Thanh Toán"
- [ ] Kiểm tra response trả về (status: 200, data.status = 'paid')

## 🧪 Test Sau Khi Fix

1. Vào `/admin/payouts`
2. Click "Xác Nhận Thanh Toán" (hoặc nút tương tự)
3. Kiểm tra:
   - ✅ Không có error message
   - ✅ Status thay đổi từ "Chờ Duyệt" sang "Đã Thanh Toán"
   - ✅ Danh sách tự động refresh

## 💬 Lưu Ý

- Lỗi này **không liên quan đến frontend**
- Frontend đang gửi request đúng cách
- Backend cần fix SQL query
- Kiểm tra backend logs để xem exact SQL statement

## 📞 Follow-up

Sau khi fix, hãy kiểm tra:

1. API response: `{ success: true, status: 'paid', approvedAt: '...' }`
2. Database: Kiểm tra Status của payout đã thay đổi thành 'paid'
3. Frontend: Danh sách được refresh, status badge cập nhật thành xanh lá

---

**Status**: 🔴 Pending backend fix
**Priority**: 🔴 High (Approve payment không hoạt động)
**Assignee**: Backend team
**Tags**: #bug #database #backend #admin
