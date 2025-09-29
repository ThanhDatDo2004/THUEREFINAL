// src/pages/shop/ShopFieldsPage.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import {
  getShopByUserCode,
  getShopFields,
  updateShopField,
  setFieldStatus,
  createShopField, // <-- thêm
} from "../../utils/fakeApi";
import type { FieldWithImages, Shops, Fields } from "../../types";
import { DollarSign, Pencil, Wrench, X, Plus } from "lucide-react";

// ===== Kiểu union lấy trực tiếp từ types =====
type FieldStatus = NonNullable<Fields["status"]>;
type SportType = NonNullable<Fields["sport_type"]>;

// ===== Options khớp đúng union hiện có =====
const STATUS_OPTIONS = ["trống", "đã đặt", "bảo trì"] as const satisfies readonly FieldStatus[];
const SPORT_OPTIONS  = ["bóng đá", "cầu lông", "tennis"] as const satisfies readonly SportType[];

// ===== Form state (edit) =====
type FormState = {
  field_name: string;
  sport_type: SportType;
  price_per_hour: number;
  status: FieldStatus;
};

// ===== Form state (create) =====
type CreateFormState = {
  field_name: string;
  sport_type: SportType;
  price_per_hour: number;
  address: string;
  status: FieldStatus;
};

const ShopFieldsPage: React.FC = () => {
  const { user } = useAuth();
  const [shop, setShop] = useState<Shops | null>(null);
  const [fields, setFields] = useState<FieldWithImages[]>([]);
  const [loading, setLoading] = useState(true);

  // ===== Edit modal =====
  const [editing, setEditing] = useState<FieldWithImages | null>(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);

  // ===== Create modal =====
  const [creating, setCreating] = useState(false);
  const [formNew, setFormNew] = useState<CreateFormState>({
    field_name: "",
    sport_type: SPORT_OPTIONS[0],
    price_per_hour: 0,
    address: "",
    status: "trống",
  });

  useEffect(() => {
    (async () => {
      if (!user?.user_code) return;
      setLoading(true);
      const s = await getShopByUserCode(user.user_code);
      setShop(s ?? null);
      if (s) {
        const f = await getShopFields(s.shop_code);
        setFields(f);
        // gợi ý địa chỉ mặc định theo 1 sân có sẵn (nếu có)
        const sample = f.find(Boolean);
        if (sample && !formNew.address) {
          setFormNew((p) => ({ ...p, address: sample.address }));
        }
      }
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.user_code]);

  /* ====== EDIT ====== */
  const onOpenEdit = (f: FieldWithImages) => {
    setEditing(f);
    setForm({
      field_name: f.field_name,
      sport_type: (f.sport_type as SportType) ?? SPORT_OPTIONS[0],
      price_per_hour: f.price_per_hour,
      status: (f.status as FieldStatus) ?? "trống",
    });
  };

  const onCloseEdit = () => {
    setEditing(null);
    setForm(null);
    setSaving(false);
  };

  const onSave = async () => {
    if (!editing || !form) return;
    setSaving(true);
    const updated = await updateShopField(editing.field_code, {
      field_name: form.field_name.trim(),
      sport_type: form.sport_type,
      price_per_hour: Number(form.price_per_hour) || 0,
      status: form.status,
    });
    if (updated) {
      setFields((prev) =>
        prev.map((x) => (x.field_code === updated.field_code ? { ...x, ...updated } : x))
      );
    }
    setSaving(false);
    onCloseEdit();
  };

  const onToggleMaintenance = async (f: FieldWithImages) => {
    const next: FieldStatus = f.status === "bảo trì" ? "trống" : "bảo trì";
    const updated = await setFieldStatus(f.field_code, next);
    if (updated) {
      setFields((prev) =>
        prev.map((x) => (x.field_code === updated.field_code ? { ...x, status: next } : x))
      );
      if (editing && editing.field_code === f.field_code) {
        setForm((p) => (p ? { ...p, status: next } : p));
      }
    }
  };

  /* ====== CREATE ====== */
  const openCreate = () => setCreating(true);

  const closeCreate = () => {
    setCreating(false);
    setSaving(false);
    setFormNew({
      field_name: "",
      sport_type: SPORT_OPTIONS[0],
      price_per_hour: 0,
      address: shop ? (fields[0]?.address ?? "") : "",
      status: "trống",
    });
  };

  const onCreate = async () => {
    if (!shop) return;
    if (!formNew.field_name.trim() || !formNew.address.trim()) {
      alert("Vui lòng nhập Tên sân và Địa chỉ.");
      return;
    }
    setSaving(true);
    const created = await createShopField(shop.shop_code, {
      field_name: formNew.field_name.trim(),
      sport_type: formNew.sport_type,
      price_per_hour: Number(formNew.price_per_hour) || 0,
      address: formNew.address.trim(),
      status: formNew.status,
    });
    setFields((prev) => [created, ...prev]); // prepend để thấy ngay
    setSaving(false);
    closeCreate();
  };

  const hasFields = useMemo(() => fields.length > 0, [fields.length]);

  return (
    <>
      <div className="shop-header">
        <h1 className="shop-title">Sân của bạn</h1>
        <button className="btn-primary" onClick={openCreate}>
          <Plus className="w-4 h-4" />
          Thêm sân
        </button>
      </div>

      {loading ? (
        <div className="loading-wrap">
          <div className="spinner" />
        </div>
      ) : hasFields ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {fields.map((f) => (
            <div key={f.field_code} className="card">
              <div className="aspect-video rounded-lg overflow-hidden mb-3">
                <img
                  src={
                    f.images?.[0]?.image_url ||
                    "https://images.pexels.com/photos/274506/pexels-photo-274506.jpeg"
                  }
                  alt={f.field_name}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-bold text-gray-900">{f.field_name}</h3>
                  <div className="text-sm text-gray-500 capitalize">{f.sport_type}</div>
                </div>

                {/* Toggle bảo trì */}
                <button
                  onClick={() => onToggleMaintenance(f)}
                  className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs border
                    ${f.status === "bảo trì" ? "border-amber-400 text-amber-600 bg-amber-50" : "border-gray-200 text-gray-700 hover:bg-gray-50"}`}
                  title={f.status === "bảo trì" ? "Bỏ bảo trì" : "Đặt bảo trì"}
                >
                  <Wrench className="w-3.5 h-3.5" />
                  {f.status === "bảo trì" ? "Bỏ BT" : "Bảo trì"}
                </button>
              </div>

              <div className="mt-2 flex items-center gap-1 text-gray-700">
                <DollarSign className="w-4 h-4" />
                <span>{new Intl.NumberFormat("vi-VN").format(f.price_per_hour)}đ/giờ</span>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <span
                  className={`status-chip ${
                    f.status === "trống"
                      ? "status-trong"
                      : f.status === "bảo trì"
                      ? "status-bao-tri"
                      : "status-khac"
                  }`}
                >
                  {f.status}
                </span>

                <button onClick={() => onOpenEdit(f)} className="btn-ghost flex items-center gap-1">
                  <Pencil className="w-4 h-4" />
                  Chỉnh sửa
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card">Chưa có sân nào.</div>
      )}

      {/* ===== MODAL EDIT ===== */}
      {editing && form && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={onCloseEdit} />
          <div className="relative z-10 w-full max-w-lg rounded-2xl bg-white shadow-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">Chỉnh sửa sân #{editing.field_code}</h3>
              <button
                onClick={onCloseEdit}
                className="h-8 w-8 inline-flex items-center justify-center rounded-lg hover:bg-gray-100"
                title="Đóng"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <label className="block">
                <span className="text-sm text-gray-600">Tên sân</span>
                <input
                  className="input mt-1 w-full"
                  value={form.field_name}
                  onChange={(e) => setForm({ ...form, field_name: e.target.value })}
                />
              </label>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-sm text-gray-600">Loại môn</span>
                  <select
                    className="input mt-1 w-full"
                    value={form.sport_type}
                    onChange={(e) => setForm({ ...form, sport_type: e.target.value as SportType })}
                  >
                    {SPORT_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="text-sm text-gray-600">Giá / giờ</span>
                  <input
                    type="number"
                    min={0}
                    className="input mt-1 w-full"
                    value={form.price_per_hour}
                    onChange={(e) => setForm({ ...form, price_per_hour: Number(e.target.value) })}
                  />
                </label>
              </div>

              <label className="block">
                <span className="text-sm text-gray-600">Trạng thái</span>
                <select
                  className="input mt-1 w-full capitalize"
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as FieldStatus })}
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="mt-5 flex items-center justify-between">
              <button
                onClick={() => onToggleMaintenance(editing)}
                className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 border text-sm
                  ${form.status === "bảo trì"
                    ? "border-amber-400 text-amber-700 bg-amber-50"
                    : "border-gray-200 text-gray-700 hover:bg-gray-50"}`}
              >
                <Wrench className="w-4 h-4" />
                {form.status === "bảo trì" ? "Bỏ bảo trì" : "Đặt bảo trì"}
              </button>

              <div className="flex items-center gap-2">
                <button onClick={onCloseEdit} className="btn-ghost">Hủy</button>
                <button onClick={onSave} disabled={saving} className="btn-primary">
                  {saving ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== MODAL CREATE ===== */}
      {creating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={closeCreate} />
          <div className="relative z-10 w-full max-w-lg rounded-2xl bg-white shadow-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">Thêm sân mới</h3>
              <button
                onClick={closeCreate}
                className="h-8 w-8 inline-flex items-center justify-center rounded-lg hover:bg-gray-100"
                title="Đóng"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <label className="block">
                <span className="text-sm text-gray-600">Tên sân *</span>
                <input
                  className="input mt-1 w-full"
                  value={formNew.field_name}
                  onChange={(e) => setFormNew({ ...formNew, field_name: e.target.value })}
                  placeholder="VD: Sân bóng đá số 3"
                />
              </label>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-sm text-gray-600">Loại môn *</span>
                  <select
                    className="input mt-1 w-full"
                    value={formNew.sport_type}
                    onChange={(e) =>
                      setFormNew({ ...formNew, sport_type: e.target.value as SportType })
                    }
                  >
                    {SPORT_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="text-sm text-gray-600">Giá / giờ *</span>
                  <input
                    type="number"
                    min={0}
                    className="input mt-1 w-full"
                    value={formNew.price_per_hour}
                    onChange={(e) =>
                      setFormNew({ ...formNew, price_per_hour: Number(e.target.value) })
                    }
                    placeholder="VD: 150000"
                  />
                </label>
              </div>

              <label className="block">
                <span className="text-sm text-gray-600">Địa chỉ *</span>
                <input
                  className="input mt-1 w-full"
                  value={formNew.address}
                  onChange={(e) => setFormNew({ ...formNew, address: e.target.value })}
                  placeholder="VD: 123 Nguyễn Trãi, Quận 1, TP.HCM"
                />
              </label>

              <label className="block">
                <span className="text-sm text-gray-600">Trạng thái</span>
                <select
                  className="input mt-1 w-full capitalize"
                  value={formNew.status}
                  onChange={(e) =>
                    setFormNew({ ...formNew, status: e.target.value as FieldStatus })
                  }
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button onClick={closeCreate} className="btn-ghost">Hủy</button>
              <button onClick={onCreate} disabled={saving} className="btn-primary">
                {saving ? "Đang tạo..." : "Tạo sân"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ShopFieldsPage;
