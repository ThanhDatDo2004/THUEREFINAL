import React, { useEffect, useState } from "react";
import type { AxiosError } from "axios";
import { useAuth } from "../../contexts/AuthContext";
import { fetchMyShop, updateMyShop } from "../../models/shop.api";
import type { Shops } from "../../types";

const ShopSettingsPage: React.FC = () => {
  const { user } = useAuth();
  const [shop, setShop] = useState<Shops | null>(null);
  const [shopName, setShopName] = useState("");
  const [address, setAddress] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankAccount, setBankAccount] = useState("");
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
  }, [shop]);

  const validate = () => {
    const name = shopName.trim();
    const addr = address.trim();
    if (name.length < 2) return "Tên shop phải có ít nhất 2 ký tự.";
    if (addr.length < 5) return "Địa chỉ phải có ít nhất 5 ký tự.";
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
          <h3 className="text-lg font-bold mb-4">Tuỳ chọn khác</h3>
          <div className="form-group">
            <label className="label">Giờ mở cửa</label>
            <input className="input" placeholder="06:00" defaultValue="06:00" />
          </div>
          <div className="form-group">
            <label className="label">Giờ đóng cửa</label>
            <input className="input" placeholder="22:00" defaultValue="22:00" />
          </div>
          <button className="btn-ghost" type="button">
            Đặt lại
          </button>
        </div>
      </div>
    </>
  );
};

export default ShopSettingsPage;
