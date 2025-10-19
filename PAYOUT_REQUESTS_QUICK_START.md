# 🚀 Quick Start - Tính Năng "Những Đơn Đã Rút"

## 📌 Thay Đổi Chính

### 1. **File Thay Đổi**

- `src/pages/shop/ShopRevenuePage.tsx` - Cập nhật component
- `src/models/wallet.api.ts` - Cập nhật interface

### 2. **Các Tính Năng Mới Thêm**

#### ✅ Nút "Những Đơn Đã Rút"

- Thêm nút button màu indigo bên cạnh nút "Rút Tiền"
- Click để mở modal xem lịch sử

#### ✅ Modal "Lịch Sử Rút Tiền"

- Hiển thị danh sách tất cả đơn rút tiền
- **Desktop**: Bảng với 6 cột (PayoutID, Amount, Status, Note, RejectionReason, CreateAt)
- **Mobile**: Card view responsive

#### ✅ Status Badges

- `requested` → Chờ Duyệt (Vàng)
- `processing` → Đang Xử Lý (Xanh dương)
- `paid` → Đã Thanh Toán (Xanh lá)
- `rejected` → Bị Từ Chối (Đỏ)

---

## 🔧 Các Bước Cài Đặt

### Step 1: Update Dependencies

Tất cả dependencies đã có sẵn, không cần cài thêm.

### Step 2: Cập Nhật API Model

Đã cập nhật `PayoutRequest` interface để bao gồm:

- `Note` (ghi chú đơn rút)
- `RejectionReason` (lý do từ chối nếu bị từ chối)
- `CreateAt` (thời gian tạo đơn)

### Step 3: Kiểm Tra Backend API

Đảm bảo backend có sẵn endpoint:

```
GET /shops/me/payout-requests?limit=10&offset=0
```

**Response Expected**:

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {
    "data": [
      {
        "PayoutID": 1,
        "ShopCode": 100,
        "ShopName": "Shop A",
        "Amount": 5000000,
        "Status": "paid",
        "BankName": "Vietcombank",
        "AccountNumber": "1234567890",
        "RequestedAt": "2024-10-19T10:30:00",
        "Note": "Rút tiền đơn #BK001",
        "RejectionReason": null,
        "CreateAt": "2024-10-19T10:30:00"
      }
    ],
    "pagination": {
      "limit": 10,
      "offset": 0,
      "total": 15
    }
  }
}
```

---

## 🎨 UI/UX Design

### Layout

```
┌─────────────────────────────────────────────┐
│  📊 Tóm Tắt Doanh Thu                       │
│  ┌─────────────┬─────────────┬──────────────┐
│  │ Tổng Tiền   │ Thực Thu    │ Có Sẵn Rút   │
│  │ 100,000,000 │ 95,000,000  │ 50,000,000   │
│  └─────────────┴─────────────┴──────────────┘
│                                             │
│  [Rút Tiền]  [Những Đơn Đã Rút]           │
└─────────────────────────────────────────────┘

Modal Khi Click "Những Đơn Đã Rút":

┌─────────────────────────────────────────────────────┐
│  📋 Lịch Sử Rút Tiền                             [X]│
├─────────────────────────────────────────────────────┤
│  Mã Đơn  │  Số Tiền    │  Trạng Thái │ ...         │
│  #1      │ 5,000,000đ  │  Đã Thanh   │ ...         │
│  #2      │ 3,000,000đ  │  Chờ Duyệt  │ ...         │
│  #3      │ 2,000,000đ  │  Bị Từ Chối │ ...         │
├─────────────────────────────────────────────────────┤
│                                        [Đóng]       │
└─────────────────────────────────────────────────────┘
```

---

## 🧪 Testing

### Test Cases

#### 1️⃣ Mở Modal

- [ ] Click nút "Những Đơn Đã Rút"
- [ ] Modal mở lên
- [ ] Loading spinner hiển thị
- [ ] Dữ liệu load xong

#### 2️⃣ Hiển Thị Dữ Liệu

- [ ] Desktop: Bảng hiển thị đúng tất cả 6 cột
- [ ] Mobile: Card view hiển thị rõ ràng
- [ ] Số tiền định dạng VNĐ đúng
- [ ] Ngày giờ định dạng đúng (DD/MM/YYYY HH:mm)

#### 3️⃣ Status Badges

- [ ] `requested` → Vàng + Clock icon
- [ ] `processing` → Xanh dương + Clock icon
- [ ] `paid` → Xanh lá + CheckCircle icon
- [ ] `rejected` → Đỏ + AlertCircle icon

#### 4️⃣ Lý Do Từ Chối

- [ ] Nếu có `RejectionReason`: Hiển thị với nền đỏ nhạt
- [ ] Nếu không có: Hiển thị "-"

#### 5️⃣ Đóng Modal

- [ ] Click nút [Đóng] → Modal đóng
- [ ] Click nút [X] → Modal đóng

#### 6️⃣ Auto-Refresh

- [ ] Tạo đơn rút mới
- [ ] Nếu modal mở → Danh sách tự động refresh
- [ ] Đơn mới xuất hiện trong danh sách

#### 7️⃣ Empty State

- [ ] Nếu không có đơn → Hiển thị icon 📭
- [ ] Hiển thị message "Chưa có đơn rút tiền nào"

---

## 📱 Responsive Breakpoints

- **Desktop** (md+): Bảng table
- **Mobile** (<md): Card view

---

## 🔌 API Integration

### `getPayoutRequestsApi()`

```typescript
// Function đã được update trong wallet.api.ts
export const getPayoutRequestsApi = async (
  status?: "requested" | "processing" | "paid" | "rejected",
  limit: number = 10,
  offset: number = 0
): Promise<IApiSuccessResponse<PayoutRequestsResponse>> => {
  const params: any = { limit, offset };
  if (status) params.status = status;
  const response = await api.get<IApiSuccessResponse<PayoutRequestsResponse>>(
    "/shops/me/payout-requests",
    { params }
  );
  return response.data;
};
```

---

## 📝 Notes

### ✅ Đã Hoàn Thành

- ✓ UI/UX design cho modal
- ✓ Responsive design (desktop + mobile)
- ✓ Status badges với icons
- ✓ Data formatting (tiền, ngày giờ)
- ✓ Modal state management
- ✓ API integration
- ✓ Error handling (empty state)

### ⏳ Backend Cần Làm

- API endpoint: `GET /shops/me/payout-requests`
- Response format theo specification trên

---

## 🎯 Future Enhancements

1. Filter theo status
2. Search/Sort
3. Export PDF/CSV
4. Pagination
5. Detail modal cho từng đơn
6. Retry button cho đơn bị từ chối
