import React, { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { fetchMyShop, fetchMyShopCustomers } from "../../models/shop.api";
import type { Customers, Shops } from "../../types";

const ShopCustomersPage: React.FC = () => {
  const { user } = useAuth();
  const [shop, setShop] = useState<Shops | null>(null);
  const [customers, setCustomers] = useState<Customers[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    (async () => {
      if (!user?.user_code) return;
      setLoading(true);
      try {
        const s = await fetchMyShop();
        if (ignore) return;
        setShop(s ?? null);
        if (s) {
          const cs = await fetchMyShopCustomers();
          if (!ignore) setCustomers(cs);
        } else if (!ignore) {
          setCustomers([]);
        }
      } catch (error) {
        console.error(error);
        if (!ignore) setCustomers([]);
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, [user?.user_code]);

  return (
    <>
      <div className="shop-header">
        <h1 className="shop-title">Khách hàng</h1>
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
                  <th>Tên</th>
                  <th>Email</th>
                  <th>Điện thoại</th>
                  <th>Số đơn</th>
                  <th>Đặt gần nhất</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c.customer_code}>
                    <td>{c.name}</td>
                    <td>{c.email}</td>
                    <td>{c.phone_number}</td>
                    <td>{c.total_orders}</td>
                    <td>
                      {new Date(c.last_booking_date).toLocaleDateString(
                        "vi-VN"
                      )}
                    </td>
                  </tr>
                ))}
                {customers.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center text-gray-500 py-6">
                      Chưa có khách hàng.
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

export default ShopCustomersPage;
