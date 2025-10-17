import React, { useEffect, useState } from "react";
import { DollarSign, TrendingUp, TrendingDown, ArrowRight, Plus } from "lucide-react";
import {
  getWalletInfoApi,
  getWalletTransactionsApi,
  WalletInfo,
  WalletTransaction,
} from "../../models/wallet.api";
import { extractErrorMessage } from "../../models/api.helpers";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import Layout from "../../components/layouts/Layout";

interface WalletState {
  loading: boolean;
  error: string | null;
  walletInfo: WalletInfo | null;
  transactions: WalletTransaction[];
  totalTransactions: number;
  currentPage: number;
}

const WalletDashboard: React.FC = () => {
  const [state, setState] = useState<WalletState>({
    loading: true,
    error: null,
    walletInfo: null,
    transactions: [],
    totalTransactions: 0,
    currentPage: 0,
  });

  const itemsPerPage = 10;

  // Fetch wallet info and transactions
  useEffect(() => {
    const fetchData = async () => {
      try {
        setState((prev) => ({ ...prev, loading: true, error: null }));

        // Fetch wallet info
        const walletResponse = await getWalletInfoApi();
        if (!walletResponse.success || !walletResponse.data) {
          throw new Error("Failed to fetch wallet info");
        }

        // Fetch transactions
        const transactionsResponse = await getWalletTransactionsApi(
          undefined,
          itemsPerPage,
          0
        );
        if (!transactionsResponse.success || !transactionsResponse.data) {
          throw new Error("Failed to fetch transactions");
        }

        setState((prev) => ({
          ...prev,
          walletInfo: walletResponse.data,
          transactions: transactionsResponse.data.data,
          totalTransactions: transactionsResponse.data.pagination.total,
          loading: false,
        }));
      } catch (err: unknown) {
        const errorMsg = extractErrorMessage(err, "Failed to load wallet data");
        setState((prev) => ({ ...prev, error: errorMsg, loading: false }));
      }
    };

    fetchData();
  }, []);

  const handleLoadMore = async () => {
    try {
      const nextPage = state.currentPage + 1;
      const transactionsResponse = await getWalletTransactionsApi(
        undefined,
        itemsPerPage,
        nextPage * itemsPerPage
      );

      if (transactionsResponse.success && transactionsResponse.data) {
        setState((prev) => ({
          ...prev,
          transactions: [...prev.transactions, ...transactionsResponse.data.data],
          currentPage: nextPage,
        }));
      }
    } catch (err: unknown) {
      const errorMsg = extractErrorMessage(err, "Failed to load more transactions");
      alert(errorMsg);
    }
  };

  if (state.loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <LoadingSpinner />
        </div>
      </Layout>
    );
  }

  const wallet = state.walletInfo;
  const totalPages = Math.ceil(state.totalTransactions / itemsPerPage);

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Ví Của Tôi</h1>
            <p className="text-gray-600">Quản lý số dư và lịch sử giao dịch</p>
          </div>

          {/* Error Message */}
          {state.error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-800 font-semibold">Lỗi</p>
              <p className="text-red-600">{state.error}</p>
            </div>
          )}

          {/* Wallet Cards Grid */}
          {wallet && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* Balance Card */}
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Số Dư Hiện Tại</h3>
                  <DollarSign className="w-8 h-8 opacity-80" />
                </div>
                <p className="text-4xl font-bold">{wallet.balance.toLocaleString("vi-VN")}₫</p>
                <p className="text-blue-100 text-sm mt-2">Có sẵn để rút</p>
              </div>

              {/* Total Credit Card */}
              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Tổng Thu Nhập</h3>
                  <TrendingUp className="w-8 h-8 opacity-80" />
                </div>
                <p className="text-4xl font-bold">{wallet.totalCredit.toLocaleString("vi-VN")}₫</p>
                <p className="text-green-100 text-sm mt-2">Từ các đặt sân</p>
              </div>

              {/* Total Debit Card */}
              <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-lg shadow-lg p-6 text-white">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Tổng Rút Tiền</h3>
                  <TrendingDown className="w-8 h-8 opacity-80" />
                </div>
                <p className="text-4xl font-bold">{wallet.totalDebit.toLocaleString("vi-VN")}₫</p>
                <p className="text-red-100 text-sm mt-2">Đã rút ra</p>
              </div>

              {/* Available Card */}
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Có Sẵn Rút</h3>
                  <ArrowRight className="w-8 h-8 opacity-80" />
                </div>
                <p className="text-4xl font-bold">{wallet.available.toLocaleString("vi-VN")}₫</p>
                <p className="text-purple-100 text-sm mt-2">Sẵn sàng xử lý</p>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <a
              href="/shop/payout-requests"
              className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition"
            >
              <Plus className="w-5 h-5" />
              Tạo Yêu Cầu Rút Tiền
            </a>
            <a
              href="/shop/payout-history"
              className="flex items-center justify-center gap-2 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition"
            >
              <ArrowRight className="w-5 h-5" />
              Xem Lịch Sử Rút Tiền
            </a>
          </div>

          {/* Transaction History */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Lịch Sử Giao Dịch</h2>
              <p className="text-gray-600 text-sm mt-1">
                Hiển thị {state.transactions.length} / {state.totalTransactions} giao dịch
              </p>
            </div>

            {/* Table */}
            {state.transactions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                        Loại Giao Dịch
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                        Số Tiền
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                        Trạng Thái
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                        Ghi Chú
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                        Ngày
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {state.transactions.map((transaction) => (
                      <tr key={transaction.WalletTxnID} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {transaction.Type === "credit_settlement" && (
                              <TrendingUp className="w-5 h-5 text-green-600" />
                            )}
                            {transaction.Type === "debit_payout" && (
                              <TrendingDown className="w-5 h-5 text-red-600" />
                            )}
                            <span className="font-semibold text-gray-900">
                              {transaction.Type === "credit_settlement" && "Thu Nhập"}
                              {transaction.Type === "debit_payout" && "Rút Tiền"}
                              {transaction.Type === "adjustment" && "Điều Chỉnh"}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`font-bold ${
                              transaction.Type === "credit_settlement"
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {transaction.Type === "credit_settlement" ? "+" : "-"}
                            {transaction.Amount.toLocaleString("vi-VN")}₫
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-semibold ${
                              transaction.Status === "completed"
                                ? "bg-green-100 text-green-800"
                                : transaction.Status === "pending"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {transaction.Status === "completed" && "Hoàn Thành"}
                            {transaction.Status === "pending" && "Đang Chờ"}
                            {transaction.Status === "failed" && "Thất Bại"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{transaction.Note}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {new Date(transaction.CreateAt).toLocaleDateString("vi-VN")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-6 text-center text-gray-600">
                <p>Chưa có giao dịch nào</p>
              </div>
            )}

            {/* Load More Button */}
            {state.transactions.length < state.totalTransactions && (
              <div className="p-6 border-t border-gray-200 text-center">
                <button
                  onClick={handleLoadMore}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition"
                >
                  Xem Thêm
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default WalletDashboard;
