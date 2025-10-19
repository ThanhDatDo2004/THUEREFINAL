# 📦 Triển Khai Tính Năng "Những Đơn Đã Rút" - Chi Tiết

## 📋 Tổng Quan

Tính năng này cho phép shop xem lịch sử lệ rút tiền trên trang **Doanh Thu Và Rút Tiền** (`/shop/revenue`). Giao diện được thiết kế với UX/UI tốt nhất, responsive trên cả desktop và mobile.

---

## 🔄 Các File Thay Đổi

### 1️⃣ `src/pages/shop/ShopRevenuePage.tsx`

#### Thay Đổi Chính:

**A. Import mới:**

```typescript
import {
  createPayoutRequestApi,
  getWalletInfoApi,
  getPayoutRequestsApi, // ← Mới
  type PayoutRequest, // ← Mới
} from "../../models/wallet.api";

import {
  Send,
  Calendar,
  Clock,
  DollarSign,
  TrendingUp,
  History, // ← Icon lịch sử
  X, // ← Icon đóng
  AlertCircle, // ← Icon cảnh báo
  CheckCircle, // ← Icon thành công
  Clock as ClockIcon,
} from "lucide-react";
```

**B. State mới:**

```typescript
// Payout Requests state
const [showPayoutRequests, setShowPayoutRequests] = useState(false);
const [payoutRequests, setPayoutRequests] = useState<PayoutRequest[]>([]);
const [payoutRequestsLoading, setPayoutRequestsLoading] = useState(false);
```

**C. Hàm mới:**

```typescript
// Fetch payout requests từ API
const handleFetchPayoutRequests = async () => {
  setPayoutRequestsLoading(true);
  try {
    const response = await getPayoutRequestsApi();
    if (response.data) {
      const payoutData = response.data.data || response.data.list || [];
      setPayoutRequests(payoutData);
    }
  } catch (error) {
    console.error("Error fetching payout requests:", error);
  } finally {
    setPayoutRequestsLoading(false);
  }
};

// Mở modal payout requests
const handleOpenPayoutRequests = () => {
  setShowPayoutRequests(true);
  handleFetchPayoutRequests();
};

// Get status badge color, icon, và label
const getStatusBadge = (status: string) => {
  switch (status) {
    case "paid":
      return {
        bgColor: "bg-green-100",
        textColor: "text-green-800",
        icon: CheckCircle,
        label: "Đã Thanh Toán",
      };
    case "processing":
      return {
        bgColor: "bg-blue-100",
        textColor: "text-blue-800",
        icon: ClockIcon,
        label: "Đang Xử Lý",
      };
    case "requested":
      return {
        bgColor: "bg-yellow-100",
        textColor: "text-yellow-800",
        icon: Clock,
        label: "Chờ Duyệt",
      };
    case "rejected":
      return {
        bgColor: "bg-red-100",
        textColor: "text-red-800",
        icon: AlertCircle,
        label: "Bị Từ Chối",
      };
    default:
      return {
        bgColor: "bg-gray-100",
        textColor: "text-gray-800",
        icon: Clock,
        label: status,
      };
  }
};
```

**D. UI Mới:**

1. **Nút "Những Đơn Đã Rút":**

```typescript
<button
  onClick={handleOpenPayoutRequests}
  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-semibold rounded-lg transition shadow-md hover:shadow-lg"
>
  <History className="w-5 h-5" />
  Những Đơn Đã Rút
</button>
```

2. **Modal Lịch Sử Rút Tiền:**
   - Fixed position overlay
   - Header với gradient indigo
   - Close button [X]
   - Desktop table view (6 cột)
   - Mobile card view
   - Loading spinner
   - Empty state message
   - Footer button "Đóng"

**E. Auto-refresh Logic:**

```typescript
// Khi tạo đơn rút mới, nếu modal mở thì tự động refresh
if (showPayoutRequests) {
  handleFetchPayoutRequests();
}
```

### 2️⃣ `src/models/wallet.api.ts`

#### Thay Đổi:

**A. Cập nhật `PayoutRequest` interface:**

```typescript
export interface PayoutRequest {
  PayoutID: number;
  ShopCode: number;
  ShopName: string;
  Amount: number;
  Status: "requested" | "processing" | "paid" | "rejected";
  BankName: string;
  AccountNumber: string;
  RequestedAt: string;
  Note?: string; // ← Mới
  RejectionReason?: string; // ← Mới
  CreateAt: string; // ← Mới
}
```

**B. Cập nhật `PayoutRequestsResponse` interface:**

```typescript
export interface PayoutRequestsResponse {
  data: PayoutRequest[];
  list?: PayoutRequest[]; // ← Thêm fallback
  pagination: {
    limit: number;
    offset: number;
    total: number;
  };
}
```

---

## 🎨 UI/UX Components

### Button "Những Đơn Đã Rút"

- **Màu**: Gradient Indigo (indigo-500 → indigo-600)
- **Icon**: History (📋)
- **Position**: Bên cạnh nút "Rút Tiền"
- **Behavior**: Click → Modal mở

### Modal Header

- **Gradient**: Indigo (50% → 100%)
- **Title**: "Lịch Sử Rút Tiền"
- **Icon**: History (larger)
- **Close Button**: [X] ở góc phải

### Table (Desktop View)

```
┌───────┬──────────┬────────────┬────────┬──────────────┬──────────┐
│ Mã Đơn│ Số Tiền  │ Trạng Thái │ Ghi Chú│ Lý Do Từ Chối│ Ngày Tạo │
├───────┼──────────┼────────────┼────────┼──────────────┼──────────┤
│ #1    │ 5M       │ ✓ Đã TT    │ ...    │ -            │ 19/10/24 │
│ #2    │ 3M       │ ⏱ Chờ DUyệt│ ...    │ -            │ 18/10/24 │
│ #3    │ 2M       │ ❌ Từ chối │ ...    │ Lỗi TK       │ 17/10/24 │
└───────┴──────────┴────────────┴────────┴──────────────┴──────────┘
```

### Cards (Mobile View)

```
┌─────────────────────────────┐
│ #1                 ✓ Đã TT  │
│ 5,000,000đ                  │
│                             │
│ GHI CHÚ                     │
│ Rút tiền đơn #BK001         │
│                             │
│ NGÀY TẠO                    │
│ 19/10/2024 10:30            │
└─────────────────────────────┘
```

### Status Badges

| Status       | Color      | Icon | Label         |
| ------------ | ---------- | ---- | ------------- |
| `requested`  | Vàng       | 🕐   | Chờ Duyệt     |
| `processing` | Xanh dương | 🕐   | Đang Xử Lý    |
| `paid`       | Xanh lá    | ✓    | Đã Thanh Toán |
| `rejected`   | Đỏ         | ⚠️   | Bị Từ Chối    |

---

## 📱 Responsive Design

### Desktop (md+)

- Bảng đầy đủ 6 cột
- Hover effects trên rows
- Sticky header

### Mobile (<md)

- Card view stack dọc
- Large typography
- Full width cards
- Touch-friendly buttons

---

## 🔌 API Integration

### Endpoint

```
GET /shops/me/payout-requests?limit=10&offset=0
```

### Query Parameters

- `limit`: Số lượng records (default: 10)
- `offset`: Vị trí bắt đầu (default: 0)
- `status` (optional): Lọc theo trạng thái

### Response Format

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
  },
  "error": null
}
```

---

## 🎯 User Flow

### 1. Xem Lịch Sử Rút Tiền

```
User click "Những Đơn Đã Rút"
    ↓
Modal opens + Loading spinner shows
    ↓
API fetch: GET /shops/me/payout-requests
    ↓
Data received + Spinner disappears
    ↓
Table/Cards populated with data
    ↓
User can:
  - Scroll bảng/cards xem tất cả đơn
  - View status, amount, notes, rejection reasons
  - Click [Đóng] hoặc [X] để đóng modal
```

### 2. Tạo Đơn Rút Mới (Auto-Refresh)

```
User submits payout form
    ↓
Payout created successfully
    ↓
If modal is open:
  - handleFetchPayoutRequests() called
  - New payout appears in list
```

---

## ✅ Validation & Error Handling

### Loading States

- Modal opens → Loading spinner shows
- Data fetches → Spinner disappears

### Error States

- API error → Console logs error, modal shows empty state

### Empty States

- No payouts → Shows "📭 Chưa có đơn rút tiền nào"
- Message: "Hãy tạo một đơn rút tiền để bắt đầu"

---

## 🧪 Test Scenarios

### Scenario 1: Happy Path

```
✓ Click "Những Đơn Đã Rút"
✓ Modal opens
✓ Data loads
✓ Table/Cards show correctly
✓ Status badges display correctly
✓ Numbers formatted as VNĐ
✓ Dates formatted correctly
✓ Click [Đóng] → Modal closes
```

### Scenario 2: Empty State

```
✓ Click "Những Đơn Đã Rút"
✓ Modal opens
✓ No data returned
✓ Empty state message shows
```

### Scenario 3: With Rejection Reason

```
✓ One payout with Status: "rejected"
✓ RejectionReason field populated
✓ Red badge showing rejection reason
```

### Scenario 4: Auto-Refresh

```
✓ Modal open
✓ Create new payout in background
✓ Modal list auto-refreshes
✓ New payout appears in list
```

### Scenario 5: Mobile View

```
✓ Open on mobile
✓ Card view shows (not table)
✓ Info readable and well-formatted
✓ Status badge visible
```

---

## 🚀 Deployment Checklist

- [x] Frontend code implemented
- [x] UI/UX designed
- [x] Responsive design implemented
- [x] API integration done
- [x] Error handling implemented
- [x] Empty states handled
- [ ] Backend API endpoint implemented
- [ ] Backend returns correct data format
- [ ] E2E testing completed
- [ ] Performance tested

---

## 📞 Support

Nếu có issue:

1. Kiểm tra browser console cho errors
2. Kiểm tra API response format
3. Đảm bảo PayoutRequest data đầy đủ các fields
4. Kiểm tra backend logs

---

## 📚 Tài Liệu Liên Quan

- `PAYOUT_REQUESTS_FEATURE.md` - Hướng dẫn chi tiết tính năng
- `PAYOUT_REQUESTS_QUICK_START.md` - Quick start guide
