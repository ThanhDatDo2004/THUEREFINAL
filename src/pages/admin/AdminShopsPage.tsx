import React, { useEffect, useMemo, useState } from "react";
import { fetchAdminShops } from "../../models/admin.api";
import type { Shops } from "../../types";
import { ExternalLink, Search, Store } from "lucide-react";

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

  const heroStats = [
    {
      label: "Tổng shop",
      value: stats.total.toLocaleString("vi-VN"),
      accent: "bg-white/10",
    },
    {
      label: "Đang hoạt động",
      value: stats.approved.toLocaleString("vi-VN"),
      accent: "bg-emerald-500/30",
    },
    {
      label: "Đã khóa",
      value: stats.pending.toLocaleString("vi-VN"),
      accent: "bg-amber-500/30",
    },
  ];

  const resetFilters = () => {
    setQ("");
    setStatusFilter("all");
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
    <div className="flex w-full min-w-0 flex-col gap-6">
      <section className="rounded-3xl border border-emerald-100 bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-600 text-white shadow-lg">
        <div className="space-y-6 p-6 md:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-2">
              <p className="inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-white/90">
                <Store className="h-3.5 w-3.5" />
                Trung tâm shop
              </p>
              <h1 className="text-3xl font-bold leading-tight md:text-4xl">
                Quản lý shop và trạng thái duyệt
              </h1>
              <p className="text-sm text-white/80 md:text-base">
                Tổng hợp tất cả shop trên nền tảng, theo dõi phê duyệt và cập
                nhật thông tin liên lạc nhanh chóng.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/70" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Tìm theo tên hoặc địa chỉ"
                  className="w-full rounded-2xl border border-white/30 bg-white/15 px-10 py-2 text-sm text-white placeholder:text-white/70 focus:border-white focus:outline-none focus:ring-2 focus:ring-white/40"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as ShopStatusFilter)}
                className="rounded-2xl border border-white/30 bg-white/20 px-4 py-2 text-sm font-semibold text-white focus:border-white focus:outline-none focus:ring-2 focus:ring-white/40"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="approved">Đang mở</option>
                <option value="pending">Đang khóa</option>
              </select>
              <button
                type="button"
                className="rounded-2xl border border-white/40 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
                onClick={resetFilters}
              >
                Đặt lại
              </button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {heroStats.map(({ label, value, accent }) => (
              <div
                key={label}
                className="rounded-2xl border border-white/20 bg-white/10 p-4"
              >
                <p className="text-xs uppercase tracking-wide text-white/70">
                  {label}
                </p>
                <div
                  className={`mt-3 inline-flex rounded-xl px-3 py-1 text-lg font-semibold text-white ${accent}`}
                >
                  {value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <section className="min-w-0 rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Danh sách shop
              </h2>
              <p className="text-xs text-slate-500">
                {filtered.length} kết quả · {shops.length} tổng cộng
              </p>
            </div>
          </div>
          <div className="space-y-3 px-4 py-4 sm:px-6">
            {filtered.map((shop) => (
              <div
                key={shop.shop_code}
                className={`rounded-2xl border p-4 transition ${
                  selectedShop?.shop_code === shop.shop_code
                    ? "border-emerald-400 bg-emerald-50/30 shadow-sm"
                    : "border-slate-100 bg-white hover:border-emerald-200"
                }`}
                onClick={() => setSelectedShop(shop)}
                role="button"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-base font-semibold text-slate-900">
                      {shop.shop_name}
                    </p>
                    <p className="text-xs text-slate-500">
                      Chủ sở hữu #{shop.user_code}
                    </p>
                    <p className="text-sm text-slate-600">
                      #{shop.shop_code}
                    </p>
                  </div>
                  {renderStatusBadge(shop)}
                </div>
                <div className="mt-4 grid gap-4 text-xs text-slate-500 sm:grid-cols-3">
                  <div>
                    <p className="font-semibold text-slate-700">Địa chỉ</p>
                    <p>{shop.address || "Chưa cập nhật"}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-700">
                      Ngân hàng
                    </p>
                    <p>
                      {shop.bank_name || "—"}
                      {shop.bank_account_number &&
                        ` • ${shop.bank_account_number}`}
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-700">
                      Mã shop
                    </p>
                    <p>#{shop.shop_code}</p>
                  </div>
                </div>
              </div>
            ))}
            {!filtered.length && (
              <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-500">
                Không có shop phù hợp.
              </div>
            )}
          </div>
        </section>

        <aside className="min-w-0 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">
            Thông tin chi tiết
          </h3>
          {selectedShop ? (
            <div className="mt-4 space-y-4 text-sm text-slate-600">
              <div>
                <p className="text-xs uppercase text-slate-400">Tên shop</p>
                <p className="text-lg font-semibold text-slate-900">
                  {selectedShop.shop_name}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase text-slate-400">Địa chỉ</p>
                <p>{selectedShop.address || "Chưa cập nhật"}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-slate-400">
                  Thông tin ngân hàng
                </p>
                <p>
                  {selectedShop.bank_name || "—"}
                  {selectedShop.bank_account_number &&
                    ` • ${selectedShop.bank_account_number}`}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase text-slate-400">
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
            <p className="mt-4 text-sm text-slate-500">
              Chọn một shop để xem chi tiết.
            </p>
          )}
        </aside>
      </div>

      {loading && (
        <div className="flex items-center gap-3 text-sm text-slate-500">
          <div className="spinner" />
          Đang tải danh sách shop...
        </div>
      )}
    </div>
  );
};

export default AdminShopsPage;
