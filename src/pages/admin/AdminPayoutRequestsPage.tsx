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
} from "lucide-react";

type PayoutStatus = "requested" | "processing" | "paid" | "rejected";

const STATUS_LABELS: Record<PayoutStatus, string> = {
  requested: "Yêu cầu",
  processing: "Đang xử lý",
  paid: "Đã thanh toán",
  rejected: "Từ chối",
};

const STATUS_COLORS: Record<PayoutStatus, string> = {
  requested: "bg-yellow-100 text-yellow-800",
  processing: "bg-blue-100 text-blue-800",
  paid: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
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

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          💰 Yêu Cầu Rút Tiền
        </h1>
        <p className="text-gray-600 mt-2">
          Quản lý các yêu cầu rút tiền từ shop
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg p-4 shadow border-l-4 border-blue-500">
          <p className="text-gray-600 text-sm font-medium">Tổng cộng</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{stats.total}</p>
        </div>
        <div className="bg-white rounded-lg p-4 shadow border-l-4 border-yellow-500">
          <p className="text-gray-600 text-sm font-medium">Yêu cầu mới</p>
          <p className="text-2xl font-bold text-yellow-600 mt-1">
            {stats.requested}
          </p>
        </div>
        <div className="bg-white rounded-lg p-4 shadow border-l-4 border-blue-500">
          <p className="text-gray-600 text-sm font-medium">Đang xử lý</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">
            {stats.processing}
          </p>
        </div>
        <div className="bg-white rounded-lg p-4 shadow border-l-4 border-green-500">
          <p className="text-gray-600 text-sm font-medium">Đã thanh toán</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{stats.paid}</p>
        </div>
        <div className="bg-white rounded-lg p-4 shadow border-l-4 border-red-500">
          <p className="text-gray-600 text-sm font-medium">Tổng tiền</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">
            {new Intl.NumberFormat("vi-VN").format(stats.totalAmount)}đ
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {(["all", "requested", "processing", "paid", "rejected"] as const).map(
          (status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                statusFilter === status
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              {status === "all" ? "Tất cả" : STATUS_LABELS[status]}
            </button>
          )
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : payouts.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Không có yêu cầu rút tiền</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-blue-50 to-blue-100 border-b-2 border-blue-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Mã Yêu Cầu
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Shop
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Thông Tin Ngân Hàng
                  </th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">
                    Số Tiền
                  </th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">
                    Trạng Thái
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Ngày Yêu Cầu
                  </th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">
                    Hành Động
                  </th>
                </tr>
              </thead>
              <tbody>
                {payouts.map((payout) => (
                  <tr
                    key={payout.PayoutID}
                    className="border-b border-gray-200 hover:bg-blue-50 transition"
                  >
                    <td className="px-6 py-4 font-mono text-sm font-semibold text-blue-600">
                      #{payout.PayoutID}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-800">
                        {payout.ShopName}
                      </div>
                      <div className="text-xs text-gray-500">
                        Shop #{payout.ShopCode}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="bg-blue-50 rounded p-2 space-y-1">
                        <div>
                          <span className="font-medium">Ngân hàng:</span>{" "}
                          {payout.BankName}
                        </div>
                        <div>
                          <span className="font-medium">Số TK:</span>{" "}
                          {payout.AccountNumber}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-semibold text-gray-800">
                      {new Intl.NumberFormat("vi-VN").format(payout.Amount)}đ
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          STATUS_COLORS[payout.Status as PayoutStatus]
                        }`}
                      >
                        {STATUS_LABELS[payout.Status as PayoutStatus]}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(payout.RequestedAt).toLocaleDateString("vi-VN")}{" "}
                      {new Date(payout.RequestedAt).toLocaleTimeString("vi-VN")}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {payout.Status === "requested" && (
                        <div className="flex gap-2 justify-center">
                          <button
                            onClick={() => handleApprove(payout.PayoutID)}
                            disabled={actionLoading === payout.PayoutID}
                            className="p-2 bg-green-100 text-green-600 hover:bg-green-200 rounded transition disabled:opacity-50"
                            title="Duyệt"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleReject(payout.PayoutID)}
                            disabled={actionLoading === payout.PayoutID}
                            className="p-2 bg-red-100 text-red-600 hover:bg-red-200 rounded transition disabled:opacity-50"
                            title="Từ chối"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                      {payout.Status === "processing" && (
                        <Clock className="w-5 h-5 text-blue-600 mx-auto" />
                      )}
                      {payout.Status === "paid" && (
                        <CheckCircle className="w-5 h-5 text-green-600 mx-auto" />
                      )}
                      {payout.Status === "rejected" && (
                        <AlertCircle className="w-5 h-5 text-red-600 mx-auto" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPayoutRequestsPage;
