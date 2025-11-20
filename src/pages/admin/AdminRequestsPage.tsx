import React, { useEffect, useMemo, useState } from "react";
import {
  fetchAdminShopRequests,
  updateAdminShopRequestStatus,
} from "../../models/admin.api";
import type { ShopRequests } from "../../types";
import {
  Ban,
  CheckCircle2,
  Clock,
  Filter,
  Mail,
  RefreshCcw,
} from "lucide-react";

type StatusFilter = "all" | "pending" | "reviewed" | "approved" | "rejected";

const AdminRequestsPage: React.FC = () => {
  const [rows, setRows] = useState<ShopRequests[]>([]);
  const [filterStatus, setFilterStatus] = useState<StatusFilter>("all");
  const [selected, setSelected] = useState<ShopRequests | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  useEffect(() => {
    let ignore = false;
    (async () => {
      setLoading(true);
      try {
        const data = await fetchAdminShopRequests();
        if (!ignore) {
          setRows(data);
          setSelected(data[0] ?? null);
        }
      } catch (error) {
        console.error(error);
        if (!ignore) {
          setRows([]);
          setSelected(null);
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, []);

  const stats = useMemo(() => {
    const total = rows.length;
    const pending = rows.filter(
      (r) => r.status === "pending" || !r.status
    ).length;
    const approved = rows.filter((r) => r.status === "approved").length;
    const rejected = rows.filter((r) => r.status === "rejected").length;
    const reviewed = rows.filter((r) => r.status === "reviewed").length;
    return { total, pending, approved, rejected, reviewed };
  }, [rows]);

  const filtered = useMemo(() => {
    return rows.filter((row) =>
      filterStatus === "all" ? true : row.status === filterStatus
    );
  }, [rows, filterStatus]);

  const heroStats = [
    {
      label: "Tổng yêu cầu",
      value: stats.total.toLocaleString("vi-VN"),
      tone: "bg-white/15 text-white",
    },
    {
      label: "Chờ xử lý",
      value: stats.pending.toLocaleString("vi-VN"),
      tone: "bg-amber-500/30 text-white",
    },
    {
      label: "Đang xét",
      value: stats.reviewed.toLocaleString("vi-VN"),
      tone: "bg-blue-500/30 text-white",
    },
    {
      label: "Đã duyệt",
      value: stats.approved.toLocaleString("vi-VN"),
      tone: "bg-emerald-500/30 text-white",
    },
    {
      label: "Đã từ chối",
      value: stats.rejected.toLocaleString("vi-VN"),
      tone: "bg-rose-500/30 text-white",
    },
  ];

  const statusOptions: Array<{ value: StatusFilter; label: string }> = [
    { value: "all", label: "Tất cả" },
    { value: "pending", label: "Chờ xử lý" },
    { value: "reviewed", label: "Đang xét" },
    { value: "approved", label: "Đã duyệt" },
    { value: "rejected", label: "Từ chối" },
  ];

  const handleUpdateStatus = async (
    request: ShopRequests,
    status: StatusFilter
  ) => {
    if (status === "all") return;
    if (updatingId !== null) return;
    setUpdatingId(request.request_id);
    try {
      const updated = await updateAdminShopRequestStatus(
        request.request_id,
        status
      );
      setRows((prev) =>
        prev.map((row) =>
          row.request_id === updated.request_id ? updated : row
        )
      );
      setSelected((prev) =>
        prev && prev.request_id === updated.request_id ? updated : prev
      );
    } catch (error) {
      console.error(error);
      window.alert(
        error instanceof Error
          ? error.message
          : "Không thể cập nhật trạng thái yêu cầu."
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const statusBadge = (status?: string | null) => {
    if (!status) status = "pending";
    const base =
      "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold";
    if (status === "approved") {
      return (
        <span className={`${base} bg-emerald-100 text-emerald-700`}>
          Đã duyệt
        </span>
      );
    }
    if (status === "rejected") {
      return (
        <span className={`${base} bg-rose-100 text-rose-700`}>Từ chối</span>
      );
    }
    if (status === "reviewed") {
      return (
        <span className={`${base} bg-blue-100 text-blue-700`}>Đang xét</span>
      );
    }
    return (
      <span className={`${base} bg-amber-100 text-amber-700`}>Đang chờ</span>
    );
  };

  return (
    <div className="flex w-full min-w-0 flex-col gap-6">
      <section className="rounded-3xl border border-emerald-100 bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-600 text-white shadow-lg">
        <div className="space-y-6 p-6 md:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-2">
              <p className="inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-white/90">
                <Clock className="h-3.5 w-3.5" />
                Trung tâm yêu cầu
              </p>
              <h1 className="text-3xl font-bold leading-tight md:text-4xl">
                Theo dõi yêu cầu mở shop
              </h1>
              <p className="text-sm text-white/80 md:text-base">
                Ưu tiên xử lý các yêu cầu quan trọng, giảm thời gian phản hồi và
                đảm bảo trải nghiệm onboarding mượt mà.
              </p>
            </div>
            <button
              type="button"
              className="rounded-2xl border border-white/40 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
              onClick={() => window.location.reload()}
            >
              <RefreshCcw className="mr-2 inline h-4 w-4" />
              Tải lại dữ liệu
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {heroStats.map(({ label, value, tone }) => (
              <div
                key={label}
                className="rounded-2xl border border-white/20 bg-white/10 p-4"
              >
                <p className="text-xs uppercase tracking-wide text-white/70">
                  {label}
                </p>
                <div
                  className={`mt-3 inline-flex rounded-xl px-3 py-1 text-lg font-semibold ${tone}`}
                >
                  {value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
            <Filter className="h-4 w-4 text-emerald-500" />
            Lọc trạng thái
          </div>
          <div className="flex flex-wrap gap-2">
            {statusOptions.map((option) => {
              const active = filterStatus === option.value;
              return (
                <button
                  key={option.value}
                  onClick={() => setFilterStatus(option.value)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    active
                      ? "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <section className="min-w-0 rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Danh sách yêu cầu
              </h2>
              <p className="text-xs text-slate-500">
                {filtered.length} kết quả · {rows.length} tổng cộng
              </p>
            </div>
          </div>
          <div className="space-y-3 px-4 py-4 sm:px-6">
            {filtered.map((r) => (
              <div
                key={r.request_id}
                className={`rounded-2xl border p-4 transition ${
                  selected?.request_id === r.request_id
                    ? "border-emerald-400 bg-emerald-50/30 shadow-sm"
                    : "border-slate-100 bg-white hover:border-emerald-200"
                }`}
                onClick={() => setSelected(r)}
                role="button"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-900">
                      {r.full_name}
                    </p>
                    <p className="text-xs text-slate-500">{r.email}</p>
                    <p className="text-xs text-slate-500">
                      {r.phone_number || "—"}
                    </p>
                  </div>
                  {statusBadge(r.status)}
                </div>
                <div className="mt-3 grid gap-4 text-xs text-slate-500 sm:grid-cols-3">
                  <div>
                    <p className="font-semibold text-slate-700">Mã yêu cầu</p>
                    <p>#{r.request_id}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-700">Ngày tạo</p>
                    <p>
                      {r.created_at
                        ? new Date(r.created_at).toLocaleString("vi-VN")
                        : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-700">Địa chỉ</p>
                    <p>{r.address || "Chưa cập nhật"}</p>
                  </div>
                </div>
                <p className="mt-3 text-sm text-slate-600">
                  {r.message || "Không có ghi chú bổ sung."}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="btn-primary flex items-center gap-1 disabled:opacity-60 disabled:cursor-not-allowed"
                    disabled={updatingId === r.request_id}
                    onClick={(event) => {
                      event.stopPropagation();
                      void handleUpdateStatus(r, "approved");
                    }}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Duyệt
                  </button>
                  <button
                    type="button"
                    className="btn-outline flex items-center gap-1 text-rose-600 border-rose-200 hover:bg-rose-50 disabled:opacity-60 disabled:cursor-not-allowed"
                    disabled={updatingId === r.request_id}
                    onClick={(event) => {
                      event.stopPropagation();
                      void handleUpdateStatus(r, "rejected");
                    }}
                  >
                    <Ban className="h-4 w-4" />
                    Từ chối
                  </button>
                </div>
              </div>
            ))}
            {!filtered.length && (
              <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-500">
                Không có yêu cầu phù hợp.
              </div>
            )}
          </div>
        </section>

        <aside className="min-w-0 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">
            Chi tiết yêu cầu
          </h3>
          {selected ? (
            <div className="mt-4 space-y-4 text-sm text-slate-600">
              <div>
                <p className="text-xs uppercase text-slate-400">Họ tên</p>
                <p className="font-semibold text-slate-900">
                  {selected.full_name}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase text-slate-400">
                  Thông tin liên hệ
                </p>
                <p>{selected.email}</p>
                <p>{selected.phone_number}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-slate-400">Địa chỉ</p>
                <p>{selected.address || "Chưa cập nhật"}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-slate-400">Thông điệp</p>
                <p className="text-slate-700">
                  {selected.message || "Không có"}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase text-slate-400">Trạng thái</p>
                {statusBadge(selected.status)}
              </div>
              <button
                type="button"
                className="btn-outline flex w-full items-center justify-center gap-2"
                onClick={() =>
                  window.open(`mailto:${selected.email}`, "_blank")
                }
              >
                <Mail className="h-4 w-4" />
                Liên hệ qua email
              </button>
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-500">
              Chọn một yêu cầu để xem chi tiết.
            </p>
          )}
        </aside>
      </div>

      {loading && (
        <div className="flex items-center gap-3 text-sm text-slate-500">
          <div className="spinner" />
          Đang tải yêu cầu...
        </div>
      )}
    </div>
  );
};

export default AdminRequestsPage;
