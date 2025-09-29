import React, { useEffect, useState } from "react";
import { getShopRequests } from "../../utils/fakeApi";
import type { ShopRequests } from "../../types";

const AdminRequestsPage: React.FC = () => {
  const [rows, setRows] = useState<ShopRequests[]>([]);
  useEffect(() => {
    (async () => setRows(await getShopRequests()))();
  }, []);

  return (
    <div>
      <div className="shop-header">
        <div>
          <h1 className="shop-title">Shop Requests</h1>
          <p className="shop-sub">
            Đăng ký mở shop (pending / reviewed / approved / rejected)
          </p>
        </div>
      </div>

      <div className="section">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th className="th">ID</th>
                <th className="th">Họ tên</th>
                <th className="th">Email</th>
                <th className="th">Điện thoại</th>
                <th className="th">Địa chỉ</th>
                <th className="th">Ngày tạo</th>
                <th className="th">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.request_id}>
                  <td className="td">{r.request_id}</td>
                  <td className="td">{r.full_name}</td>
                  <td className="td">{r.email}</td>
                  <td className="td">{r.phone_number}</td>
                  <td className="td">{r.address}</td>
                  <td className="td">
                    {new Date(r.created_at).toLocaleString()}
                  </td>
                  <td className="td capitalize">{r.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminRequestsPage;
