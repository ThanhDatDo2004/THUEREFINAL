import React, { useEffect, useMemo, useState } from "react";
import {
  getAdminPayoutRequestsApi,
  approvePayoutRequestApi,
  rejectPayoutRequestApi,
  type AdminPayoutRequest,
} from "../../models/admin.api";
import {
  Check,
  X,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader,
  Wallet,
  Wallet2,
  ShieldCheck,
  DollarSign,
} from "lucide-react";

type PayoutStatus = "requested" | "processing" | "paid" | "rejected";

const STATUS_LABELS: Record<PayoutStatus, string> = {
  requested: "Yêu cầu",
  processing: "Đang xử lý",
  paid: "Đã thanh toán",
  rejected: "Từ chối",
};

const STATUS_COLORS: Record<PayoutStatus, string> = {
  requested: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  processing: "bg-sky-50 text-sky-700 ring-1 ring-sky-200",
  paid: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  rejected: "bg-rose-50 text-rose-700 ring-1 ring-rose-200",
};

const FILTER_OPTIONS: Array<{
  value: "all" | PayoutStatus;
  label: string;
  description: string;
}> = [
  { value: "all", label: "Tất cả", description: "Mọi yêu cầu" },
  { value: "requested", label: "Yêu cầu mới", description: "Chờ duyệt" },
  { value: "processing", label: "Đang xử lý", description: "Đã tiến hành" },
  { value: "paid", label: "Đã thanh toán", description: "Hoàn tất" },
  { value: "rejected", label: "Đã từ chối", description: "Không hợp lệ" },
];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    minimumFractionDigits: 0,
  }).format(value);

const formatDateTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return `${date.toLocaleDateString("vi-VN")} · ${date.toLocaleTimeString(
    "vi-VN",
    {
      hour: "2-digit",
      minute: "2-digit",
    }
  )}`;
};

const AdminPayoutRequestsPage: React.FC = () => {
  const [payouts, setPayouts] = useState<AdminPayoutRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"all" | PayoutStatus>("all");
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  // Fetch payout requests
  useEffect(() => {
    let ignore = false;
    (async () => {
      setLoading(true);
      try {
        const response = await getAdminPayoutRequestsApi(
          statusFilter === "all" ? undefined : statusFilter,
          undefined,
          100
        );
        if (!ignore) {
          setPayouts(response.data?.data || []);
        }
      } catch (error) {
        console.error("Error fetching payouts:", error);
        if (!ignore) setPayouts([]);
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, [statusFilter]);

  // Statistics
  const stats = useMemo(() => {
    return {
      total: payouts.length,
      requested: payouts.filter((p) => p.Status === "requested").length,
      processing: payouts.filter((p) => p.Status === "processing").length,
      paid: payouts.filter((p) => p.Status === "paid").length,
      rejected: payouts.filter((p) => p.Status === "rejected").length,
      totalAmount: payouts.reduce((sum, p) => sum + p.Amount, 0),
    };
  }, [payouts]);

  // Handle approve
  const handleApprove = async (payoutID: number) => {
    setActionLoading(payoutID);
    try {
      await approvePayoutRequestApi(payoutID);
      // Refresh list
      const response = await getAdminPayoutRequestsApi(
        statusFilter === "all" ? undefined : statusFilter
      );
      setPayouts(response.data?.data || []);
    } catch (error: any) {
      // Check if error is UpdateAt column related - this might be a false error
      // because backend may have successfully updated Status but failed on UpdateAt
      if (
        error.message?.includes("UpdateAt") ||
        error.message?.includes("Unknown column")
      ) {
        console.warn(
          "Update error detected, checking if approval actually went through..."
        );

        try {
          // Refresh list to check if status was actually updated
          const response = await getAdminPayoutRequestsApi(
            statusFilter === "all" ? undefined : statusFilter
          );
          setPayouts(response.data?.data || []);

          // Check if the payout status actually changed to 'paid'
          const updatedPayout = response.data?.data?.find(
            (p) => p.PayoutID === payoutID
          );
          if (updatedPayout?.Status === "paid") {
            // Status was actually updated despite the error!
            alert(
              "✅ Yêu cầu rút tiền đã được duyệt (lỗi timestamp là không quan trọng)"
            );
            return;
          }
        } catch (refreshError) {
          console.error("Error refreshing list:", refreshError);
        }
      }

      // If we get here, it's a real error
      alert("Lỗi duyệt yêu cầu: " + error.message);
    } finally {
      setActionLoading(null);
    }
  };

  // Handle reject
  const handleReject = async (payoutID: number) => {
    const reason = prompt("Nhập lý do từ chối:");
    if (!reason) return;

    setActionLoading(payoutID);
    try {
      await rejectPayoutRequestApi(payoutID, { reason });
      // Refresh list
      const response = await getAdminPayoutRequestsApi(
        statusFilter === "all" ? undefined : statusFilter
      );
      setPayouts(response.data?.data || []);
    } catch (error: any) {
      alert("Lỗi từ chối yêu cầu: " + error.message);
    } finally {
      setActionLoading(null);
    }
  };

  const heroStats = [
    {
      label: "Tổng yêu cầu",
      value: stats.total,
      accent: "bg-white/20",
      icon: Wallet,
      tone: "text-white",
    },
    {
      label: "Đang xử lý",
      value: stats.processing,
      accent: "bg-emerald-500/20",
      icon: ShieldCheck,
      tone: "text-emerald-50",
    },
    {
      label: "Đã thanh toán",
      value: stats.paid,
      accent: "bg-sky-500/20",
      icon: Wallet2,
      tone: "text-sky-50",
    },
    {
      label: "Tổng tiền",
      value: formatCurrency(stats.totalAmount),
      accent: "bg-amber-500/20",
      icon: DollarSign,
      tone: "text-amber-50",
    },
  ];

  return (
    <div className="flex w-full min-w-0 flex-col gap-6">
      <section className="rounded-3xl border border-emerald-100 bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-600 text-white shadow-lg">
        <div className="space-y-6 p-6 md:p-8">
          <div className="space-y-2">
            <p className="inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-white/90">
              <Wallet className="h-3.5 w-3.5" />
              Trung tâm xử lý payout
            </p>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold leading-tight md:text-4xl">
                  Quản lý yêu cầu rút tiền
                </h1>
                <p className="text-sm text-white/80 md:text-base">
                  Theo dõi trạng thái xử lý, giảm thời gian chờ và đảm bảo dòng
                  tiền minh bạch cho từng shop.
                </p>
              </div>
              <div className="rounded-2xl bg-white/15 px-4 py-3 text-sm text-white/90">
                {statusFilter === "all"
                  ? "Hiển thị mọi yêu cầu"
                  : `Đang lọc: ${STATUS_LABELS[statusFilter]}`}
                <div className="text-xs text-white/70">
                  {stats.total} yêu cầu trong bộ lọc hiện tại
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {heroStats.map(({ label, value, accent, icon: Icon, tone }) => (
              <div
                key={label}
                className="rounded-2xl border border-white/20 bg-white/10 p-4"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`flex h-10 w-10 items-center justify-center rounded-xl ${accent}`}
                  >
                    <Icon className={`h-5 w-5 ${tone}`} />
                  </span>
                  <div>
                    <p className="text-sm text-white/70">{label}</p>
                    <p className="text-2xl font-semibold">{value}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-slate-600">
              Lọc theo trạng thái
            </p>
            <p className="text-xs text-slate-500">
              Chọn trạng thái để tập trung xử lý nhanh hơn.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {FILTER_OPTIONS.map((option) => {
              const isActive = statusFilter === option.value;
              return (
                <button
                  key={option.value}
                  onClick={() => setStatusFilter(option.value)}
                  className={`flex flex-col rounded-xl border px-3 py-2 text-left text-sm transition ${
                    isActive
                      ? "border-emerald-400 bg-emerald-50 text-emerald-700 shadow-sm"
                      : "border-slate-200 text-slate-600 hover:border-slate-300"
                  }`}
                >
                  <span className="font-semibold">
                    {option.label}
                    {option.value !== "all"
                      ? ` (${stats[option.value] ?? 0})`
                      : ""}
                  </span>
                  <span className="text-xs text-slate-500">
                    {option.description}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="min-w-0 rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Danh sách yêu cầu
            </h2>
            <p className="text-xs text-slate-500">
              {stats.total} yêu cầu · Tổng tiền{" "}
              <span className="font-semibold text-emerald-600">
                {formatCurrency(stats.totalAmount)}
              </span>
            </p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
            <Clock className="h-4 w-4 text-amber-500" />
            Cập nhật {new Date().toLocaleTimeString("vi-VN")}
          </span>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-500">
            <Loader className="h-6 w-6 animate-spin text-emerald-500" />
            <span className="ml-2 text-sm">Đang tải dữ liệu...</span>
          </div>
        ) : payouts.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-center text-sm text-slate-500">
            <AlertCircle className="h-10 w-10 text-slate-300" />
            Không tìm thấy yêu cầu nào khớp bộ lọc.
          </div>
        ) : (
          <div className="-mx-4 overflow-x-auto px-4">
            <table className="min-w-full divide-y divide-slate-100 text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 text-left">Mã yêu cầu</th>
                  <th className="px-4 py-3 text-left">Shop</th>
                  <th className="px-4 py-3 text-left">Ngân hàng</th>
                  <th className="px-4 py-3 text-right">Số tiền</th>
                  <th className="px-4 py-3 text-center">Trạng thái</th>
                  <th className="px-4 py-3 text-left">Ngày yêu cầu</th>
                  <th className="px-4 py-3 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {payouts.map((payout) => (
                  <tr key={payout.PayoutID} className="hover:bg-slate-50/80">
                    <td className="px-4 py-4 font-mono text-sm font-semibold text-slate-900">
                      #{payout.PayoutID}
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-semibold text-slate-900">
                        {payout.ShopName}
                      </p>
                      <p className="text-xs text-slate-500">
                        Shop #{payout.ShopCode}
                      </p>
                    </td>
                    <td className="px-4 py-4 text-xs">
                      <div className="rounded-xl bg-slate-50 px-3 py-2">
                        <p className="font-medium text-slate-900">
                          {payout.BankName}
                        </p>
                        <p className="font-mono text-slate-600">
                          {payout.AccountNumber}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right font-semibold text-slate-900">
                      {formatCurrency(payout.Amount)}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span
                        className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${STATUS_COLORS[payout.Status as PayoutStatus]}`}
                      >
                        <span className="h-2 w-2 rounded-full bg-current" />
                        {STATUS_LABELS[payout.Status as PayoutStatus]}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-xs text-slate-500">
                      {formatDateTime(payout.RequestedAt)}
                    </td>
                    <td className="px-4 py-4 text-center">
                      {payout.Status === "requested" ? (
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleApprove(payout.PayoutID)}
                            disabled={actionLoading === payout.PayoutID}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 transition hover:bg-emerald-100 disabled:opacity-50"
                            title="Duyệt"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleReject(payout.PayoutID)}
                            disabled={actionLoading === payout.PayoutID}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-rose-50 text-rose-600 transition hover:bg-rose-100 disabled:opacity-50"
                            title="Từ chối"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : payout.Status === "processing" ? (
                        <Clock className="mx-auto h-5 w-5 text-amber-500" />
                      ) : payout.Status === "paid" ? (
                        <CheckCircle className="mx-auto h-5 w-5 text-emerald-600" />
                      ) : (
                        <AlertCircle className="mx-auto h-5 w-5 text-rose-500" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

export default AdminPayoutRequestsPage;
