import React, { useEffect, useState } from "react";
import type { AxiosError } from "axios";
import { useAuth } from "../../contexts/AuthContext";
import { fetchMyShop, updateMyShop } from "../../models/shop.api";
import type { Shops } from "../../types";

const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

const normalizeTimeForInput = (value?: string | null) => {
  if (!value) return "";
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^\d{2}:\d{2}:\d{2}$/.test(trimmed)) {
    return trimmed.slice(0, 5);
  }
  return trimmed;
};

const timeToMinutes = (time: string) => {
  const [hours, minutes] = time.split(":").map((part) => Number(part));
  return hours * 60 + minutes;
};

const ShopSettingsPage: React.FC = () => {
  const { user } = useAuth();
  const [shop, setShop] = useState<Shops | null>(null);
  const [shopName, setShopName] = useState("");
  const [address, setAddress] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [openingTime, setOpeningTime] = useState("");
  const [closingTime, setClosingTime] = useState("");
  const [isOpen24h, setIsOpen24h] = useState(false);
  // Không bắt buộc hiển thị, nhưng FE sẽ gửi mặc định = shop_name nếu trống
  const getBankAccountHolder = () => {
    const holder = (shop?.shop_name || shopName || "").trim();
    return holder || undefined;
  };
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let ignore = false;
    (async () => {
      if (!user?.user_code) return;
      try {
        const s = await fetchMyShop();
        if (!ignore) setShop(s ?? null);
      } catch (error: any) {
        console.error(error);
        if (ignore) return;
        const status = error?.response?.status;
        // Với contract mới: nếu chưa có shop, PUT sẽ tạo mới, nên GET 404 không coi là lỗi chặn form
        if (status !== 404) {
          setError(error?.message || "Không thể tải thông tin shop.");
        }
      }
    })();
    return () => {
      ignore = true;
    };
  }, [user?.user_code]);

  useEffect(() => {
    if (!shop) return;
    setShopName(shop.shop_name || "");
    setAddress(shop.address || "");
    setBankName(shop.bank_name || "");
    setBankAccount(shop.bank_account_number || "");
    setIsOpen24h(Boolean(shop.is_open_24h));
    setOpeningTime(normalizeTimeForInput(shop.opening_time));
    setClosingTime(normalizeTimeForInput(shop.closing_time));
  }, [shop]);

  const validate = () => {
    const name = shopName.trim();
    const addr = address.trim();
    if (name.length < 2) return "Tên shop phải có ít nhất 2 ký tự.";
    if (addr.length < 5) return "Địa chỉ phải có ít nhất 5 ký tự.";
    if (!isOpen24h) {
      const open = openingTime.trim();
      const close = closingTime.trim();
      if (!open || !close) {
        return "Vui lòng nhập giờ mở và đóng cửa.";
      }
      if (!TIME_REGEX.test(open) || !TIME_REGEX.test(close)) {
        return "Giờ mở/đóng cửa phải có định dạng HH:MM.";
      }
      if (timeToMinutes(open) >= timeToMinutes(close)) {
        return "Giờ mở cửa phải nhỏ hơn giờ đóng cửa.";
      }
    }
    return "";
  };

  const onSave = async () => {
    setError("");
    setSuccess("");
    const msg = validate();
    if (msg) {
      setError(msg);
      return;
    }
    setSaving(true);
    try {
      const updated = await updateMyShop({
        shop_name: shopName.trim(),
        address: address.trim(),
        bank_account_number: bankAccount.trim() || undefined,
        bank_name: bankName.trim() || undefined,
        bank_account_holder: getBankAccountHolder(),
        opening_time: isOpen24h ? null : openingTime.trim(),
        closing_time: isOpen24h ? null : closingTime.trim(),
        is_open_24h: isOpen24h,
      });
      // Đồng bộ lại từ GET để đảm bảo cùng format với backend
      try {
        const fresh = await fetchMyShop();
        setShop(fresh ?? updated);
      } catch {
        setShop(updated);
      }
      setSuccess("Đã lưu thay đổi thành công.");
    } catch (e: any) {
      const err = e as AxiosError<
        { message?: string } | { error?: { message?: string } }
      >;
      const status = err.response?.status;
      const apiMessage =
        (err.response?.data as any)?.error?.message ||
        (err.response?.data as any)?.message ||
        err.message;
      if (status === 400) setError(apiMessage || "Dữ liệu không hợp lệ (400).");
      else if (status === 401)
        setError(apiMessage || "Bạn cần đăng nhập (401).");
      else if (status === 404)
        setError(apiMessage || "Không tìm thấy shop (404).");
      else if (status === 500) setError(apiMessage || "Lỗi máy chủ (500).");
      else setError(apiMessage || "Không thể lưu thay đổi.");
    } finally {
      setSaving(false);
    }
  };

  const handleResetOperatingHours = () => {
    if (!shop) {
      setIsOpen24h(false);
      setOpeningTime("");
      setClosingTime("");
      return;
    }
    setIsOpen24h(Boolean(shop.is_open_24h));
    setOpeningTime(normalizeTimeForInput(shop.opening_time));
    setClosingTime(normalizeTimeForInput(shop.closing_time));
  };

  return (
    <>
      <div className="shop-header">
        <h1 className="shop-title">Cài đặt</h1>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="section">
          <h3 className="text-lg font-bold mb-4">Thông tin shop</h3>
          {error && (
            <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              {success}
            </div>
          )}
          <div className="form-group">
            <label className="label">Tên shop</label>
            <input
              className="input"
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="label">Địa chỉ</label>
            <input
              className="input"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="label">Ngân hàng</label>
            <input
              className="input"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="label">Số tài khoản</label>
            <input
              className="input"
              value={bankAccount}
              onChange={(e) => setBankAccount(e.target.value)}
            />
          </div>
          <button className="btn-primary" onClick={onSave} disabled={saving}>
            {saving ? "Đang lưu..." : "Lưu thay đổi"}
          </button>
        </div>

        <div className="section">
          <h3 className="text-lg font-bold mb-4">Giờ hoạt động</h3>
          <div className="form-group">
            <label className="label flex items-center justify-between">
              <span>Giờ mở cửa</span>
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={isOpen24h}
                  onChange={(e) => setIsOpen24h(e.target.checked)}
                />
                Mở cửa 24/24
              </label>
            </label>
            <input
              className="input"
              type="time"
              placeholder="06:00"
              value={openingTime}
              onChange={(e) => setOpeningTime(e.target.value)}
              disabled={isOpen24h}
            />
          </div>
          <div className="form-group">
            <label className="label">Giờ đóng cửa</label>
            <input
              className="input"
              type="time"
              placeholder="22:00"
              value={closingTime}
              onChange={(e) => setClosingTime(e.target.value)}
              disabled={isOpen24h}
            />
          </div>
          {!isOpen24h && (
            <p className="text-xs text-gray-500 mb-3">
              Chỉ được tạo khung giờ trong khoảng {openingTime || "HH:MM"} -{" "}
              {closingTime || "HH:MM"} ở mục Giá thuê sân.
            </p>
          )}
          <div className="flex gap-3">
            <button className="btn-ghost" type="button" onClick={handleResetOperatingHours}>
              Đặt lại
            </button>
            <button
              className="btn-outline"
              type="button"
              onClick={() => {
                setIsOpen24h(false);
                setOpeningTime("");
                setClosingTime("");
              }}
            >
              Xoá giờ hoạt động
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ShopSettingsPage;
