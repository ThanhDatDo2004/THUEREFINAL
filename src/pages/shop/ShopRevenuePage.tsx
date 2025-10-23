import React, { useEffect, useState, useMemo } from "react";
import { useAuth } from "../../contexts/AuthContext";
import {
  fetchMyShop,
  fetchShopBookingsForRevenue,
  fetchShopBankAccounts,
  type ShopBookingItem,
  type ShopBankAccount,
} from "../../models/shop.api";
import {
  createPayoutRequestApi,
  getWalletInfoApi,
  getPayoutRequestsApi,
  type PayoutRequest,
} from "../../models/wallet.api";
import {
  Send,
  Calendar,
  Clock,
  DollarSign,
  TrendingUp,
  History,
  X,
  AlertCircle,
  CheckCircle,
  Clock as ClockIcon,
} from "lucide-react";

const ShopRevenuePage: React.FC = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<ShopBookingItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Payout form state
  const [showPayoutForm, setShowPayoutForm] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState<string>("");
  const [payoutPassword, setPayoutPassword] = useState<string>("");
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [payoutError, setPayoutError] = useState<string>("");
  const [payoutSuccess, setPayoutSuccess] = useState(false);

  // Bank account state
  const [bankAccounts, setBankAccounts] = useState<ShopBankAccount[]>([]);

  // Wallet state
  const [wallet, setWallet] = useState<{ available: number } | null>(null);

  // Payout Requests state
  const [showPayoutRequests, setShowPayoutRequests] = useState(false);
  const [payoutRequests, setPayoutRequests] = useState<PayoutRequest[]>([]);
  const [payoutRequestsLoading, setPayoutRequestsLoading] = useState(false);

  // Fetch data
  useEffect(() => {
    let ignore = false;
    (async () => {
      if (!user?.user_code) return;
      setLoading(true);
      try {
        const s = await fetchMyShop();
        if (ignore) return;
        // Removed as per edit hint

        if (s) {
          // Fetch all bookings and filter on client side
          const allBookings = await fetchShopBookingsForRevenue();
          if (!ignore) {
            // Filter for confirmed bookings with paid payment status
            const confirmedPaidBookings = allBookings.filter(
              (b) =>
                b.BookingStatus === "confirmed" && b.PaymentStatus === "paid"
            );
            setBookings(confirmedPaidBookings);
          }

          // Fetch bank accounts
          const bankAccountsData = await fetchShopBankAccounts();
          if (!ignore) {
            setBankAccounts(
              Array.isArray(bankAccountsData) ? bankAccountsData : []
            );
          }

          // Fetch wallet info
          const walletData = await getWalletInfoApi();
          if (!ignore) {
            setWallet(walletData.data);
          }
        }
      } catch (error) {
        console.error(error);
        if (!ignore) {
          setBookings([]);
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, [user?.user_code]);

  // Handle fetch payout requests
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

  // Open payout requests modal
  const handleOpenPayoutRequests = () => {
    setShowPayoutRequests(true);
    handleFetchPayoutRequests();
  };

  // Calculate total actual revenue (95% of total price)
  const totalRevenue = useMemo(() => {
    return bookings.reduce((sum, booking) => sum + booking.TotalPrice, 0);
  }, [bookings]);

  const totalActualRevenue = useMemo(() => {
    return Math.floor(totalRevenue * 0.95);
  }, [totalRevenue]);

  // Handle payout request submission
  const handlePayoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPayoutError("");

    const amount = parseFloat(payoutAmount);

    if (!amount || amount <= 0) {
      setPayoutError("Vui lòng nhập số tiền hợp lệ");
      return;
    }

    if (amount > (wallet?.available || 0)) {
      setPayoutError("Số tiền rút không được vượt quá số tiền có sẵn trong ví");
      return;
    }

    if (!payoutPassword) {
      setPayoutError("Vui lòng nhập mật khẩu xác nhận");
      return;
    }

    if (bankAccounts.length === 0) {
      setPayoutError(
        "Chưa có tài khoản ngân hàng. Vui lòng thêm tài khoản ngân hàng trong cài đặt."
      );
      return;
    }

    setPayoutLoading(true);
    try {
      // Get the first (or default) bank account
      const selectedBank = bankAccounts[0];

      // Create payout request with password verification
      await createPayoutRequestApi({
        amount: Math.floor(amount),
        bank_id: selectedBank.ShopBankID, // Use actual bank ID from database
        note: `Yêu cầu rút tiền - ${selectedBank.BankName} - ${selectedBank.AccountNumber}`,
        password: payoutPassword, // Send password for backend verification
      });

      setPayoutSuccess(true);
      setPayoutAmount("");
      setPayoutPassword("");
      setTimeout(() => {
        setShowPayoutForm(false);
        setPayoutSuccess(false);
      }, 2000);

      // Refresh bookings immediately to update "Có sẵn rút"
      // Backend already deducted from wallet, so we refetch to show updated amount
      const bookingsData = await fetchShopBookingsForRevenue();
      setBookings(
        bookingsData.filter(
          (b) => b.BookingStatus === "confirmed" && b.PaymentStatus === "paid"
        )
      );

      // Also refresh wallet to show updated available balance
      const walletData = await getWalletInfoApi();
      setWallet(walletData.data);

      // Refresh payout requests if modal is open
      if (showPayoutRequests) {
        handleFetchPayoutRequests();
      }
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Lỗi khi tạo đơn rút tiền";
      setPayoutError(message);
    } finally {
      setPayoutLoading(false);
    }
  };

  // Get status badge color and icon
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

  return (
    <>
      <div className="shop-header">
        <h1 className="shop-title">Doanh Thu Và Rút Tiền</h1>
      </div>

      {loading ? (
        <div className="loading-wrap">
          <div className="spinner" />
        </div>
      ) : (
        <div className="p-4">
          {/* Total Revenue Summary Card */}
          <div className="mb-8 bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-6 shadow-lg">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              📊 Tóm Tắt Doanh Thu
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg p-4 shadow-md hover:shadow-lg transition">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-gray-600 text-sm font-medium">
                    Tổng Tiền Đơn Đặt
                  </p>
                  <DollarSign className="w-5 h-5 text-blue-500" />
                </div>
                <p className="text-3xl font-bold text-blue-600">
                  {new Intl.NumberFormat("vi-VN").format(totalRevenue)}đ
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  {bookings.length} đơn (100%)
                </p>
              </div>

              <div className="bg-white rounded-lg p-4 shadow-md hover:shadow-lg transition">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-gray-600 text-sm font-medium">
                    Thực Thu (95%)
                  </p>
                  <TrendingUp className="w-5 h-5 text-green-500" />
                </div>
                <p className="text-3xl font-bold text-green-600">
                  {new Intl.NumberFormat("vi-VN").format(totalActualRevenue)}đ
                </p>
                <p className="text-xs text-gray-500 mt-2">Shop nhận được</p>
              </div>

              <div className="bg-white rounded-lg p-4 shadow-md hover:shadow-lg transition">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-gray-600 text-sm font-medium">
                    Có Sẵn Rút
                  </p>
                  <Send className="w-5 h-5 text-purple-500" />
                </div>
                <p className="text-3xl font-bold text-purple-600">
                  {new Intl.NumberFormat("vi-VN").format(
                    wallet?.available || 0
                  )}
                  đ
                </p>
                <p className="text-xs text-gray-500 mt-2">Sẵn sàng rút tiền</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mb-6 flex gap-3 flex-wrap">
            <button
              onClick={() => {
                setShowPayoutForm(!showPayoutForm);
                setPayoutError("");
                setPayoutAmount("");
                setPayoutPassword("");
              }}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold rounded-lg transition shadow-md hover:shadow-lg"
            >
              <Send className="w-5 h-5" />
              {showPayoutForm ? "Hủy" : "Rút Tiền"}
            </button>
            <button
              onClick={handleOpenPayoutRequests}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-semibold rounded-lg transition shadow-md hover:shadow-lg"
            >
              <History className="w-5 h-5" />
              Những Đơn Đã Rút
            </button>
          </div>

          {/* Payout Form */}
          {showPayoutForm && (
            <div className="mb-6 bg-white border border-gray-200 rounded-lg p-6 shadow-md">
              <h2 className="text-xl font-bold mb-4">Tạo Đơn Rút Tiền</h2>
              <form onSubmit={handlePayoutSubmit}>
                <div className="mb-4">
                  <label className="block text-gray-700 font-medium mb-2">
                    Số Tiền Rút (VNĐ)
                  </label>
                  <input
                    type="number"
                    value={payoutAmount}
                    onChange={(e) => setPayoutAmount(e.target.value)}
                    placeholder="Nhập số tiền muốn rút"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    max={wallet?.available || 0}
                    step="1000"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Tối đa:{" "}
                    {new Intl.NumberFormat("vi-VN").format(
                      wallet?.available || 0
                    )}
                    đ
                  </p>
                </div>

                {bankAccounts.length > 0 && (
                  <div className="mb-4">
                    <label className="block text-gray-700 font-medium mb-2">
                      Tài Khoản Nhận Tiền
                    </label>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Ngân Hàng:</span>{" "}
                        {bankAccounts[0].BankName}
                      </p>
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Số Tài Khoản:</span>{" "}
                        {bankAccounts[0].AccountNumber}
                      </p>
                      {bankAccounts[0].AccountHolder && (
                        <p className="text-sm text-gray-700">
                          <span className="font-medium">Chủ Tài Khoản:</span>{" "}
                          {bankAccounts[0].AccountHolder}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <div className="mb-6">
                  <label className="block text-gray-700 font-medium mb-2">
                    Xác Nhận Mật Khẩu
                  </label>
                  <input
                    type="password"
                    value={payoutPassword}
                    onChange={(e) => setPayoutPassword(e.target.value)}
                    placeholder="Nhập mật khẩu để xác nhận"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                {payoutError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                    {payoutError}
                  </div>
                )}

                {payoutSuccess && (
                  <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
                    ✓ Đơn rút tiền đã được tạo thành công! Admin sẽ xử lý sớm
                    nhất.
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={payoutLoading}
                    className="flex items-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition"
                  >
                    <Send className="w-4 h-4" />
                    {payoutLoading ? "Đang xử lý..." : "Gửi Đơn Rút Tiền"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Bookings Table */}
          <div className="table-wrap">
            <div className="mb-4">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                📝 Chi Tiết Các Đơn Đặt
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {bookings.length} đơn được xác nhận và thanh toán
              </p>
            </div>
            <div className="overflow-x-auto bg-white rounded-lg border border-gray-200 shadow-md">
              <table className="table w-full">
                <thead className="bg-gradient-to-r from-blue-50 to-blue-100 border-b-2 border-blue-200">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">
                      Mã Đơn
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">
                      Sân
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">
                      Khách Hàng
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">
                      Ngày & Giờ
                    </th>
                    <th className="text-right px-4 py-3 font-semibold text-gray-700">
                      Tổng Tiền
                    </th>
                    <th className="text-right px-4 py-3 font-semibold text-green-700">
                      Thực Thu (95%)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.length > 0 ? (
                    bookings.map((booking) => (
                      <tr
                        key={booking.BookingCode}
                        className="border-b border-gray-200 hover:bg-blue-50 transition"
                      >
                        <td className="px-4 py-3 font-mono text-sm text-blue-600 font-semibold">
                          {booking.BookingCode}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <div className="font-medium text-gray-800">
                            {booking.FieldName ?? `Sân #${booking.FieldCode}`}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <div className="text-gray-700">
                            {booking.CustomerName ?? "Khách hàng"}
                          </div>
                          {booking.CustomerPhone && (
                            <div className="text-xs text-gray-500">
                              {booking.CustomerPhone}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <div className="flex flex-col gap-1">
                            {booking.slots && booking.slots.length > 0 ? (
                              <>
                                {booking.slots.map((slot) => (
                                  <div key={slot.Slot_ID} className="space-y-1">
                                    <div className="flex items-center gap-1 text-gray-700">
                                      <Calendar className="w-4 h-4 text-blue-500" />
                                      <span className="text-sm">
                                        {new Date(
                                          slot.PlayDate
                                        ).toLocaleDateString("vi-VN")}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1 text-gray-700 ml-5">
                                      <Clock className="w-4 h-4 text-orange-500" />
                                      <span className="text-sm">
                                        {slot.StartTime.substring(0, 5)} -{" "}
                                        {slot.EndTime.substring(0, 5)}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </>
                            ) : (
                              <span className="text-gray-400 italic text-xs">
                                Chưa có slot
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-semibold text-gray-800">
                          {new Intl.NumberFormat("vi-VN").format(
                            booking.TotalPrice
                          )}
                          đ
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-bold text-green-600 bg-green-50">
                          {new Intl.NumberFormat("vi-VN").format(
                            Math.floor(booking.TotalPrice * 0.95)
                          )}
                          đ
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={6}
                        className="text-center text-gray-500 py-8 text-sm"
                      >
                        <div className="flex flex-col items-center gap-2">
                          <span className="text-3xl">📭</span>
                          <span>
                            Chưa có đơn đặt được xác nhận và thanh toán.
                          </span>
                          <span className="text-xs text-gray-400">
                            Khi có đơn, chúng sẽ hiển thị ở đây
                          </span>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Payout Requests Modal */}
          {showPayoutRequests && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
              <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full my-8">
                {/* Modal Header */}
                <div className="sticky top-0 bg-gradient-to-r from-indigo-50 to-indigo-100 border-b border-indigo-200 px-6 py-4 flex items-center justify-between rounded-t-lg">
                  <div className="flex items-center gap-3">
                    <History className="w-6 h-6 text-indigo-600" />
                    <h2 className="text-2xl font-bold text-gray-800">
                      Lịch Sử Rút Tiền
                    </h2>
                  </div>
                  <button
                    onClick={() => setShowPayoutRequests(false)}
                    className="p-2 hover:bg-indigo-200 rounded-lg transition"
                  >
                    <X className="w-6 h-6 text-gray-600" />
                  </button>
                </div>

                {/* Modal Content */}
                <div className="p-6">
                  {payoutRequestsLoading ? (
                    <div className="flex justify-center py-12">
                      <div className="spinner" />
                    </div>
                  ) : payoutRequests.length > 0 ? (
                    <div className="space-y-4">
                      {/* Desktop Table View */}
                      <div className="hidden md:block overflow-x-auto">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="bg-gray-100 border-b-2 border-gray-300">
                              <th className="px-4 py-3 text-left font-semibold text-gray-700">
                                Mã Đơn
                              </th>
                              <th className="px-4 py-3 text-left font-semibold text-gray-700">
                                Số Tiền
                              </th>
                              <th className="px-4 py-3 text-left font-semibold text-gray-700">
                                Trạng Thái
                              </th>
                              <th className="px-4 py-3 text-left font-semibold text-gray-700">
                                Ghi Chú
                              </th>
                              <th className="px-4 py-3 text-left font-semibold text-gray-700">
                                Lý Do Từ Chối
                              </th>
                              <th className="px-4 py-3 text-left font-semibold text-gray-700">
                                Ngày Tạo
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {payoutRequests.map((payout) => {
                              const statusInfo = getStatusBadge(payout.Status);
                              const StatusIcon = statusInfo.icon;
                              return (
                                <tr
                                  key={payout.PayoutID}
                                  className="border-b border-gray-200 hover:bg-indigo-50 transition"
                                >
                                  <td className="px-4 py-3 font-mono text-sm font-semibold text-indigo-600">
                                    #{payout.PayoutID}
                                  </td>
                                  <td className="px-4 py-3 font-semibold text-gray-800">
                                    {new Intl.NumberFormat("vi-VN").format(
                                      payout.Amount
                                    )}
                                    đ
                                  </td>
                                  <td className="px-4 py-3">
                                    <span
                                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${statusInfo.bgColor} ${statusInfo.textColor}`}
                                    >
                                      <StatusIcon className="w-3.5 h-3.5" />
                                      {statusInfo.label}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-700 max-w-xs truncate">
                                    {payout.Note || "-"}
                                  </td>
                                  <td className="px-4 py-3 text-sm">
                                    {payout.RejectionReason ? (
                                      <div className="text-red-600 bg-red-50 px-2 py-1 rounded text-xs max-w-xs">
                                        {payout.RejectionReason}
                                      </div>
                                    ) : (
                                      <span className="text-gray-400">-</span>
                                    )}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-600">
                                    {new Date(
                                      payout.CreateAt
                                    ).toLocaleDateString("vi-VN", {
                                      year: "numeric",
                                      month: "2-digit",
                                      day: "2-digit",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      {/* Mobile Card View */}
                      <div className="md:hidden space-y-4">
                        {payoutRequests.map((payout) => {
                          const statusInfo = getStatusBadge(payout.Status);
                          const StatusIcon = statusInfo.icon;
                          return (
                            <div
                              key={payout.PayoutID}
                              className="bg-white border-2 border-gray-200 rounded-lg p-4 hover:shadow-md transition"
                            >
                              <div className="flex items-start justify-between mb-3">
                                <div>
                                  <p className="font-mono text-sm font-bold text-indigo-600">
                                    #{payout.PayoutID}
                                  </p>
                                  <p className="text-2xl font-bold text-gray-800 mt-1">
                                    {new Intl.NumberFormat("vi-VN").format(
                                      payout.Amount
                                    )}
                                    đ
                                  </p>
                                </div>
                                <span
                                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${statusInfo.bgColor} ${statusInfo.textColor}`}
                                >
                                  <StatusIcon className="w-3.5 h-3.5" />
                                  {statusInfo.label}
                                </span>
                              </div>

                              {payout.Note && (
                                <div className="mb-3 pb-3 border-b border-gray-100">
                                  <p className="text-xs text-gray-600 font-medium">
                                    GHI CHÚ
                                  </p>
                                  <p className="text-sm text-gray-700 mt-1">
                                    {payout.Note}
                                  </p>
                                </div>
                              )}

                              {payout.RejectionReason && (
                                <div className="mb-3 pb-3 border-b border-gray-100">
                                  <p className="text-xs text-red-600 font-medium">
                                    LÝ DO TỪ CHỐI
                                  </p>
                                  <p className="text-sm text-red-700 mt-1 bg-red-50 px-2 py-1 rounded">
                                    {payout.RejectionReason}
                                  </p>
                                </div>
                              )}

                              <div>
                                <p className="text-xs text-gray-600 font-medium">
                                  NGÀY TẠO
                                </p>
                                <p className="text-sm text-gray-700 mt-1">
                                  {new Date(payout.CreateAt).toLocaleDateString(
                                    "vi-VN",
                                    {
                                      year: "numeric",
                                      month: "2-digit",
                                      day: "2-digit",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    }
                                  )}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="py-12 text-center">
                      <div className="text-5xl mb-4">📭</div>
                      <p className="text-gray-500 text-lg">
                        Chưa có đơn rút tiền nào
                      </p>
                      <p className="text-sm text-gray-400 mt-2">
                        Hãy tạo một đơn rút tiền để bắt đầu
                      </p>
                    </div>
                  )}
                </div>

                {/* Modal Footer */}
                <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 rounded-b-lg flex justify-end gap-3">
                  <button
                    onClick={() => setShowPayoutRequests(false)}
                    className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-lg transition"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default ShopRevenuePage;
