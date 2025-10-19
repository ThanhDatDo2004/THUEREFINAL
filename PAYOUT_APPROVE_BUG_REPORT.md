# 🚨 Bug Report: Admin Payout Approve Failure

## 📌 Summary
Khi admin click nút **"Xác Nhận Thanh Toán"** trên trang `/admin/payouts`, hệ thống trả về lỗi database:
- **Error Code**: 500
- **Error Message**: `Unknown column 'UpdateAt' in 'field list'`

---

## 🔴 Issue Details

### What Happens
1. User navigates to `/admin/payouts`
2. User clicks "Xác Nhận Thanh Toán" button on a pending payout
3. Frontend makes request: `PATCH /admin/payout-requests/{payoutID}/approve`
4. Backend returns error (see error response below)

### Error Response
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

### Expected Behavior
✅ Status should change from "Chờ Duyệt" to "Đã Thanh Toán"
✅ Response should be: `{ success: true, status: "paid", approvedAt: "..." }`
✅ List should refresh showing updated status

### Actual Behavior
❌ Status doesn't change
❌ Error displayed
❌ List doesn't refresh

---

## 🎯 Root Cause Analysis

### Backend Issue: Column Name Mismatch

The backend is trying to execute an SQL UPDATE statement with column name `UpdateAt`, but this column doesn't exist in the `Payout_Requests` table.

**Possible causes:**
1. Database schema uses different column name (e.g., `UpdatedAt`, `updated_at`)
2. Column doesn't exist and needs to be added
3. Typo in backend code

### Example SQL Error
```sql
-- What backend is trying to do (fails):
UPDATE Payout_Requests SET UpdateAt = NOW(), Status = 'paid' WHERE PayoutID = ?
-- Error: Unknown column 'UpdateAt' in 'field list'

-- What should work (depends on DB schema):
UPDATE Payout_Requests SET UpdatedAt = NOW(), Status = 'paid' WHERE PayoutID = ?
-- or
UPDATE Payout_Requests SET updated_at = NOW(), status = 'paid' WHERE PayoutID = ?
```

---

## 🔧 Solution Steps

### Step 1: Check Database Schema (Backend Team)
```sql
-- Login to MySQL/Database
-- Check Payout_Requests table structure
DESCRIBE Payout_Requests;

-- Or use:
SHOW COLUMNS FROM Payout_Requests;

-- Look for timestamp columns. You should see something like:
-- PayoutID | int
-- ShopCode | int
-- Amount | decimal
-- Status | enum
-- UpdateAt | timestamp (or UpdatedAt, updated_at, etc.)
-- CreateAt | timestamp
```

### Step 2: Identify Current Column Name (Backend Team)
- If you see `UpdateAt` → Database has the right column, but backend code is wrong
- If you see `UpdatedAt` → Fix backend code to use `UpdatedAt`
- If you see `updated_at` → Fix backend code to use `updated_at`
- If you don't see any timestamp column → Add it (see Step 4)

### Step 3: Fix Backend Code (Backend Team)

Find the backend route/controller that handles approve:
```
Endpoint: PATCH /admin/payout-requests/:id/approve
```

**Option A: If DB has `UpdatedAt` (with 'd')**
```javascript
// BEFORE (wrong):
const query = `UPDATE Payout_Requests SET UpdateAt = NOW(), Status = 'paid' WHERE PayoutID = ?`;

// AFTER (correct):
const query = `UPDATE Payout_Requests SET UpdatedAt = NOW(), Status = 'paid' WHERE PayoutID = ?`;
```

**Option B: If DB has `updated_at` (snake_case)**
```javascript
// AFTER (correct):
const query = `UPDATE Payout_Requests SET updated_at = NOW(), status = 'paid' WHERE PayoutID = ?`;
```

### Step 4: Add Column (If Doesn't Exist)
If the timestamp column doesn't exist at all:
```sql
-- Add UpdateAt column with auto-update:
ALTER TABLE Payout_Requests 
ADD COLUMN UpdateAt TIMESTAMP 
DEFAULT CURRENT_TIMESTAMP 
ON UPDATE CURRENT_TIMESTAMP;
```

---

## 📋 Expected Database Schema

```sql
CREATE TABLE Payout_Requests (
  PayoutID INT PRIMARY KEY AUTO_INCREMENT,
  ShopCode INT NOT NULL,
  ShopName VARCHAR(255),
  Amount DECIMAL(15,2) NOT NULL,
  Status ENUM('requested', 'processing', 'paid', 'rejected') DEFAULT 'requested',
  BankName VARCHAR(255),
  AccountNumber VARCHAR(50),
  RequestedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- ONE of these (recommended: UpdatedAt):
  UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  -- OR: UpdateAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  -- OR: updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  CreateAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  Note TEXT,
  RejectionReason TEXT
);
```

---

## ✅ Verification After Fix

After backend fix, test the following:

### 1. API Response
```json
{
    "success": true,
    "statusCode": 200,
    "data": {
        "payoutID": 123,
        "status": "paid",
        "approvedAt": "2024-10-19T10:30:00.000Z"
    }
}
```

### 2. Database Verification
```sql
-- Check if payout status was updated:
SELECT PayoutID, Status, UpdatedAt FROM Payout_Requests WHERE PayoutID = 123;

-- Should show:
-- | 123 | paid | 2024-10-19 10:30:00 |
```

### 3. Frontend Verification
1. Navigate to `/admin/payouts`
2. Click "Xác Nhận Thanh Toán" on a pending payout
3. Verify:
   - ✅ No error shown
   - ✅ Status changes to "Đã Thanh Toán" (green badge)
   - ✅ List auto-refreshes
   - ✅ Browser console shows no errors

---

## 📁 Frontend Code (For Reference)

### Frontend API Call (Correct ✅)
```typescript
// File: src/models/admin.api.ts (Line 360-369)
export const approvePayoutRequestApi = async (
  payoutID: number,
  data?: ApprovePayoutRequest
): Promise<IApiSuccessResponse<ApprovePayoutResponse>> => {
  const response = await api.patch<IApiSuccessResponse<ApprovePayoutResponse>>(
    `/admin/payout-requests/${payoutID}/approve`,
    data || {}  // Sends empty object or { note?: string }
  );
  return response.data;
};

// Interface:
export interface ApprovePayoutRequest {
  note?: string;
}

export interface ApprovePayoutResponse {
  payoutID: number;
  status: "paid";
  approvedAt: string;
}
```

### Frontend Handler (Correct ✅)
```typescript
// File: src/pages/admin/AdminPayoutRequestsPage.tsx (Line 78-92)
const handleApprove = async (payoutID: number) => {
  setActionLoading(payoutID);
  try {
    await approvePayoutRequestApi(payoutID);  // ← Correct call
    // Refresh list
    const response = await getAdminPayoutRequestsApi(
      statusFilter === "all" ? undefined : statusFilter
    );
    setPayouts(response.data?.data || []);
  } catch (error: any) {
    alert("Lỗi duyệt yêu cầu: " + error.message);
  } finally {
    setActionLoading(null);
  }
};
```

---

## 🎯 Summary Table

| Component | Status | Issue | Action |
|-----------|--------|-------|--------|
| Frontend API | ✅ Correct | None | No changes needed |
| Frontend Handler | ✅ Correct | None | No changes needed |
| Backend SQL | ❌ Wrong | Column name mismatch | **Fix backend code** |
| Database Schema | ⚠️ Check | May need column name fix or addition | **Verify/Update schema** |

---

## 📞 Next Steps

1. **Backend team**: 
   - Check database schema
   - Identify actual column name
   - Fix backend code
   - Test locally

2. **QA team**:
   - Test after backend fix
   - Verify full workflow
   - Check edge cases

3. **DevOps** (if needed):
   - Deploy backend fix
   - Run migrations if needed

---

## 🏷️ Metadata
- **Severity**: 🔴 HIGH (Core functionality broken)
- **Component**: Admin Payout Management
- **Type**: Backend Database Error
- **Status**: 🔴 OPEN - Waiting for backend fix
- **Assignee**: Backend team
- **Created**: 2024-10-19
- **Updated**: 2024-10-19

---

**This is a backend issue. Frontend is working correctly.**
