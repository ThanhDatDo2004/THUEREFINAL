import React, { useState } from "react";
import { Save, Mail, Bell, ShieldCheck, Database } from "lucide-react";

const AdminSettingsPage: React.FC = () => {
  const [autoApprove, setAutoApprove] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const handleSave = () => {
    setSaving(true);
    setMessage("");
    window.setTimeout(() => {
      setSaving(false);
      setMessage("Đã lưu cấu hình (tạm thời lưu ở frontend).");
    }, 900);
  };

  return (
    <div className="space-y-6">
      <div className="shop-header">
        <div>
          <h1 className="shop-title">Admin Settings</h1>
          <p className="shop-sub">
            Điều chỉnh cấu hình hệ thống. Các thay đổi hiện lưu tại frontend để
            mô phỏng quy trình vận hành.
          </p>
        </div>
        <button
          type="button"
          onClick={handleSave}
          className="btn-primary flex items-center gap-2"
          disabled={saving}
        >
          <Save className="h-4 w-4" />
          {saving ? "Đang lưu..." : "Lưu thay đổi"}
        </button>
      </div>

      {message && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {message}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="section space-y-4">
          <div className="flex items-center gap-3">
            <Mail className="h-5 w-5 text-emerald-500" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Thông báo qua email
              </h3>
              <p className="text-sm text-gray-500">
                Cập nhật các sự kiện quan trọng về người dùng và shop.
              </p>
            </div>
          </div>

          <label className="flex items-center justify-between rounded-xl border border-gray-100 bg-white px-4 py-3 text-sm">
            <span>Gửi email khi có yêu cầu mở shop mới</span>
            <input
              type="checkbox"
              className="h-4 w-4"
              checked={emailNotifications}
              onChange={(e) => setEmailNotifications(e.target.checked)}
            />
          </label>

          <label className="flex items-center justify-between rounded-xl border border-gray-100 bg-white px-4 py-3 text-sm">
            <span>Nhận báo cáo thống kê hàng tuần</span>
            <input
              type="checkbox"
              className="h-4 w-4"
              checked={weeklyDigest}
              onChange={(e) => setWeeklyDigest(e.target.checked)}
            />
          </label>
        </div>

        <div className="section space-y-4">
          <div className="flex items-center gap-3">
            <Bell className="h-5 w-5 text-emerald-500" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Vận hành hệ thống
              </h3>
              <p className="text-sm text-gray-500">
                Các thiết lập ảnh hưởng đến quy trình duyệt và bảo trì hệ thống.
              </p>
            </div>
          </div>

          <label className="flex items-center justify-between rounded-xl border border-gray-100 bg-white px-4 py-3 text-sm">
            <span>Tự động duyệt yêu cầu shop đạt tiêu chí</span>
            <input
              type="checkbox"
              className="h-4 w-4"
              checked={autoApprove}
              onChange={(e) => setAutoApprove(e.target.checked)}
            />
          </label>

          <label className="flex items-center justify-between rounded-xl border border-gray-100 bg-white px-4 py-3 text-sm">
            <span>Kích hoạt chế độ bảo trì tạm thời</span>
            <input
              type="checkbox"
              className="h-4 w-4"
              checked={maintenanceMode}
              onChange={(e) => setMaintenanceMode(e.target.checked)}
            />
          </label>

          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-700">
            <strong>Lưu ý:</strong> Các chức năng này mới ở cấp giao diện. Cần
            triển khai API tương ứng ở backend để áp dụng thật sự.
          </div>
        </div>
      </div>

      <div className="section space-y-4">
        <div className="flex items-center gap-3">
          <Database className="h-5 w-5 text-emerald-500" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Sao lưu & bảo mật
            </h3>
            <p className="text-sm text-gray-500">
              Quản lý kế hoạch sao lưu và xác thực đa yếu tố cho đội ngũ admin.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-gray-100 bg-white p-4">
            <p className="text-xs uppercase text-gray-500">Sao lưu tự động</p>
            <p className="mt-2 text-sm font-semibold text-gray-900">
              02:00 hằng ngày
            </p>
          </div>
          <div className="rounded-xl border border-gray-100 bg-white p-4">
            <p className="text-xs uppercase text-gray-500">Mã hoá</p>
            <p className="mt-2 text-sm font-semibold text-gray-900">
              AES-256 / TLS 1.3
            </p>
          </div>
          <div className="rounded-xl border border-gray-100 bg-white p-4">
            <p className="text-xs uppercase text-gray-500">MFA</p>
            <p className="mt-2 text-sm font-semibold text-gray-900">
              75% admin đã bật
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-gray-100 bg-white p-4 text-sm text-gray-600">
          <ShieldCheck className="h-4 w-4 text-emerald-600 inline mr-2" />
          Hãy đảm bảo đội ngũ admin bật xác thực 2 bước và sử dụng mật khẩu mạnh
          để giữ an toàn cho hệ thống.
        </div>
      </div>
    </div>
  );
};

export default AdminSettingsPage;
