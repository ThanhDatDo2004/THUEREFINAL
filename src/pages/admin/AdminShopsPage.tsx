import React, { useEffect, useMemo, useState } from "react";
import { getAllShops } from "../../utils/fakeApi";
import type { Shops } from "../../types";

const AdminShopsPage: React.FC = () => {
  const [shops, setShops] = useState<Shops[]>([]);
  const [q, setQ] = useState("");

  useEffect(() => {
    (async () => setShops(await getAllShops()))();
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return shops;
    return shops.filter(
      (x) =>
        x.shop_name.toLowerCase().includes(s) ||
        x.address.toLowerCase().includes(s)
    );
  }, [shops, q]);

  return (
    <div>
      <div className="shop-header">
        <div>
          <h1 className="shop-title">Shops</h1>
          <p className="shop-sub">Danh sách shop trong hệ thống</p>
        </div>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="input"
          placeholder="Tìm shop"
        />
      </div>

      <div className="section">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th className="th">ID</th>
                <th className="th">Tên shop</th>
                <th className="th">Địa chỉ</th>
                <th className="th">Ngân hàng</th>
                <th className="th">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.shop_code}>
                  <td className="td">{s.shop_code}</td>
                  <td className="td">{s.shop_name}</td>
                  <td className="td">{s.address}</td>
                  <td className="td">
                    {s.bank_name} • {s.bank_account_number}
                  </td>
                  <td className="td">
                    {s.isapproved ? "Approved" : "Pending"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminShopsPage;
