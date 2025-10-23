import React, { useEffect, useMemo, useState } from "react";
import {
  fetchAdminShopRequests,
  updateAdminShopRequestStatus,
} from "../../models/admin.api";
import type { ShopRequests } from "../../types";
import { Filter, RefreshCcw, CheckCircle2, Ban, Eye } from "lucide-react";

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
    const pending = rows.filter((r) => r.status === "pending" || !r.status)
      .length;
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
      return <span className={`${base} bg-emerald-100 text-emerald-700`}>Đang mở</span>;
    }
    if (status === "rejected") {
      return <span className={`${base} bg-rose-100 text-rose-700`}>Từ chối</span>;
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
    <div className="space-y-6">
      <div className="shop-header">
        <div>
          <h1 className="shop-title">Shop Requests</h1>
          <p className="shop-sub">
            Theo dõi và xử lý yêu cầu mở shop của người dùng.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="btn-outline flex items-center gap-2"
            onClick={() => window.location.reload()}
          >
            <RefreshCcw className="h-4 w-4" />
            Tải lại
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <div className="stat-card">
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">Tổng yêu cầu</div>
        </div>
        <div className="stat-card">
          <div className="stat-value text-amber-600">{stats.pending}</div>
          <div className="stat-label">Chờ xử lý</div>
        </div>
        <div className="stat-card">
          <div className="stat-value text-blue-600">{stats.reviewed}</div>
          <div className="stat-label">Đang xem xét</div>
        </div>
        <div className="stat-card">
          <div className="stat-value text-emerald-600">{stats.approved}</div>
          <div className="stat-label">Đã duyệt</div>
        </div>
        <div className="stat-card">
          <div className="stat-value text-rose-600">{stats.rejected}</div>
          <div className="stat-label">Từ chối</div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="section space-y-4 overflow-hidden">
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-600">
              <Filter className="h-4 w-4" />
              Trạng thái
            </label>
            <select
              value={filterStatus}
              onChange={(e) =>
                setFilterStatus(e.target.value as StatusFilter)
              }
              className="input h-10 w-48"
            >
              <option value="all">Tất cả</option>
              <option value="pending">Pending</option>
              <option value="reviewed">Reviewed</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div className="overflow-x-auto w-full">
            <table className="table min-w-[720px]">
              <thead>
                <tr>
                  <th className="th">ID</th>
                  <th className="th">Thông tin</th>
                  <th className="th">Ngày tạo</th>
                  <th className="th">Trạng thái</th>
                  <th className="th">Tùy chọn</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr
                    key={r.request_id}
                    className={
                      selected?.request_id === r.request_id
                        ? "bg-gray-50"
                        : undefined
                    }
                    onClick={() => setSelected(r)}
                  >
                    <td className="td font-semibold text-gray-900">
                      #{r.request_id}
                    </td>
                    <td className="td">
                      <div className="font-medium text-gray-900">
                        {r.full_name}
                      </div>
                      <div className="text-xs text-gray-500">{r.email}</div>
                      <div className="text-xs text-gray-500">
                        {r.phone_number}
                      </div>
                    </td>
                    <td className="td text-sm text-gray-600">
                      {r.created_at
                        ? new Date(r.created_at).toLocaleString("vi-VN")
                        : "—"}
                    </td>
                    <td className="td">{statusBadge(r.status)}</td>
                    <td className="td">
                      <div className="flex items-center gap-2">
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
                    </td>
                  </tr>
                ))}
                {!filtered.length && (
                  <tr>
                    <td className="td text-center text-gray-500" colSpan={5}>
                      Không có yêu cầu phù hợp.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <aside className="section space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Chi tiết yêu cầu
          </h3>
          {selected ? (
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-xs uppercase text-gray-500">Họ tên</p>
                <p className="font-semibold text-gray-900">
                  {selected.full_name}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase text-gray-500">Thông tin liên hệ</p>
                <p>{selected.email}</p>
                <p>{selected.phone_number}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-gray-500">Địa chỉ</p>
                <p>{selected.address || "Chưa cập nhật"}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-gray-500">Thông điệp</p>
                <p className="text-gray-700">
                  {selected.message || "Không có"}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase text-gray-500">Trạng thái</p>
                {statusBadge(selected.status)}
              </div>
              <button
                type="button"
                className="btn-outline flex w-full items-center justify-center gap-2"
                onClick={() =>
                  window.open(`mailto:${selected.email}`, "_blank")
                }
              >
                <Eye className="h-4 w-4" />
                Liên hệ qua email
              </button>
            </div>
          ) : (
            <p className="text-sm text-gray-500">
              Chọn một yêu cầu để xem chi tiết.
            </p>
          )}
        </aside>
      </div>

      {loading && (
        <div className="flex items-center gap-3 text-sm text-gray-500">
          <div className="spinner" />
          Đang tải yêu cầu...
        </div>
      )}
    </div>
  );
};

export default AdminRequestsPage;
