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
} from "../../models/wallet.api";
import { Send, Calendar, Clock, DollarSign, TrendingUp } from "lucide-react";

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
          <div className="mb-6 flex gap-3">
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
        </div>
      )}
    </>
  );
};

export default ShopRevenuePage;
