import React, { useEffect, useMemo, useState } from "react";
import {
  fetchAdminShopRequests,
  fetchAdminShops,
  fetchAdminRevenue,
} from "../../models/admin.api";
import type { ShopRequests, Shops, ShopRevenue } from "../../types";
import {
  CreditCard,
  Wallet,
  RefreshCcw,
  Filter,
  Download,
} from "lucide-react";

type TransactionStatus = "approved" | "pending" | "rejected" | "reviewed";

const STATUS_LABELS: Record<TransactionStatus, string> = {
  approved: "Đã chi",
  pending: "Đang duyệt",
  rejected: "Từ chối",
  reviewed: "Đang xem xét",
};

const AdminTransactionsPage: React.FC = () => {
  const [requests, setRequests] = useState<ShopRequests[]>([]);
  const [shops, setShops] = useState<Shops[]>([]);
  const [revenue, setRevenue] = useState<ShopRevenue[]>([]);
  const [statusFilter, setStatusFilter] = useState<"all" | TransactionStatus>(
    "all"
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    (async () => {
      setLoading(true);
      try {
        const [req, sh, rev] = await Promise.all([
          fetchAdminShopRequests(),
          fetchAdminShops(),
          fetchAdminRevenue(new Date().getFullYear()).catch(() => []),
        ]);
        if (!ignore) {
          setRequests(req);
          setShops(sh);
          setRevenue(rev ?? []);
        }
      } catch (error) {
        console.error(error);
        if (!ignore) {
          setRequests([]);
          setShops([]);
          setRevenue([]);
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, []);

  const payoutTotals = useMemo(() => {
    const totalRevenue = revenue.reduce(
      (sum, entry) => sum + (entry.Balance ?? 0),
      0
    );
    const approved = requests.filter((r) => r.status === "approved").length;
    const pending = requests.filter((r) => r.status === "pending").length;
    return {
      totalRevenue,
      approved,
      pending,
      averagePerShop: shops.length ? totalRevenue / shops.length : 0,
    };
  }, [revenue, requests, shops]);

  const derivedTransactions = useMemo(() => {
    const withStatus = requests.map((req) => {
      const status = (req.status ?? "pending") as TransactionStatus;
      const amountBase =
        payoutTotals.averagePerShop > 0
          ? payoutTotals.averagePerShop
          : 350_000;
      const simulatedAmount =
        amountBase +
        ((req.request_id % 4) - 2) * 55_000 +
        Math.max(0, (req.request_id % 6) * 12_000);
      return {
        id: req.request_id,
        shopName: req.full_name || req.address || "—",
        requestedAt: req.created_at,
        status,
        amount: Math.max(120_000, Math.round(simulatedAmount)),
        account: req.email,
        note: req.message,
      };
    });

    return withStatus
      .filter((item) =>
        statusFilter === "all" ? true : item.status === statusFilter
      )
      .sort((a, b) => (b.requestedAt ?? "").localeCompare(a.requestedAt ?? ""));
  }, [requests, statusFilter, payoutTotals.averagePerShop]);

  const handleExport = () => {
    const header = ["ID", "Shop", "Ngày yêu cầu", "Trạng thái", "Số tiền"];
    const rows = derivedTransactions.map((row) => [
      row.id,
      row.shopName,
      row.requestedAt,
      STATUS_LABELS[row.status] ?? row.status,
      row.amount.toLocaleString("vi-VN"),
    ]);
    const csv = [header, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "transactions.csv");
    document.body.appendChild(link);
    link.click();
    link.parentNode?.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="shop-header">
        <div>
          <h1 className="shop-title">Transactions</h1>
          <p className="shop-sub">
            Theo dõi số liệu chi trả cho shop, yêu cầu rút tiền và trạng thái
            xử lý.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="btn-outline flex items-center gap-2"
            onClick={() => window.location.reload()}
          >
            <RefreshCcw className="h-4 w-4" />
            Tải lại
          </button>
          <button
            type="button"
            className="btn-primary flex items-center gap-2"
            onClick={handleExport}
          >
            <Download className="h-4 w-4" />
            Xuất CSV
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="stat-card">
          <div className="stat-icon">
            <Wallet size={18} />
          </div>
          <div className="stat-value">
            {payoutTotals.totalRevenue
              ? payoutTotals.totalRevenue.toLocaleString("vi-VN")
              : "—"}
          </div>
          <div className="stat-label">Tổng lợi nhuận năm</div>
          <div className="stat-sub">
            Trung bình mỗi shop:{" "}
            {payoutTotals.averagePerShop
              ? payoutTotals.averagePerShop.toLocaleString("vi-VN")
              : "—"}
            ₫
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <CreditCard size={18} />
          </div>
          <div className="stat-value">{payoutTotals.approved}</div>
          <div className="stat-label">Giao dịch đã chi</div>
          <div className="stat-sub">Yêu cầu đã hoàn tất</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <Filter size={18} />
          </div>
          <div className="stat-value">{payoutTotals.pending}</div>
          <div className="stat-label">Đang chờ xử lý</div>
          <div className="stat-sub">Ưu tiên xử lý trong 24h tới</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <RefreshCcw size={18} />
          </div>
          <div className="stat-value">{derivedTransactions.length}</div>
          <div className="stat-label">Giao dịch hiển thị</div>
          <div className="stat-sub">Theo bộ lọc hiện tại</div>
        </div>
      </div>

      <div className="section space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Danh sách giao dịch
            </h3>
            <p className="text-sm text-gray-500">
              Dữ liệu dựa trên yêu cầu mở shop và giả lập chi trả hiện tại.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-600">
              Trạng thái
            </label>
            <select
              className="input h-10 w-40"
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as typeof statusFilter)
              }
            >
              <option value="all">Tất cả</option>
              <option value="approved">Đã chi</option>
              <option value="pending">Đang duyệt</option>
              <option value="reviewed">Đang xem xét</option>
              <option value="rejected">Từ chối</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto w-full">
          <table className="table min-w-[780px]">
            <thead>
              <tr>
                <th className="th">ID</th>
                <th className="th">Shop / Người yêu cầu</th>
                <th className="th">Ngày tạo</th>
                <th className="th">Trạng thái</th>
                <th className="th">Số tiền (ước tính)</th>
                <th className="th">Ghi chú</th>
              </tr>
            </thead>
            <tbody>
              {derivedTransactions.map((txn) => (
                <tr key={txn.id}>
                  <td className="td font-medium text-gray-900">
                    #{txn.id}
                  </td>
                  <td className="td">
                    <p className="font-medium text-gray-900">
                      {txn.shopName}
                    </p>
                    <p className="text-xs text-gray-500">{txn.account}</p>
                  </td>
                  <td className="td text-sm text-gray-600">
                    {txn.requestedAt
                      ? new Date(txn.requestedAt).toLocaleString("vi-VN")
                      : "—"}
                  </td>
                  <td className="td">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        txn.status === "approved"
                          ? "bg-emerald-100 text-emerald-700"
                          : txn.status === "rejected"
                          ? "bg-rose-100 text-rose-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {STATUS_LABELS[txn.status] ?? txn.status}
                    </span>
                  </td>
                  <td className="td text-sm font-semibold text-gray-900">
                    {txn.amount.toLocaleString("vi-VN")}₫
                  </td>
                  <td className="td text-sm text-gray-600">
                    {txn.note || "—"}
                  </td>
                </tr>
              ))}
              {!derivedTransactions.length && (
                <tr>
                  <td className="td text-center text-gray-500" colSpan={6}>
                    Không có giao dịch phù hợp.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {loading && (
        <div className="flex items-center gap-3 text-sm text-gray-500">
          <div className="spinner" />
          Đang tải dữ liệu giao dịch...
        </div>
      )}
    </div>
  );
};

export default AdminTransactionsPage;
