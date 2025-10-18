# 📊 Shop Bookings Page - Chi Tiết Tính Năng

## 🎨 Giao Diện

### Header
```
┌─────────────────────────────────────┐
│ 📅 Đơn đặt sân                     │
└─────────────────────────────────────┘
```

### Filter Bar
```
┌────────────────────────────────────────────────────────────┐
│ Trạng thái thanh toán: [▼ Tất cả (28)                    ] │
│                        - Chờ thanh toán (8)               │
│                        - Đã thanh toán (20)               │
│                        - Thất bại (0)                     │
└────────────────────────────────────────────────────────────┘
```

### Table Columns
```
┌──────┬──────────┬──────────┬────────┬──────────┬────────┬────────────┬──────────┐
│ Mã   │ Sân      │ Khách    │ Ngày   │ Giờ      │ Tiền   │ Thanh toán │ Trạng thái│
├──────┼──────────┼──────────┼────────┼──────────┼────────┼────────────┼──────────┤
│ BK-1 │ Sân 1    │ Văn A    │20/10/25│14:00-15:00│200,000đ│ ✅ Paid    │ Đúng giờ  │
│ BK-2 │ Sân 2    │ Hằng B   │20/10/25│15:00-16:00│150,000đ│ ⏳ Pending │ Chưa xác nhận
│ BK-3 │ Sân 3    │ Phú C    │21/10/25│10:00-11:00│180,000đ│ ✅ Paid    │ Đúng giờ  │
└──────┴──────────┴──────────┴────────┴──────────┴────────┴────────────┴──────────┘
```

### Pagination
```
Hiển thị 1 đến 10 trong 28 đơn
[◀] [1] [2] [3] [4] [▶]
     ▲ (Active page - xanh)
```

## 🎯 Tính Năng Chi Tiết

### 1. Status Filter (Dropdown)
**Mục đích**: Lọc đơn đặt theo trạng thái thanh toán

**Tùy chọn**:
- `all` → Tất cả đơn đặt
- `pending` → Đơn chờ thanh toán  
- `paid` → Đơn đã thanh toán
- `failed` → Đơn thất bại

**Hành động**:
- Khi thay đổi filter → Pagination reset về trang 1
- Count tự động cập nhật dựa trên dữ liệu thực

**Ví dụ**:
```
"Tất cả (28)" → Click "Chờ thanh toán"
→ Filter = "pending"
→ Hiển thị chỉ 8 đơn pending
→ Pagination: [1] (1 trang)
```

### 2. Pagination (10 items/page)

**Cấu trúc**:
```
[Previous] [Page Numbers] [Next]
```

**Chi tiết**:
- Previous button: Disable nếu trang = 1
- Next button: Disable nếu trang = totalPages
- Page number: Active page highlight xanh
- Info text: "Hiển thị X đến Y trong Z đơn"

**Ví dụ**:
```
Trang 1: Hiển thị 1-10 trong 28
Trang 2: Hiển thị 11-20 trong 28  
Trang 3: Hiển thị 21-28 trong 28
```

### 3. Data Formatting

#### PlayDate → dd/MM/yyyy
```javascript
Input:  "2025-10-20T10:00:00Z"
Output: "20/10/2025"
```

#### Time → HH:mm - HH:mm
```javascript
Input:  start_time="14:00", end_time="15:00"
Output: "14:00 - 15:00"
```

#### Price → VND Format + "đ"
```javascript
Input:  200000
Output: "200,000đ"

Logic: new Intl.NumberFormat("vi-VN").format(200000) + "đ"
```

#### PaymentStatus → Icon + Label
```javascript
"paid"    → "✅ Đã thanh toán"
"pending" → "⏳ Chờ thanh toán"
"failed"  → "❌ Thất bại" (hoặc capitalize)
```

### 4. Responsive Design

**Desktop** (lg+):
- Table full width
- Sidebar 280px + Content 1fr
- All columns visible

**Tablet** (md):
- Table may scroll horizontally
- Sidebar 280px (collapsed to 84px)
- Pagination vertical or horizontal

**Mobile** (sm):
- Sidebar hidden (button to toggle)
- Table scrolls horizontally
- Pagination buttons stack

## 🔄 Data Flow

```
1. Component Mount
   ↓
2. Fetch Shop + Fields + Bookings (parallel)
   ↓
3. Store in state:
   - bookings: Bookings[]
   - statusFilter: "all"|"pending"|"paid"|"failed"
   - currentPage: number
   ↓
4. useMemo: Filter bookings by statusFilter
   ↓
5. useMemo: Paginate filtered bookings
   ↓
6. Render: Table with paginated data
   ↓
7. User interaction:
   - Change filter → Reset pagination
   - Click page → Update currentPage
   - Change page → Paginated view updates
```

## 📝 State Structure

```typescript
const [shop, setShop] = useState<Shops | null>(null);
const [fields, setFields] = useState<FieldWithImages[]>([]);
const [bookings, setBookings] = useState<Bookings[]>([]);
const [loading, setLoading] = useState(true);
const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "paid" | "failed">("all");
const [currentPage, setCurrentPage] = useState(1);

// Computed values (useMemo)
const filteredBookings = bookings.filter(...)
const paginatedBookings = filteredBookings.slice(...)
const totalPages = Math.ceil(filteredBookings.length / ITEMS_PER_PAGE)
```

## 🎨 Styling Classes

**Wrapper**:
- `.table-wrap`: Table container
- `.space-y-4`: Spacing between sections

**Filter Bar**:
- `.p-4`: Padding
- `.bg-white`: White background
- `.rounded-lg`: Rounded corners
- `.border border-gray-200`: Gray border

**Table**:
- `.table`: Base table styles
- `.border-b`: Row borders
- `.hover:bg-gray-50`: Row hover effect
- `.py-3 px-4`: Cell padding

**Pagination**:
- `.flex items-center gap-2`: Flexbox layout
- `.w-8 h-8`: Button size
- `.rounded-lg`: Rounded buttons
- `.bg-blue-600`: Active page highlight

## 🚀 Performance Optimizations

1. **useMemo for Filtering**: Recalculate only when bookings or statusFilter changes
2. **useMemo for Pagination**: Recalculate only when filteredBookings or currentPage changes
3. **Cleanup Function**: Abort requests on unmount
4. **Parallel Loading**: fetchShopFields + fetchMyShopBookings via Promise.all()

## 🔐 Security

- ✅ Bearer token sent automatically (via axios interceptor)
- ✅ User check: `if (!user?.user_code) return`
- ✅ Type-safe: Full TypeScript support

## 🌐 Internationalization

- ✅ Vietnamese labels
- ✅ VND currency format
- ✅ Date format: dd/MM/yyyy (Vietnamese standard)
- ✅ Responsive to locale: `new Intl.NumberFormat("vi-VN")`

---

**Ready for Production** ✅
