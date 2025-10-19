# 📋 Tính Năng "Những Đơn Đã Rút" - README

## 🎯 Giới Thiệu

Tính năng này cho phép shop xem lịch sử toàn bộ các đơn rút tiền của họ trên trang **Doanh Thu Và Rút Tiền** (`http://localhost:5173/shop/revenue`).

Giao diện được thiết kế với UX/UI tốt nhất, responsive hoàn toàn trên cả desktop và mobile, với các trạng thái rõ ràng và dễ hiểu.

---

## 🚀 Cách Sử Dụng

### 1. Truy Cập Trang

Đi đến: **http://localhost:5173/shop/revenue**

### 2. Click Nút "Những Đơn Đã Rút"

- Tìm nút button màu **Indigo** cạnh nút "Rút Tiền"
- Click vào nút

### 3. Xem Danh Sách

- Modal sẽ mở lên
- Danh sách tất cả đơn rút tiền sẽ hiển thị
- **Desktop**: Table view với 6 cột
- **Mobile**: Card view với thông tin chi tiết

### 4. Đóng Modal

- Click nút **[Đóng]** ở dưới cùng
- Hoặc click **[✕]** ở góc phải header

---

## 📊 Thông Tin Hiển Thị

Mỗi đơn rút tiền sẽ hiển thị:

| Trường            | Mô Tả                                                                     |
| ----------------- | ------------------------------------------------------------------------- |
| **Mã Đơn**        | ID của đơn rút (ví dụ: #1, #2, #3)                                        |
| **Số Tiền**       | Số tiền rút (định dạng VNĐ: 5,000,000đ)                                   |
| **Trạng Thái**    | Badge màu sắc với icon (Chờ Duyệt, Đang Xử Lý, Đã Thanh Toán, Bị Từ Chối) |
| **Ghi Chú**       | Nội dung ghi chú về đơn rút                                               |
| **Lý Do Từ Chối** | Nếu đơn bị từ chối, sẽ hiển thị lý do (chỉ hiển thị nếu bị từ chối)       |
| **Ngày Tạo**      | Ngày và giờ tạo đơn (DD/MM/YYYY HH:mm)                                    |

---

## 🎨 Trạng Thái Đơn Rút

### 1. 🟡 **Chờ Duyệt** (Requested)

- **Màu**: Vàng
- **Icon**: ⏱
- **Ý Nghĩa**: Đơn vừa được tạo, đang chờ admin duyệt

### 2. 🔵 **Đang Xử Lý** (Processing)

- **Màu**: Xanh dương
- **Icon**: 🔄
- **Ý Nghĩa**: Admin đã duyệt, đơn đang được xử lý (chuyển tiền)

### 3. 🟢 **Đã Thanh Toán** (Paid)

- **Màu**: Xanh lá
- **Icon**: ✓
- **Ý Nghĩa**: Tiền đã được chuyển thành công vào tài khoản ngân hàng

### 4. 🔴 **Bị Từ Chối** (Rejected)

- **Màu**: Đỏ
- **Icon**: ❌
- **Ý Nghĩa**: Đơn bị từ chối, có lý do cụ thể hiển thị ở cột "Lý Do Từ Chối"

---

## 💻 Giao Diện Trên Desktop

```
┌─────────────────────────────────────────────────────────────────────────┐
│ 📋 Lịch Sử Rút Tiền                                              [✕]   │
├─────────────────────────────────────────────────────────────────────────┤
│  Mã Đơn │ Số Tiền     │ Trạng Thái      │ Ghi Chú    │ Lý Do    │ Ngày │
├─────────┼─────────────┼────────────────┼────────────┼──────────┼──────┤
│ #1      │ 5,000,000đ  │ ✓ Đã Thanh Toán│ Rút #BK001│    -     │19/10 │
│ #2      │ 3,000,000đ  │ ⏱ Chờ Duyệt    │ Rút #BK002│    -     │18/10 │
│ #3      │ 2,000,000đ  │ ❌ Bị Từ Chối   │ Rút #BK003│ Số TK sai│17/10 │
└─────────┴─────────────┴────────────────┴────────────┴──────────┴──────┘
```

---

## 📱 Giao Diện Trên Mobile

Trên di động, mỗi đơn rút được hiển thị dưới dạng **card** với layout dọc:

```
┌────────────────────────────┐
│ #1          ✓ Đã Thanh Toán │
│ 5,000,000đ                  │
│                             │
│ GHI CHÚ                     │
│ Rút tiền đơn #BK001         │
│                             │
│ NGÀY TẠO                    │
│ 19/10/2024 10:30            │
└────────────────────────────┘
```

---

## 🔄 Tự Động Làm Mới

Khi bạn **tạo đơn rút tiền mới** và modal **"Lịch Sử Rút Tiền"** đang mở:

- Danh sách sẽ tự động refresh
- Đơn mới nhất sẽ xuất hiện ở danh sách ngay lập tức
- Không cần reload trang

---

## 📋 Tình Huống Sử Dụng

### Scenario 1: Xem Lịch Sử Rút Tiền

1. Click "Những Đơn Đã Rút"
2. Modal mở lên, loading spinner hiển thị
3. Dữ liệu load xong
4. Xem danh sách tất cả đơn rút

### Scenario 2: Kiểm Tra Trạng Thái Rút Tiền

1. Vừa tạo đơn rút mới
2. Click "Những Đơn Đã Rút"
3. Xem trạng thái: Chờ Duyệt
4. Chờ admin duyệt

### Scenario 3: Đơn Bị Từ Chối

1. Click "Những Đơn Đã Rút"
2. Tìm đơn với status "Bị Từ Chối"
3. Xem lý do từ chối ở cột "Lý Do Từ Chối"
4. Có thể tạo đơn mới với thông tin đúng

### Scenario 4: Tracking Tiền

1. Click "Những Đơn Đã Rút"
2. Tìm đơn với status "Đang Xử Lý"
3. Chờ chuyển sang "Đã Thanh Toán"

---

## ❌ Trường Hợp Empty State

**Khi không có đơn rút nào:**

- Hiển thị icon 📭
- Message: "Chưa có đơn rút tiền nào"
- Sub-message: "Hãy tạo một đơn rút tiền để bắt đầu"

---

## 📝 Ghi Chú

### Cột "Lý Do Từ Chối" - Chỉ Hiển Thị Khi:

- Đơn có status = "rejected" (Bị Từ Chối)
- Có nội dung lý do cụ thể

**Các lý do có thể gặp:**

- "Số tài khoản không đúng"
- "Tài khoản bị khóa"
- "Thông tin ngân hàng không hợp lệ"
- ...

---

## 🔄 Làm Mới Danh Sách

Có 2 cách để làm mới danh sách:

### Cách 1: Đóng và mở lại modal

1. Click [Đóng]
2. Click "Những Đơn Đã Rút" lại
3. Danh sách sẽ được load lại

### Cách 2: Tạo đơn mới

1. Modal đang mở
2. Tạo đơn rút mới (Fill form "Tạo Đơn Rút Tiền")
3. Danh sách sẽ tự động refresh
4. Đơn mới sẽ xuất hiện

---

## 💡 Tips & Tricks

### Tip 1: Xem Nhanh Trạng Thái

- Chỉ nhìn vào **badge màu sắc**, không cần đọc chi tiết
- Xanh = Thành công ✓
- Vàng = Đang chờ ⏱
- Đỏ = Có vấn đề ❌

### Tip 2: Tìm Đơn Cũ

- Danh sách hiển thị từ mới nhất (phía trên) đến cũ nhất (phía dưới)
- Scroll down để xem các đơn cũ

### Tip 3: Check Lý Do Từ Chối

- Nếu đơn bị từ chối, lý do sẽ nằm ở cột "Lý Do Từ Chối"
- Đọc kỹ lý do để tránh tạo đơn sai lần tiếp theo

### Tip 4: Số Tiền

- Các số tiền đều được format VNĐ
- Có dấu phân cách hàng ngàn (ví dụ: 5,000,000đ)

---

## ⚠️ Chú Ý

1. **Không thể sửa đơn**: Khi đơn đã tạo, không thể sửa trực tiếp từ danh sách này

   - Nếu sai, cần tạo đơn mới

2. **Không thể xóa đơn**: Danh sách lịch sử không thể xóa được

   - Để dữ liệu lưu trữ

3. **Kết nối Internet**: Cần kết nối internet để tải danh sách

   - Nếu lỗi, reload trang

4. **Thông Tin Ngân Hàng**: Ngân hàng nhận tiền mặc định là tài khoản đầu tiên được setup
   - Nếu muốn thay đổi, vào mục **Cài Đặt**

---

## 🆘 Troubleshooting

### Modal không mở

- ✓ Kiểm tra kết nối internet
- ✓ Reload trang
- ✓ Thử lại

### Danh sách rỗng

- ✓ Bạn chưa tạo đơn rút nào
- ✓ Tạo đơn mới bằng nút "Rút Tiền"

### Số tiền hiển thị sai

- ✓ Reload trang
- ✓ Kiểm tra kết nối

### Lỗi loading

- ✓ Kiểm tra console browser (F12)
- ✓ Kiểm tra kết nối internet
- ✓ Contact admin

---

## 📞 Hỗ Trợ

Nếu có vấn đề:

1. Kiểm tra lại các bước trên
2. Xem file documentation: `PAYOUT_REQUESTS_*.md`
3. Contact admin/backend team

---

## 🎓 Phiên Bản

- **Version**: 1.0
- **Release Date**: 19/10/2024
- **Status**: Stable ✅

---

**Enjoy using the payout history feature! 🎉**
