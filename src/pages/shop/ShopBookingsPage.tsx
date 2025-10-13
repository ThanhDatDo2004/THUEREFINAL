import React, { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import {
  fetchMyShop,
  fetchShopFields,
  fetchMyShopBookings,
} from "../../models/shop.api";
import type { Bookings, FieldWithImages, Shops } from "../../types";

const ShopBookingsPage: React.FC = () => {
  const { user } = useAuth();
  const [shop, setShop] = useState<Shops | null>(null);
  const [fields, setFields] = useState<FieldWithImages[]>([]);
  const [bookings, setBookings] = useState<Bookings[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    (async () => {
      if (!user?.user_code) return;
      setLoading(true);
      try {
        const s = await fetchMyShop();
        if (!s) {
          if (!ignore) setShop(null);
          return;
        }
        if (!ignore) setShop(s);
        const [f, bookingsResponse] = await Promise.all([
          fetchShopFields(s.shop_code),
          fetchMyShopBookings(),
        ]);
        if (ignore) return;
        setFields(f);
        setBookings(bookingsResponse);
      } catch (error) {
        console.error(error);
        if (!ignore) {
          setFields([]);
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

  const fieldNameOf = (field_code: number) =>
    fields.find((x) => x.field_code === field_code)?.field_name ??
    `#${field_code}`;

  return (
    <>
      <div className="shop-header">
        <h1 className="shop-title">Đơn đặt sân</h1>
      </div>

      {loading ? (
        <div className="loading-wrap">
          <div className="spinner" />
        </div>
      ) : (
        <div className="table-wrap p-4">
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Mã</th>
                  <th>Sân</th>
                  <th>Khách</th>
                  <th>Ngày</th>
                  <th>Giờ</th>
                  <th>Tiền</th>
                  <th>Thanh toán</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr key={b.booking_code}>
                    <td>{b.code}</td>
                    <td>{fieldNameOf(b.field_code)}</td>
                    <td>{b.customer_name}</td>
                    <td>
                      {new Date(b.booking_date).toLocaleDateString("vi-VN")}
                    </td>
                    <td>
                      {b.start_time}–{b.end_time}
                    </td>
                    <td>
                      {new Intl.NumberFormat("vi-VN").format(b.total_price)}đ
                    </td>
                    <td className="capitalize">{b.payment_status}</td>
                  </tr>
                ))}
                {bookings.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center text-gray-500 py-6">
                      Chưa có đơn.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
};

export default ShopBookingsPage;
