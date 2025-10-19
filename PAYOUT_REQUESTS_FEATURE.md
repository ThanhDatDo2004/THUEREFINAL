# 📋 Tính Năng Xem Danh Sách Các Đơn Rút Tiền

## Tổng Quan

Tính năng này cho phép shop xem lịch sử toàn bộ các đơn rút tiền của họ trên trang **Doanh Thu Và Rút Tiền** (`/shop/revenue`).

---

## 🎯 Nút "Những Đơn Đã Rút"

### Vị Trí

- Nằm trên trang **Shop Revenue** bên cạnh nút **"Rút Tiền"**
- Màu sắc: **Indigo** (để phân biệt với nút "Rút Tiền" màu xanh)
- Icon: **History** (biểu tượng lịch sử)

### Chức Năng

- Khi click vào nút, sẽ mở một **Modal** hiển thị lịch sử tất cả các đơn rút tiền

---

## 📊 Modal "Lịch Sử Rút Tiền"

### Nội Dung Hiển Thị

#### Trên Desktop (Bảng - Table View)

Bảng hiển thị 6 cột:

| Cột               | Mô Tả                                          |
| ----------------- | ---------------------------------------------- |
| **Mã Đơn**        | PayoutID (định dạng: `#123`)                   |
| **Số Tiền**       | Số tiền rút (định dạng VNĐ với dấu phân cách)  |
| **Trạng Thái**    | Badge với màu sắc và icon                      |
| **Ghi Chú**       | Nội dung ghi chú (nếu có)                      |
| **Lý Do Từ Chối** | Lý do từ chối (chỉ hiển thị nếu bị từ chối)    |
| **Ngày Tạo**      | Ngày giờ tạo đơn (định dạng: DD/MM/YYYY HH:mm) |

#### Trên Mobile (Card View)

Mỗi đơn rút được hiển thị dưới dạng card với:

- **Mã đơn** và **Số tiền** nổi bật ở phía trên
- **Trạng thái** (badge) ở góc phải
- Các thông tin khác bên dưới (ghi chú, lý do từ chối, ngày tạo)

---

## 🎨 Các Trạng Thái và Màu Sắc

### Trạng Thái "requested" (Chờ Duyệt)

- **Màu**: Vàng (`bg-yellow-100`, `text-yellow-800`)
- **Icon**: Clock (đồng hồ)
- **Label**: "Chờ Duyệt"

### Trạng Thái "processing" (Đang Xử Lý)

- **Màu**: Xanh dương (`bg-blue-100`, `text-blue-800`)
- **Icon**: Clock (đồng hồ)
- **Label**: "Đang Xử Lý"

### Trạng Thái "paid" (Đã Thanh Toán)

- **Màu**: Xanh lá (`bg-green-100`, `text-green-800`)
- **Icon**: CheckCircle (vòng tròn xanh)
- **Label**: "Đã Thanh Toán"

### Trạng Thái "rejected" (Bị Từ Chối)

- **Màu**: Đỏ (`bg-red-100`, `text-red-800`)
- **Icon**: AlertCircle (cảnh báo)
- **Label**: "Bị Từ Chối"

---

## 💻 Chi Tiết Kỹ Thuật

### State Management

```typescript
// Trạng thái modal
const [showPayoutRequests, setShowPayoutRequests] = useState(false);

// Danh sách các đơn rút
const [payoutRequests, setPayoutRequests] = useState<PayoutRequest[]>([]);

// Trạng thái loading
const [payoutRequestsLoading, setPayoutRequestsLoading] = useState(false);
```

### API Được Sử Dụng

- **Endpoint**: `GET /shops/me/payout-requests`
- **Function**: `getPayoutRequestsApi()`
- **Response**:
  ```typescript
  {
    data: {
      data: PayoutRequest[],
      pagination: { limit, offset, total }
    }
  }
  ```

### Cấu Trúc Dữ Liệu `PayoutRequest`

```typescript
interface PayoutRequest {
  PayoutID: number; // ID của đơn rút
  ShopCode: number; // Mã shop
  ShopName: string; // Tên shop
  Amount: number; // Số tiền rút
  Status: "requested" | "processing" | "paid" | "rejected"; // Trạng thái
  BankName: string; // Tên ngân hàng
  AccountNumber: string; // Số tài khoản
  RequestedAt: string; // Thời gian yêu cầu
  Note?: string; // Ghi chú
  RejectionReason?: string; // Lý do từ chối (nếu bị từ chối)
  CreateAt: string; // Thời gian tạo
}
```

---

## 🔄 Tương Tác

### Khi Click "Những Đơn Đã Rút"

1. Modal mở lên
2. Dữ liệu được fetch từ API
3. Loading spinner hiển thị
4. Khi dữ liệu sẵn sàng, hiển thị danh sách

### Khi Click "Đóng" hoặc Đóng Modal

- Modal sẽ đóng

### Auto-Refresh

- Khi tạo đơn rút tiền mới, nếu modal đã mở thì danh sách sẽ tự động refresh để hiển thị đơn mới nhất

---

## 🎯 UX/UI Highlights

### ✅ Responsive Design

- Desktop: Bảng chi tiết
- Mobile: Card view dễ đọc

### ✅ Clear Status Indication

- Mỗi trạng thái có icon và màu riêng biệt
- Dễ nhận diện tại một cái nhìn

### ✅ Error Handling

- Nếu không có dữ liệu: Hiển thị "Chưa có đơn rút tiền nào"
- Loading state rõ ràng

### ✅ Formatting

- Số tiền hiển thị định dạng VNĐ
- Ngày giờ định dạng: DD/MM/YYYY HH:mm

### ✅ Visual Hierarchy

- Modal header gradient
- Sticky header trên table
- Hover effects trên rows/cards

---

## 📝 Ghi Chú

- **Backend sẽ xử lý việc lấy dữ liệu từ bảng `Payout_Requests`**
- Frontend chỉ quản lý:
  - Hiển thị dữ liệu
  - Format và styling
  - Modal state
  - Data fetching

---

## 🚀 Tương Lai

- Có thể thêm filter theo trạng thái
- Có thể thêm search/sort chức năng
- Có thể thêm export dữ liệu
- Có thể thêm pagination cho danh sách dài
