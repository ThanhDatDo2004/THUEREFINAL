import React, { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { getShopByUserCode } from "../../utils/fakeApi";
import type { Shops } from "../../types";

const ShopSettingsPage: React.FC = () => {
  const { user } = useAuth();
  const [shop, setShop] = useState<Shops | null>(null);

  useEffect(() => {
    (async () => {
      if (!user?.user_code) return;
      const s = await getShopByUserCode(user.user_code);
      setShop(s ?? null);
    })();
  }, [user?.user_code]);

  return (
    <>
      <div className="shop-header">
        <h1 className="shop-title">Cài đặt</h1>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="section">
          <h3 className="text-lg font-bold mb-4">Thông tin shop</h3>
          <div className="form-group">
            <label className="label">Tên shop</label>
            <input className="input" defaultValue={shop?.shop_name} />
          </div>
          <div className="form-group">
            <label className="label">Địa chỉ</label>
            <input className="input" defaultValue={shop?.address} />
          </div>
          <div className="form-group">
            <label className="label">Ngân hàng</label>
            <input className="input" defaultValue={shop?.bank_name} />
          </div>
          <div className="form-group">
            <label className="label">Số tài khoản</label>
            <input className="input" defaultValue={shop?.bank_account_number} />
          </div>
          <button className="btn-primary">Lưu thay đổi</button>
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
          <button className="btn-ghost">Đặt lại</button>
        </div>
      </div>
    </>
  );
};

export default ShopSettingsPage;
