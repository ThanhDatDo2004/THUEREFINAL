import React, { useEffect, useState } from "react";
import {
  getAdminPayoutRequestsApi,
  approvePayoutRequestApi,
  rejectPayoutRequestApi,
  AdminPayoutRequest,
} from "../../models/admin.api";
import { extractErrorMessage } from "../../models/api.helpers";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import Layout from "../../components/layouts/Layout";
import { CheckCircle, XCircle, Eye, Filter } from "lucide-react";

interface AdminPayoutState {
  loading: boolean;
  error: string | null;
  payouts: AdminPayoutRequest[];
  totalPayouts: number;
  statusFilter: "all" | "requested" | "processing" | "paid" | "rejected";
  currentPage: number;
  selectedPayout: AdminPayoutRequest | null;
  showDetailModal: boolean;
  approving: boolean;
  rejecting: boolean;
  rejectionReason: string;
}

const AdminPayoutManagement: React.FC = () => {
  const [state, setState] = useState<AdminPayoutState>({
    loading: true,
    error: null,
    payouts: [],
    totalPayouts: 0,
    statusFilter: "all",
    currentPage: 0,
    selectedPayout: null,
    showDetailModal: false,
    approving: false,
    rejecting: false,
    rejectionReason: "",
  });

  const itemsPerPage = 10;

  // Load payouts
  useEffect(() => {
    loadPayouts();
  }, [state.statusFilter, state.currentPage]);

  const loadPayouts = async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      const status = state.statusFilter === "all" ? undefined : state.statusFilter;
      const response = await getAdminPayoutRequestsApi(
        status as any,
        undefined,
        itemsPerPage,
        state.currentPage * itemsPerPage
      );

      if (response.success && response.data) {
        setState((prev) => ({
          ...prev,
          payouts: response.data.data,
          totalPayouts: response.data.pagination.total,
          loading: false,
        }));
      }
    } catch (err: unknown) {
      const errorMsg = extractErrorMessage(err, "Failed to load payouts");
      setState((prev) => ({ ...prev, error: errorMsg, loading: false }));
    }
  };

  const handleApprove = async (payout: AdminPayoutRequest) => {
    if (!confirm(`Bạn có chắc chắn muốn duyệt yêu cầu rút tiền ${payout.Amount.toLocaleString("vi-VN")}₫?`)) {
      return;
    }

    try {
      setState((prev) => ({ ...prev, approving: true }));
      await approvePayoutRequestApi(payout.PayoutID);
      setState((prev) => ({
        ...prev,
        approving: false,
        showDetailModal: false,
      }));
      alert("Yêu cầu rút tiền đã được duyệt");
      await loadPayouts();
    } catch (err: unknown) {
      const errorMsg = extractErrorMessage(err, "Failed to approve payout");
      setState((prev) => ({ ...prev, approving: false }));
      alert(errorMsg);
    }
  };

  const handleReject = async (payout: AdminPayoutRequest) => {
    if (!state.rejectionReason.trim()) {
      alert("Vui lòng nhập lý do từ chối");
      return;
    }

    try {
      setState((prev) => ({ ...prev, rejecting: true }));
      await rejectPayoutRequestApi(payout.PayoutID, {
        reason: state.rejectionReason,
      });
      setState((prev) => ({
        ...prev,
        rejecting: false,
        showDetailModal: false,
        rejectionReason: "",
      }));
      alert("Yêu cầu rút tiền đã bị từ chối");
      await loadPayouts();
    } catch (err: unknown) {
      const errorMsg = extractErrorMessage(err, "Failed to reject payout");
      setState((prev) => ({ ...prev, rejecting: false }));
      alert(errorMsg);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "requested":
        return "bg-yellow-100 text-yellow-800";
      case "processing":
        return "bg-blue-100 text-blue-800";
      case "paid":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (state.loading && state.payouts.length === 0) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <LoadingSpinner />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Quản Lý Rút Tiền
            </h1>
            <p className="text-gray-600">
              Duyệt và quản lý các yêu cầu rút tiền từ cửa hàng
            </p>
          </div>

          {/* Error Message */}
          {state.error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-600">{state.error}</p>
            </div>
          )}

          {/* Filter */}
          <div className="mb-6 flex gap-2">
            {(["all", "requested", "processing", "paid", "rejected"] as const).map(
              (status) => (
                <button
                  key={status}
                  onClick={() =>
                    setState((prev) => ({
                      ...prev,
                      statusFilter: status,
                      currentPage: 0,
                    }))
                  }
                  className={`px-4 py-2 rounded-lg font-semibold transition ${
                    state.statusFilter === status
                      ? "bg-blue-600 text-white"
                      : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {status === "all" && "Tất Cả"}
                  {status === "requested" && "Yêu Cầu"}
                  {status === "processing" && "Đang Xử Lý"}
                  {status === "paid" && "Đã Duyệt"}
                  {status === "rejected" && "Từ Chối"}
                </button>
              )
            )}
          </div>

          {/* Payouts Table */}
          {state.payouts.length > 0 ? (
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                        ID
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                        Cửa Hàng
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                        Số Tiền
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                        Ngân Hàng
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                        Trạng Thái
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                        Ngày Yêu Cầu
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                        Hành Động
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {state.payouts.map((payout) => (
                      <tr key={payout.PayoutID} className="hover:bg-gray-50">
                        <td className="px-6 py-4 font-mono text-sm text-gray-900">
                          #{payout.PayoutID}
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-semibold text-gray-900">
                              {payout.ShopName}
                            </p>
                            <p className="text-sm text-gray-500">
                              Shop #{payout.ShopCode}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-bold text-lg text-blue-600">
                            {payout.Amount.toLocaleString("vi-VN")}₫
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-semibold text-gray-900">
                              {payout.BankName}
                            </p>
                            <p className="text-sm text-gray-500">
                              {payout.AccountNumber}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusBadgeColor(
                              payout.Status
                            )}`}
                          >
                            {payout.Status === "requested" && "Yêu Cầu"}
                            {payout.Status === "processing" && "Đang Xử Lý"}
                            {payout.Status === "paid" && "Đã Duyệt"}
                            {payout.Status === "rejected" && "Từ Chối"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {new Date(payout.RequestedAt).toLocaleDateString("vi-VN")}
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() =>
                              setState((prev) => ({
                                ...prev,
                                selectedPayout: payout,
                                showDetailModal: true,
                              }))
                            }
                            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-semibold"
                          >
                            <Eye className="w-5 h-5" />
                            Chi Tiết
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Load More */}
              {state.payouts.length < state.totalPayouts && (
                <div className="p-6 border-t border-gray-200 text-center">
                  <button
                    onClick={() =>
                      setState((prev) => ({
                        ...prev,
                        currentPage: prev.currentPage + 1,
                      }))
                    }
                    disabled={state.loading}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-2 px-6 rounded-lg transition"
                  >
                    {state.loading ? "Đang Tải..." : "Xem Thêm"}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <p className="text-gray-600 text-lg">Không có yêu cầu rút tiền nào</p>
            </div>
          )}

          {/* Detail Modal */}
          {state.showDetailModal && state.selectedPayout && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-8">
                  {/* Header */}
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">
                        Chi Tiết Yêu Cầu Rút Tiền
                      </h2>
                      <p className="text-gray-600">ID: {state.selectedPayout.PayoutID}</p>
                    </div>
                    <button
                      onClick={() =>
                        setState((prev) => ({
                          ...prev,
                          showDetailModal: false,
                          rejectionReason: "",
                        }))
                      }
                      className="text-gray-500 hover:text-gray-700 text-2xl"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 pb-8 border-b">
                    <div>
                      <p className="text-gray-600 text-sm mb-1">Cửa Hàng</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {state.selectedPayout.ShopName}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600 text-sm mb-1">Số Tiền</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {state.selectedPayout.Amount.toLocaleString("vi-VN")}₫
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600 text-sm mb-1">Ngân Hàng</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {state.selectedPayout.BankName}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600 text-sm mb-1">Tài Khoản</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {state.selectedPayout.AccountNumber}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600 text-sm mb-1">Trạng Thái</p>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusBadgeColor(
                          state.selectedPayout.Status
                        )}`}
                      >
                        {state.selectedPayout.Status === "requested" && "Yêu Cầu"}
                        {state.selectedPayout.Status === "processing" && "Đang Xử Lý"}
                        {state.selectedPayout.Status === "paid" && "Đã Duyệt"}
                        {state.selectedPayout.Status === "rejected" && "Từ Chối"}
                      </span>
                    </div>
                    <div>
                      <p className="text-gray-600 text-sm mb-1">Ngày Yêu Cầu</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {new Date(state.selectedPayout.RequestedAt).toLocaleString("vi-VN")}
                      </p>
                    </div>
                  </div>

                  {/* Rejection Reason (if rejecting) */}
                  {state.selectedPayout.Status === "requested" && (
                    <div className="mb-8">
                      <label className="block text-gray-700 font-semibold mb-3">
                        Lý Do Từ Chối (Nếu Từ Chối)
                      </label>
                      <textarea
                        value={state.rejectionReason}
                        onChange={(e) =>
                          setState((prev) => ({
                            ...prev,
                            rejectionReason: e.target.value,
                          }))
                        }
                        placeholder="Nhập lý do từ chối..."
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none"
                        rows={4}
                      />
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-3">
                    {state.selectedPayout.Status === "requested" && (
                      <>
                        <button
                          onClick={() => handleApprove(state.selectedPayout!)}
                          disabled={state.approving}
                          className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition"
                        >
                          <CheckCircle className="w-5 h-5" />
                          {state.approving ? "Đang Duyệt..." : "Duyệt"}
                        </button>
                        <button
                          onClick={() => handleReject(state.selectedPayout!)}
                          disabled={state.rejecting}
                          className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition"
                        >
                          <XCircle className="w-5 h-5" />
                          {state.rejecting ? "Đang Từ Chối..." : "Từ Chối"}
                        </button>
                      </>
                    )}
                    <button
                      onClick={() =>
                        setState((prev) => ({
                          ...prev,
                          showDetailModal: false,
                          rejectionReason: "",
                        }))
                      }
                      className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-900 font-semibold py-3 px-4 rounded-lg transition"
                    >
                      Đóng
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default AdminPayoutManagement;
