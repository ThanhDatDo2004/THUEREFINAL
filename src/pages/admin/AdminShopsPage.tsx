import React, { useEffect, useMemo, useState } from "react";
import { fetchAdminShops } from "../../models/admin.api";
import type { Shops } from "../../types";
import { Filter, CheckCircle2, Ban, ExternalLink } from "lucide-react";

type ShopStatusFilter = "all" | "approved" | "pending";

const AdminShopsPage: React.FC = () => {
  const [shops, setShops] = useState<Shops[]>([]);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<ShopStatusFilter>("all");
  const [selectedShop, setSelectedShop] = useState<Shops | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    (async () => {
      setLoading(true);
      try {
        const data = await fetchAdminShops();
        if (!ignore) {
          setShops(data);
          setSelectedShop(data[0] ?? null);
        }
      } catch (error) {
        console.error(error);
        if (!ignore) {
          setShops([]);
          setSelectedShop(null);
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const keyword = q.trim().toLowerCase();
    return shops.filter((shop) => {
      const approved =
        shop.isapproved === 1 || String(shop.isapproved ?? "") === "1";
      const matchesStatus =
        statusFilter === "all"
          ? true
          : statusFilter === "approved"
          ? approved
          : !approved;
      const matchesKeyword =
        !keyword ||
        shop.shop_name.toLowerCase().includes(keyword) ||
        shop.address.toLowerCase().includes(keyword);
      return matchesStatus && matchesKeyword;
    });
  }, [shops, q, statusFilter]);

  const stats = useMemo(() => {
    const total = shops.length;
    const approved = shops.filter(
      (shop) => shop.isapproved === 1 || String(shop.isapproved ?? "") === "1"
    ).length;
    const pending = total - approved;
    return { total, approved, pending };
  }, [shops]);

  const handleMarkStatus = (shop: Shops, approved: boolean) => {
    setShops((prev) =>
      prev.map((item) =>
        item.shop_code === shop.shop_code
          ? { ...item, isapproved: approved ? 1 : 0 }
          : item
      )
    );
    setSelectedShop((prev) =>
      prev && prev.shop_code === shop.shop_code
        ? { ...prev, isapproved: approved ? 1 : 0 }
        : prev
    );
  };

  const renderStatusBadge = (shop: Shops) => {
    const approved =
      shop.isapproved === 1 || String(shop.isapproved ?? "") === "1";
    const className = approved
      ? "bg-emerald-100 text-emerald-700"
      : "bg-amber-100 text-amber-700";
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${className}`}
      >
        {approved ? "Đang mở" : "Đã khoá"}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="shop-header">
        <div>
          <h1 className="shop-title">Shops</h1>
          <p className="shop-sub">
            Danh sách shop và trạng thái duyệt trong hệ thống.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="input w-64"
            placeholder="Tìm theo tên hoặc địa chỉ"
          />
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Filter className="h-4 w-4" />
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as ShopStatusFilter)
              }
              className="input h-10 w-36"
            >
              <option value="all">Tất cả</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="stat-card">
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">Tổng số shop</div>
        </div>
        <div className="stat-card">
          <div className="stat-value text-emerald-600">{stats.approved}</div>
          <div className="stat-label">Đã duyệt</div>
        </div>
        <div className="stat-card">
          <div className="stat-value text-amber-600">{stats.pending}</div>
          <div className="stat-label">Chờ duyệt</div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="section space-y-4 overflow-hidden">
          <div className="overflow-x-auto w-full">
            <table className="table min-w-[720px]">
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
                {filtered.map((shop) => (
                  <tr
                    key={shop.shop_code}
                    className={
                      selectedShop?.shop_code === shop.shop_code
                        ? "bg-gray-50"
                        : undefined
                    }
                    onClick={() => setSelectedShop(shop)}
                  >
                    <td className="td font-medium text-gray-900">
                      #{shop.shop_code}
                    </td>
                    <td className="td">
                      <div className="font-semibold text-gray-900">
                        {shop.shop_name}
                      </div>
                      <div className="text-xs text-gray-500">
                        Chủ sở hữu #{shop.user_code}
                      </div>
                    </td>
                    <td className="td text-sm text-gray-600">{shop.address}</td>
                    <td className="td text-sm text-gray-600">
                      {shop.bank_name || "—"}
                      {shop.bank_account_number &&
                        ` • ${shop.bank_account_number}`}
                    </td>
                    <td className="td">{renderStatusBadge(shop)}</td>
                  </tr>
                ))}
                {!filtered.length && (
                  <tr>
                    <td className="td text-center text-gray-500" colSpan={6}>
                      Không có shop phù hợp.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <aside className="section space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Thông tin chi tiết
          </h3>
          {selectedShop ? (
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-xs uppercase text-gray-500">Tên shop</p>
                <p className="text-lg font-semibold text-gray-900">
                  {selectedShop.shop_name}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase text-gray-500">Địa chỉ</p>
                <p>{selectedShop.address || "Chưa cập nhật"}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-gray-500">
                  Thông tin ngân hàng
                </p>
                <p>
                  {selectedShop.bank_name || "—"}
                  {selectedShop.bank_account_number &&
                    ` • ${selectedShop.bank_account_number}`}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase text-gray-500">
                  Trạng thái duyệt
                </p>
                {renderStatusBadge(selectedShop)}
              </div>
              <button
                type="button"
                className="btn-outline flex w-full items-center justify-center gap-2"
                onClick={() =>
                  window.open(
                    `/shop?shop_code=${selectedShop.shop_code}`,
                    "_blank"
                  )
                }
              >
                <ExternalLink className="h-4 w-4" />
                Xem trang shop
              </button>
            </div>
          ) : (
            <p className="text-sm text-gray-500">
              Chọn một shop để xem chi tiết.
            </p>
          )}
        </aside>
      </div>

      {loading && (
        <div className="flex items-center gap-3 text-sm text-gray-500">
          <div className="spinner" />
          Đang tải danh sách shop...
        </div>
      )}
    </div>
  );
};

export default AdminShopsPage;
