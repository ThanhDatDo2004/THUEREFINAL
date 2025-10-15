// src/pages/shop/ShopFieldsPage.tsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import {
  fetchMyShop,
  fetchShopFields,
  updateShopField,
  updateShopFieldStatus,
  createShopField,
  deleteShopField,
} from "../../models/shop.api";
import {
  uploadFieldImage,
  type FieldsListResultNormalized,
} from "../../models/fields.api";
import type { FieldWithImages, Shops, Fields } from "../../types";
import {
  DollarSign,
  Pencil,
  Wrench,
  X,
  Plus,
  UploadCloud,
  Trash2,
  Loader2,
  RefreshCcw,
} from "lucide-react";
import {
  getFieldStatusClass,
  getFieldStatusLabel,
  getSportLabel,
  normalizeFieldStatusValue,
  normalizeSportTypeValue,
  resolveFieldPrice,
} from "../../utils/field-helpers";
import resolveImageUrl from "../../utils/image-helpers";

// ===== Kiểu union lấy trực tiếp từ types =====
type FieldStatus = NonNullable<Fields["status"]>;
type SportType = NonNullable<Fields["sport_type"]>;

type WardOption = {
  code: string;
  name: string;
};

type DistrictOption = {
  code: string;
  name: string;
  wards: WardOption[];
};

type ProvinceOption = {
  code: string;
  name: string;
  districts: DistrictOption[];
};

const DEFAULT_PROVINCES: ProvinceOption[] = [
  {
    code: "01",
    name: "Thành phố Hà Nội",
    districts: [
      {
        code: "001",
        name: "Quận Ba Đình",
        wards: [
          { code: "00001", name: "Phường Phúc Xá" },
          { code: "00004", name: "Phường Trúc Bạch" },
          { code: "00006", name: "Phường Vĩnh Phúc" },
        ],
      },
      {
        code: "002",
        name: "Quận Hoàn Kiếm",
        wards: [
          { code: "00007", name: "Phường Phan Chu Trinh" },
          { code: "00008", name: "Phường Hàng Bài" },
          { code: "00010", name: "Phường Lý Thái Tổ" },
        ],
      },
    ],
  },
  {
    code: "79",
    name: "Thành phố Hồ Chí Minh",
    districts: [
      {
        code: "760",
        name: "Quận 1",
        wards: [
          { code: "26734", name: "Phường Bến Nghé" },
          { code: "26737", name: "Phường Bến Thành" },
          { code: "26740", name: "Phường Nguyễn Thái Bình" },
        ],
      },
      {
        code: "769",
        name: "Thành phố Thủ Đức",
        wards: [
          { code: "26834", name: "Phường Linh Tây" },
          { code: "26837", name: "Phường Linh Chiểu" },
          { code: "26840", name: "Phường Linh Trung" },
        ],
      },
    ],
  },
  {
    code: "48",
    name: "Thành phố Đà Nẵng",
    districts: [
      {
        code: "490",
        name: "Quận Hải Châu",
        wards: [
          { code: "20224", name: "Phường Thạch Thang" },
          { code: "20227", name: "Phường Thanh Bình" },
          { code: "20230", name: "Phường Thuận Phước" },
        ],
      },
      {
        code: "492",
        name: "Quận Sơn Trà",
        wards: [
          { code: "20263", name: "Phường An Hải Bắc" },
          { code: "20266", name: "Phường An Hải Đông" },
          { code: "20269", name: "Phường An Hải Tây" },
        ],
      },
    ],
  },
];

// ===== Options khớp đúng union hiện có =====
const STATUS_OPTIONS = [
  { value: "active", label: getFieldStatusLabel("active") },
  { value: "maintenance", label: getFieldStatusLabel("maintenance") },
  { value: "inactive", label: getFieldStatusLabel("inactive") },
] as const satisfies readonly { value: FieldStatus; label: string }[];

const SPORT_OPTIONS = [
  { value: "football" as SportType, label: getSportLabel("football") },
  { value: "badminton" as SportType, label: getSportLabel("badminton") },
  { value: "tennis" as SportType, label: getSportLabel("tennis") },
  { value: "baseball" as SportType, label: getSportLabel("baseball") },
  { value: "swimming" as SportType, label: getSportLabel("swimming") },
] as const;

const SHOP_FIELDS_PAGE_SIZE = 24;
const MAX_UPLOAD_IMAGES = 5;

const normalizeName = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .trim()
    .toLowerCase();

// ===== Form state (edit) =====
type BaseFieldFormState = {
  field_name: string;
  sport_type: SportType;
  price_per_hour: number;
  provinceCode: string;
  districtCode: string;
  wardCode: string;
  street: string;
};

type FormState = BaseFieldFormState & {
  status: FieldStatus;
};

// ===== Form state (create) =====
type CreateFormState = BaseFieldFormState;

const ShopFieldsPage: React.FC = () => {
  const { user } = useAuth();
  const [shop, setShop] = useState<Shops | null>(null);
  const [fields, setFields] = useState<FieldWithImages[]>([]);
  const [listMeta, setListMeta] = useState({
    total: 0,
    page: 1,
    pageSize: SHOP_FIELDS_PAGE_SIZE,
  });
  const [loading, setLoading] = useState(true);

  // ===== Edit modal =====
  const [editing, setEditing] = useState<FieldWithImages | null>(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [editFormErrors, setEditFormErrors] = useState<
    Partial<Record<keyof FormState, string>>
  >({});
  const [imagesToDelete, setImagesToDelete] = useState<number[]>([]);
  const [editImageUploading, setEditImageUploading] = useState(false);
  const [editImageError, setEditImageError] = useState("");
  const [editSubmitError, setEditSubmitError] = useState("");

  // ===== Create modal =====
  const [creating, setCreating] = useState(false);
  const [formNew, setFormNew] = useState<CreateFormState>({
    field_name: "",
    sport_type: SPORT_OPTIONS[0].value,
    price_per_hour: 0,
    provinceCode: "",
    districtCode: "",
    wardCode: "",
    street: "",
  });
  const [newImages, setNewImages] = useState<
    Array<{ file: File; url: string }>
  >([]);
  const [createError, setCreateError] = useState("");
  const [formErrors, setFormErrors] = useState<
    Partial<Record<keyof CreateFormState, string>>
  >({});
  const [successMessage, setSuccessMessage] = useState("");
  const [provinces, setProvinces] = useState<ProvinceOption[]>([]);
  const [locationsLoading, setLocationsLoading] = useState(false);
  const [locationsError, setLocationsError] = useState("");

  const deriveLocationFromAddress = useCallback(
    (address: string) => {
      const defaultResult = {
        provinceCode: "",
        districtCode: "",
        wardCode: "",
        street: address?.trim() || "",
      };
      if (!address) {
        return defaultResult;
      }

      const parts = address
        .split(",")
        .map((part) => part.trim())
        .filter(Boolean);
      if (!parts.length) {
        return defaultResult;
      }

      let provinceName = "";
      let districtName = "";
      let wardName = "";
      let street = "";

      if (parts.length >= 3) {
        provinceName = parts[parts.length - 1] ?? "";
        districtName = parts[parts.length - 2] ?? "";
        wardName = parts[parts.length - 3] ?? "";
        street = parts.slice(0, parts.length - 3).join(", ");
      } else {
        provinceName = parts[parts.length - 1] ?? "";
        districtName = parts.length > 1 ? parts[parts.length - 2] : "";
        street = parts.slice(0, parts.length - 2).join(", ") || parts[0] || "";
      }

      if (!street) {
        street = parts.slice(0, parts.length - 1).join(", ") || parts[0] || "";
      }

      if (!provinces.length) {
        return {
          provinceCode: "",
          districtCode: "",
          wardCode: "",
          street,
        };
      }

      const province = provinces.find(
        (p) => normalizeName(p.name) === normalizeName(provinceName)
      );
      const district = province?.districts.find(
        (d) => normalizeName(d.name) === normalizeName(districtName)
      );
      const ward = district?.wards.find(
        (w) => normalizeName(w.name) === normalizeName(wardName)
      );

      return {
        provinceCode: province?.code ?? "",
        districtCode: district?.code ?? "",
        wardCode: ward?.code ?? "",
        street,
      };
    },
    [provinces]
  );

  useEffect(() => {
    if (!successMessage) return;
    const timer = setTimeout(() => setSuccessMessage(""), 4000);
    return () => clearTimeout(timer);
  }, [successMessage]);

  useEffect(() => {
    let cancelled = false;
    const loadLocations = async () => {
      setLocationsLoading(true);
      setLocationsError("");
      try {
        const response = await fetch(
          "https://provinces.open-api.vn/api/?depth=3"
        );
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const data = (await response.json()) as Array<{
          code: number | string;
          name: string;
          districts: Array<{
            code: number | string;
            name: string;
            wards: Array<{ code: number | string; name: string }>;
          }>;
        }>;
        if (!cancelled) {
          const mapped: ProvinceOption[] = data.map((province) => ({
            code: String(province.code),
            name: province.name,
            districts: province.districts.map((district) => ({
              code: String(district.code),
              name: district.name,
              wards:
                district.wards?.map((ward) => ({
                  code: String(ward.code),
                  name: ward.name,
                })) ?? [],
            })),
          }));
          setProvinces(mapped.length ? mapped : DEFAULT_PROVINCES);
        }
      } catch (error) {
        console.error("Failed to load provinces", error);
        if (!cancelled) {
          setLocationsError(
            "Không thể tải danh sách tỉnh/thành từ API. Đang dùng dữ liệu mặc định."
          );
          setProvinces(DEFAULT_PROVINCES);
        }
      } finally {
        if (!cancelled) {
          setLocationsLoading(false);
        }
      }
    };

    loadLocations();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let ignore = false;
    (async () => {
      if (!user?.user_code) return;
      setLoading(true);
      try {
        const s = await fetchMyShop();
        if (ignore) return;
        setShop(s ?? null);
        if (s) {
          const response = await fetchShopFields(s.shop_code, {
            page: 1,
            pageSize: SHOP_FIELDS_PAGE_SIZE,
          });
          if (ignore) return;
          const items = response.items ?? [];
          setFields(items);
          const pagination = response.meta?.pagination;
          setListMeta({
            total: pagination?.total ?? response.total ?? items.length,
            page: pagination?.page ?? response.page ?? 1,
            pageSize:
              pagination?.pageSize ??
              response.pageSize ??
              SHOP_FIELDS_PAGE_SIZE,
          });
        } else {
          setFields([]);
          setListMeta({
            total: 0,
            page: 1,
            pageSize: SHOP_FIELDS_PAGE_SIZE,
          });
        }
      } catch (error) {
        console.error(error);
        setFields([]);
        setListMeta({
          total: 0,
          page: 1,
          pageSize: SHOP_FIELDS_PAGE_SIZE,
        });
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.user_code]);

  const clearNewImages = useCallback(() => {
    setNewImages((prev) => {
      prev.forEach((entry) => URL.revokeObjectURL(entry.url));
      return [];
    });
  }, []);

  useEffect(() => {
    return () => {
      clearNewImages();
    };
  }, [clearNewImages]);

  const handleSelectImages = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files ?? []).filter((file) =>
        file.type.startsWith("image/")
      );
      if (!files.length) {
        event.target.value = "";
        return;
      }
      const mapped = files.map((file) => ({
        file,
        url: URL.createObjectURL(file),
      }));
      setNewImages((prev) => {
        const next = [...prev, ...mapped];
        if (next.length > MAX_UPLOAD_IMAGES) {
          next
            .slice(MAX_UPLOAD_IMAGES)
            .forEach((entry) => URL.revokeObjectURL(entry.url));
          return next.slice(0, MAX_UPLOAD_IMAGES);
        }
        return next;
      });
      event.target.value = "";
    },
    []
  );

  const handleRemoveNewImage = useCallback((index: number) => {
    setNewImages((prev) => {
      const next = [...prev];
      const [removed] = next.splice(index, 1);
      if (removed) {
        URL.revokeObjectURL(removed.url);
      }
      return next;
    });
  }, []);

  const handleEditSelectImages = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      if (!editing) {
        event.target.value = "";
        return;
      }
      const fieldCode = editing.field_code;
      const files = Array.from(event.target.files ?? []).filter((file) =>
        file.type.startsWith("image/")
      );
      event.target.value = "";
      if (!files.length) {
        return;
      }
      setEditImageUploading(true);
      setEditImageError("");
      try {
        for (const file of files) {
          const uploaded = await uploadFieldImage(fieldCode, file);
          setFields((prev) =>
            prev.map((item) =>
              item.field_code === fieldCode
                ? {
                    ...item,
                    images: [...(item.images ?? []), uploaded],
                  }
                : item
            )
          );
          setEditing((prev) =>
            prev && prev.field_code === fieldCode
              ? {
                  ...prev,
                  images: [...(prev.images ?? []), uploaded],
                }
              : prev
          );
        }
      } catch (error: any) {
        setEditImageError(
          error?.message || "Không thể tải ảnh. Vui lòng thử lại."
        );
      } finally {
        setEditImageUploading(false);
      }
    },
    [editing, setFields]
  );

  const validateForm = useCallback(
    (state: BaseFieldFormState) => {
      const errors: Partial<Record<keyof CreateFormState, string>> = {};
      if (!state.field_name.trim()) {
        errors.field_name = "Vui lòng nhập tên sân.";
      }
      const requireStructuredAddress = provinces.length > 0;
      if (requireStructuredAddress) {
        if (!state.provinceCode) {
          errors.provinceCode = "Vui lòng chọn tỉnh/thành.";
        }
        if (!state.districtCode) {
          errors.districtCode = "Vui lòng chọn quận/huyện.";
        }
        if (!state.wardCode) {
          errors.wardCode = "Vui lòng chọn phường/xã.";
        }
      }
      if (!state.street.trim()) {
        errors.street = "Vui lòng nhập số nhà, tên đường.";
      }
      if (!state.sport_type) {
        errors.sport_type = "Vui lòng chọn loại sân.";
      }
      const price = Number(state.price_per_hour);
      if (!Number.isFinite(price) || price < 0) {
        errors.price_per_hour = "Giá mỗi giờ phải lớn hơn hoặc bằng 0.";
      }
      return errors;
    },
    [provinces.length]
  );

  /* ====== EDIT ====== */
  const onOpenEdit = (f: FieldWithImages) => {
    setEditing(f);
    const location = deriveLocationFromAddress(f.address ?? "");
    setForm({
      field_name: f.field_name,
      sport_type:
        (normalizeSportTypeValue(f.sport_type) as unknown as SportType) ??
        SPORT_OPTIONS[0].value,
      price_per_hour: resolveFieldPrice(f),
      status:
        (normalizeFieldStatusValue(f.status) as FieldStatus) ??
        STATUS_OPTIONS[0].value,
      provinceCode: location.provinceCode,
      districtCode: location.districtCode,
      wardCode: location.wardCode,
      street: location.street,
    });
    setEditFormErrors({});
    setEditImageError("");
    setEditSubmitError("");
    setImagesToDelete([]);
  };

  const onCloseEdit = () => {
    setEditing(null);
    setForm(null);
    setSaving(false);
    setEditFormErrors({});
    setEditImageError("");
    setEditImageUploading(false);
    setEditSubmitError("");
    setImagesToDelete([]);
  };

  const onSave = async () => {
    if (!editing || !form) return;
    const errors = validateForm(form);
    if (Object.keys(errors).length) {
      setEditFormErrors(errors as Partial<Record<keyof FormState, string>>);
      return;
    }
    setEditFormErrors({});
    setEditSubmitError("");
    setSaving(true);
    const provinceName = editSelectedProvince?.name ?? "";
    const districtName = editSelectedDistrict?.name ?? "";
    const wardName = editSelectedWard?.name ?? "";
    const composedAddress = [
      form.street.trim(),
      wardName,
      districtName,
      provinceName,
    ]
      .filter(Boolean)
      .join(", ");
    try {
      const updated = await updateShopField(editing.field_code, {
        field_name: form.field_name.trim(),
        sport_type: form.sport_type,
        price_per_hour: Number(form.price_per_hour) || 0,
        address: composedAddress,
        status: form.status,
        deleted_images: imagesToDelete,
      });
      if (updated) {
        setFields((prev) =>
          prev.map((x) =>
            x.field_code === updated.field_code ? { ...x, ...updated } : x
          )
        );
        setEditing((prev) =>
          prev && prev.field_code === updated.field_code
            ? { ...prev, ...updated }
            : updated ?? prev
        );
        setSuccessMessage(
          `Đã cập nhật sân "${updated.field_name}" thành công.`
        );
        const derived = deriveLocationFromAddress(
          updated?.address ?? composedAddress
        );
        setForm((prev) =>
          prev
            ? {
                ...prev,
                provinceCode: derived.provinceCode || prev.provinceCode,
                districtCode: derived.districtCode || prev.districtCode,
                wardCode: derived.wardCode || prev.wardCode,
                street: derived.street || prev.street,
              }
            : prev
        );
        onCloseEdit();
      }
    } catch (error: any) {
      setEditSubmitError(
        error?.message || "Không thể lưu thay đổi. Vui lòng thử lại."
      );
    } finally {
      setSaving(false);
    }
  };

  const toggleImageForDeletion = (imageId: number) => {
    setImagesToDelete((prev) => {
      if (prev.includes(imageId)) {
        return prev.filter((id) => id !== imageId);
      }
      return [...prev, imageId];
    });
  };
  const onToggleMaintenance = async (f: FieldWithImages) => {
    const raw = f.status ? f.status.toString().trim().toLowerCase() : "";
    const isMaintenance = ["bảo trì", "maintenance", "on_maintenance"].includes(
      raw
    );
    const next: FieldStatus = isMaintenance ? "active" : "maintenance";
    const updated = await updateShopFieldStatus(f.field_code, next);
    if (updated) {
      setFields((prev) =>
        prev.map((x) =>
          x.field_code === updated.field_code ? { ...x, status: next } : x
        )
      );
      if (editing && editing.field_code === f.field_code) {
        setForm((p) => (p ? { ...p, status: next } : p));
      }
      setEditing((prev) =>
        prev && prev.field_code === f.field_code
          ? { ...prev, status: next }
          : prev
      );
    }
  };

  const onDeleteField = async () => {
    if (!editing) return;

    const confirmed = window.confirm(
      `Bạn có chắc chắn muốn xoá sân "${editing.field_name}" không? Hành động này không thể hoàn tác.`
    );

    if (confirmed) {
      try {
        const result = await deleteShopField(editing.field_code);
        if (!result || result.deleted !== true) {
          throw new Error("Xoá sân không thành công.");
        }
        setFields((prev) =>
          prev.filter((f) => f.field_code !== editing.field_code)
        );
        setListMeta((prev) => ({
          ...prev,
          total: Math.max(0, prev.total - 1),
        }));
        setSuccessMessage(`Đã xoá sân "${editing.field_name}" thành công.`);
        onCloseEdit();
      } catch (error: any) {
        setEditSubmitError(
          error?.message || "Không thể xoá sân. Vui lòng thử lại."
        );
      }
    }
  };

  /* ====== CREATE ====== */
  const openCreate = () => {
    setCreateError("");
    setFormErrors({});
    setCreating(true);
  };

  const closeCreate = () => {
    setCreating(false);
    setSaving(false);
    setCreateError("");
    setFormErrors({});
    clearNewImages();
    setFormNew({
      field_name: "",
      sport_type: SPORT_OPTIONS[0].value,
      price_per_hour: 0,
      provinceCode: "",
      districtCode: "",
      wardCode: "",
      street: "",
    });
  };

  const onCreate = async () => {
    if (!shop) return;
    const errors = validateForm(formNew);
    if (Object.keys(errors).length) {
      setFormErrors(errors);
      return;
    }
    setSaving(true);
    setCreateError("");
    try {
      const provinceName = selectedProvince?.name ?? "";
      const districtName = selectedDistrict?.name ?? "";
      const wardName = selectedWard?.name ?? "";
      const composedAddress = [
        formNew.street.trim(),
        wardName,
        districtName,
        provinceName,
      ]
        .filter(Boolean)
        .join(", ");

      const created = await createShopField(shop.shop_code, {
        field_name: formNew.field_name.trim(),
        sport_type: formNew.sport_type,
        price_per_hour: Number(formNew.price_per_hour) || 0,
        address: composedAddress,
        status: "active",
        images: newImages.map((entry) => entry.file),
      });

      let refreshed: FieldsListResultNormalized | null = null;
      try {
        refreshed = await fetchShopFields(shop.shop_code, {
          page: 1,
          pageSize: listMeta.pageSize || SHOP_FIELDS_PAGE_SIZE,
        });
      } catch (refreshError) {
        console.error(refreshError);
      }

      if (refreshed) {
        const items = refreshed.items ?? [];
        setFields(items);
        const pagination = refreshed.meta?.pagination;
        setListMeta({
          total: pagination?.total ?? refreshed.total ?? items.length,
          page: pagination?.page ?? refreshed.page ?? 1,
          pageSize:
            pagination?.pageSize ??
            refreshed.pageSize ??
            (listMeta.pageSize || SHOP_FIELDS_PAGE_SIZE),
        });
      } else {
        setFields((prev) => [created, ...prev]);
        setListMeta((prev) => ({
          ...prev,
          total: prev.total + 1,
        }));
      }

      closeCreate();
      setSuccessMessage(`Đã tạo sân "${created.field_name}" thành công.`);
    } catch (error: any) {
      setCreateError(
        error?.message || "Không thể tạo sân mới. Vui lòng thử lại."
      );
    } finally {
      setSaving(false);
    }
  };

  const hasFields = useMemo(() => fields.length > 0, [fields.length]);

  const selectedProvince = useMemo(
    () => provinces.find((p) => p.code === formNew.provinceCode) ?? null,
    [provinces, formNew.provinceCode]
  );

  const availableDistricts = selectedProvince?.districts ?? [];

  const selectedDistrict = useMemo(
    () =>
      availableDistricts.find((d) => d.code === formNew.districtCode) ?? null,
    [availableDistricts, formNew.districtCode]
  );

  const availableWards = selectedDistrict?.wards ?? [];

  const selectedWard = useMemo(
    () => availableWards.find((w) => w.code === formNew.wardCode) ?? null,
    [availableWards, formNew.wardCode]
  );

  const editSelectedProvince = useMemo(() => {
    if (!form) return null;
    return provinces.find((p) => p.code === form.provinceCode) ?? null;
  }, [form?.provinceCode, provinces]);

  const editAvailableDistricts = editSelectedProvince?.districts ?? [];

  const editSelectedDistrict = useMemo(() => {
    if (!form) return null;
    return (
      editAvailableDistricts.find((d) => d.code === form.districtCode) ?? null
    );
  }, [editAvailableDistricts, form?.districtCode]);

  const editAvailableWards = editSelectedDistrict?.wards ?? [];

  const editSelectedWard = useMemo(() => {
    if (!form) return null;
    return editAvailableWards.find((w) => w.code === form.wardCode) ?? null;
  }, [editAvailableWards, form?.wardCode]);

  useEffect(() => {
    if (!provinces.length) {
      return;
    }

    if (!selectedProvince) {
      if (formNew.provinceCode || formNew.districtCode || formNew.wardCode) {
        setFormNew((prev) => ({
          ...prev,
          provinceCode: "",
          districtCode: "",
          wardCode: "",
        }));
      }
      return;
    }

    if (
      !availableDistricts.some(
        (district) => district.code === formNew.districtCode
      )
    ) {
      setFormNew((prev) => ({
        ...prev,
        districtCode: "",
        wardCode: "",
      }));
    }
  }, [
    provinces.length,
    selectedProvince,
    availableDistricts,
    formNew.districtCode,
    formNew.provinceCode,
    formNew.wardCode,
  ]);

  useEffect(() => {
    if (!provinces.length) {
      return;
    }

    if (!selectedDistrict) {
      if (formNew.wardCode) {
        setFormNew((prev) => ({
          ...prev,
          wardCode: "",
        }));
      }
      return;
    }

    if (!availableWards.some((ward) => ward.code === formNew.wardCode)) {
      setFormNew((prev) => ({
        ...prev,
        wardCode: "",
      }));
    }
  }, [provinces.length, selectedDistrict, availableWards, formNew.wardCode]);

  useEffect(() => {
    if (!form || !provinces.length) return;

    if (!editSelectedProvince) {
      if (form.provinceCode || form.districtCode || form.wardCode) {
        setForm((prev) =>
          prev
            ? {
                ...prev,
                provinceCode: "",
                districtCode: "",
                wardCode: "",
              }
            : prev
        );
      }
      return;
    }

    if (
      !editAvailableDistricts.some(
        (district) => district.code === form.districtCode
      )
    ) {
      setForm((prev) =>
        prev
          ? {
              ...prev,
              districtCode: "",
              wardCode: "",
            }
          : prev
      );
    }
  }, [
    editAvailableDistricts,
    editSelectedProvince,
    form?.provinceCode,
    form?.districtCode,
    provinces.length,
  ]);

  useEffect(() => {
    if (!form || !provinces.length) return;

    if (!editSelectedDistrict) {
      if (form.wardCode) {
        setForm((prev) =>
          prev
            ? {
                ...prev,
                wardCode: "",
              }
            : prev
        );
      }
      return;
    }

    if (!editAvailableWards.some((ward) => ward.code === form.wardCode)) {
      setForm((prev) =>
        prev
          ? {
              ...prev,
              wardCode: "",
            }
          : prev
      );
    }
  }, [
    editAvailableWards,
    editSelectedDistrict,
    form?.wardCode,
    provinces.length,
  ]);

  useEffect(() => {
    if (!editing || !form || !provinces.length) return;
    if (form.provinceCode || form.districtCode || form.wardCode) return;
    if (!editing.address) return;

    const derived = deriveLocationFromAddress(editing.address);
    if (
      derived.provinceCode ||
      derived.districtCode ||
      derived.wardCode ||
      derived.street
    ) {
      setForm((prev) =>
        prev
          ? {
              ...prev,
              provinceCode: derived.provinceCode,
              districtCode: derived.districtCode,
              wardCode: derived.wardCode,
              street: derived.street || prev.street,
            }
          : prev
      );
    }
  }, [deriveLocationFromAddress, editing, provinces.length]);

  return (
    <>
      <div className="shop-header">
        <div>
          <h1 className="shop-title">
            Sân của bạn{" "}
            {listMeta.total ? (
              <span className="text-sm font-normal text-gray-500">
                ({listMeta.total})
              </span>
            ) : null}
          </h1>
          <p className="shop-sub text-sm text-gray-500">
            Quản lý danh sách sân và cập nhật trạng thái hoạt động nhanh chóng.
          </p>
        </div>
        <button className="btn-primary" onClick={openCreate}>
          <Plus className="w-4 h-4" />
          Thêm sân
        </button>
      </div>

      {successMessage && (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-700">
          {successMessage}
        </div>
      )}

      {loading ? (
        <div className="loading-wrap">
          <div className="spinner" />
        </div>
      ) : hasFields ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {fields.map((f) => {
            const statusLabel = getFieldStatusLabel(f.status);
            const statusClassName = getFieldStatusClass(f.status);
            const priceValue = resolveFieldPrice(f);
            const statusRaw = f.status
              ? f.status.toString().trim().toLowerCase()
              : "";
            const isMaintenance = [
              "maintenance",
              "bảo trì",
              "on_maintenance",
            ].includes(statusRaw);
            const primaryImage = f.images?.[0];
            const coverImage =
              resolveImageUrl(primaryImage?.image_url, primaryImage?.storage) ||
              "https://images.pexels.com/photos/274506/pexels-photo-274506.jpeg";

            return (
              <div key={f.field_code} className="card">
                <div className="aspect-video rounded-lg overflow-hidden mb-3">
                  <img
                    src={coverImage}
                    alt={f.field_name}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-gray-900">{f.field_name}</h3>
                    <div className="text-sm text-gray-500">
                      {getSportLabel(f.sport_type)}
                    </div>
                  </div>

                  {/* Toggle bảo trì */}
                  <button
                    onClick={() => onToggleMaintenance(f)}
                    className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs border ${
                      isMaintenance
                        ? "border-amber-400 text-amber-600 bg-amber-50"
                        : "border-gray-200 text-gray-700 hover:bg-gray-50"
                    }`}
                    title={isMaintenance ? "Bỏ bảo trì" : "Đặt bảo trì"}
                  >
                    <Wrench className="w-3.5 h-3.5" />
                    {isMaintenance ? "Bỏ BT" : "Bảo trì"}
                  </button>
                </div>

                <div className="mt-2 flex items-center gap-1 text-gray-700">
                  <DollarSign className="w-4 h-4" />
                  <span>
                    {new Intl.NumberFormat("vi-VN").format(priceValue)}đ/giờ
                  </span>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <span className={statusClassName}>{statusLabel}</span>

                  <button
                    onClick={() => onOpenEdit(f)}
                    className="btn-ghost flex items-center gap-1"
                  >
                    <Pencil className="w-4 h-4" />
                    Chỉnh sửa
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card">Chưa có sân nào.</div>
      )}

      {/* ===== MODAL EDIT ===== */}
      {editing && form && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:p-6">
          <div className="absolute inset-0 bg-black/40" onClick={onCloseEdit} />
          <div className="relative z-10 mt-12 w-full max-w-lg rounded-2xl bg-white shadow-xl border border-gray-200 p-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">
                Chỉnh sửa sân #{editing.field_code}
              </h3>
              <button
                onClick={onCloseEdit}
                className="h-8 w-8 inline-flex items-center justify-center rounded-lg hover:bg-gray-100"
                title="Đóng"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              className="grid grid-cols-1 gap-4"
              onSubmit={(event) => {
                event.preventDefault();
                onSave();
              }}
            >
              {editSubmitError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {editSubmitError}
                </div>
              )}

              <label className="block">
                <span className="text-sm text-gray-600">Tên sân *</span>
                <input
                  className="input mt-1 w-full"
                  value={form.field_name}
                  onChange={(e) => {
                    const value = e.target.value;
                    setForm((prev) =>
                      prev ? { ...prev, field_name: value } : prev
                    );
                    setEditFormErrors((prev) => ({
                      ...prev,
                      field_name: undefined,
                    }));
                  }}
                  placeholder="VD: Sân bóng đá số 3"
                />
                {editFormErrors.field_name && (
                  <p className="mt-1 text-sm text-red-600">
                    {editFormErrors.field_name}
                  </p>
                )}
              </label>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-sm text-gray-600">Loại môn *</span>
                  <select
                    className="input mt-1 w-full"
                    value={form.sport_type}
                    onChange={(e) => {
                      const value = e.target.value as SportType;
                      setForm((prev) =>
                        prev ? { ...prev, sport_type: value } : prev
                      );
                      setEditFormErrors((prev) => ({
                        ...prev,
                        sport_type: undefined,
                      }));
                    }}
                  >
                    {SPORT_OPTIONS.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                  {editFormErrors.sport_type && (
                    <p className="mt-1 text-sm text-red-600">
                      {editFormErrors.sport_type}
                    </p>
                  )}
                </label>

                <label className="block">
                  <span className="text-sm text-gray-600">Giá / giờ *</span>
                  <input
                    type="number"
                    min={0}
                    className="input mt-1 w-full"
                    value={form.price_per_hour}
                    onChange={(e) => {
                      const value = Number(e.target.value);
                      setForm((prev) =>
                        prev ? { ...prev, price_per_hour: value } : prev
                      );
                      setEditFormErrors((prev) => ({
                        ...prev,
                        price_per_hour: undefined,
                      }));
                    }}
                    placeholder="VD: 150000"
                  />
                  {editFormErrors.price_per_hour && (
                    <p className="mt-1 text-sm text-red-600">
                      {editFormErrors.price_per_hour}
                    </p>
                  )}
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <label className="block">
                  <span className="text-sm text-gray-600">Tỉnh / Thành *</span>
                  <select
                    className="input mt-1 w-full"
                    value={form.provinceCode}
                    onChange={(e) => {
                      const value = e.target.value;
                      setForm((prev) =>
                        prev
                          ? {
                              ...prev,
                              provinceCode: value,
                              districtCode: "",
                              wardCode: "",
                            }
                          : prev
                      );
                      setEditFormErrors((prev) => ({
                        ...prev,
                        provinceCode: undefined,
                        districtCode: undefined,
                        wardCode: undefined,
                      }));
                    }}
                    disabled={locationsLoading || !provinces.length}
                  >
                    <option value="" disabled>
                      {locationsLoading ? "Đang tải..." : "Chọn tỉnh / thành"}
                    </option>
                    {provinces.map((province) => (
                      <option key={province.code} value={province.code}>
                        {province.name}
                      </option>
                    ))}
                  </select>
                  {editFormErrors.provinceCode && (
                    <p className="mt-1 text-sm text-red-600">
                      {editFormErrors.provinceCode}
                    </p>
                  )}
                </label>

                <label className="block">
                  <span className="text-sm text-gray-600">Quận / Huyện *</span>
                  <select
                    className="input mt-1 w-full"
                    value={form.districtCode}
                    onChange={(e) => {
                      const value = e.target.value;
                      setForm((prev) =>
                        prev
                          ? {
                              ...prev,
                              districtCode: value,
                              wardCode: "",
                            }
                          : prev
                      );
                      setEditFormErrors((prev) => ({
                        ...prev,
                        districtCode: undefined,
                        wardCode: undefined,
                      }));
                    }}
                    disabled={
                      !editSelectedProvince ||
                      editAvailableDistricts.length === 0
                    }
                  >
                    <option value="" disabled>
                      {!editSelectedProvince
                        ? "Chọn tỉnh trước"
                        : "Chọn quận / huyện"}
                    </option>
                    {editAvailableDistricts.map((district) => (
                      <option key={district.code} value={district.code}>
                        {district.name}
                      </option>
                    ))}
                  </select>
                  {editFormErrors.districtCode && (
                    <p className="mt-1 text-sm text-red-600">
                      {editFormErrors.districtCode}
                    </p>
                  )}
                </label>

                <label className="block">
                  <span className="text-sm text-gray-600">Phường / Xã *</span>
                  <select
                    className="input mt-1 w-full"
                    value={form.wardCode}
                    onChange={(e) => {
                      const value = e.target.value;
                      setForm((prev) =>
                        prev ? { ...prev, wardCode: value } : prev
                      );
                      setEditFormErrors((prev) => ({
                        ...prev,
                        wardCode: undefined,
                      }));
                    }}
                    disabled={
                      !editSelectedDistrict || editAvailableWards.length === 0
                    }
                  >
                    <option value="" disabled>
                      {!editSelectedDistrict
                        ? "Chọn quận/huyện trước"
                        : "Chọn phường / xã"}
                    </option>
                    {editAvailableWards.map((ward) => (
                      <option key={ward.code} value={ward.code}>
                        {ward.name}
                      </option>
                    ))}
                  </select>
                  {editFormErrors.wardCode && (
                    <p className="mt-1 text-sm text-red-600">
                      {editFormErrors.wardCode}
                    </p>
                  )}
                </label>
              </div>

              <label className="block">
                <span className="text-sm text-gray-600">
                  Số nhà, tên đường *
                </span>
                <input
                  className="input mt-1 w-full"
                  value={form.street}
                  onChange={(e) => {
                    const value = e.target.value;
                    setForm((prev) =>
                      prev ? { ...prev, street: value } : prev
                    );
                    setEditFormErrors((prev) => ({
                      ...prev,
                      street: undefined,
                    }));
                  }}
                  placeholder="VD: 123 Nguyễn Trãi"
                />
                {editFormErrors.street && (
                  <p className="mt-1 text-sm text-red-600">
                    {editFormErrors.street}
                  </p>
                )}
              </label>

              <label className="block">
                <span className="text-sm text-gray-600">Trạng thái</span>
                <select
                  className="input mt-1 w-full capitalize"
                  value={form.status}
                  onChange={(e) => {
                    const value = e.target.value as FieldStatus;
                    setForm((prev) =>
                      prev ? { ...prev, status: value } : prev
                    );
                  }}
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </label>

              <div>
                <span className="text-sm text-gray-600">Ảnh hiện có</span>
                {editing.images?.length ? (
                  <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {editing.images.map((img, idx) => {
                      const src = resolveImageUrl(img.image_url, img.storage);
                      const isPrimary = Number(img.sort_order ?? 0) === 0;
                      const imageId =
                        (img as any).image_code ?? (img as any).image_id;
                      const key = imageId ?? `${idx}-${src}`;
                      const isMarkedForDeletion = imageId
                        ? imagesToDelete.includes(imageId)
                        : false;

                      return (
                        <div
                          key={key}
                          className={`relative h-24 w-full overflow-hidden rounded-xl border ${
                            isMarkedForDeletion
                              ? "border-red-300"
                              : "border-gray-200"
                          }`}
                        >
                          {src ? (
                            <img
                              src={src}
                              alt={`Ảnh sân hiện có ${idx + 1}`}
                              className={`h-full w-full object-cover transition-opacity ${
                                isMarkedForDeletion ? "opacity-40" : ""
                              }`}
                            />
                          ) : (
                            <div className="h-full w-full bg-gray-100" />
                          )}
                          {imageId && (
                            <button
                              type="button"
                              onClick={() => toggleImageForDeletion(imageId)}
                              className={`absolute top-1 right-1 z-10 flex h-7 w-7 items-center justify-center rounded-full shadow-md transition-colors ${
                                isMarkedForDeletion
                                  ? "bg-red-500 text-white"
                                  : "bg-white/80 text-gray-700 hover:bg-white"
                              }`}
                              title={
                                isMarkedForDeletion
                                  ? "Hoàn tác xóa"
                                  : "Xóa ảnh này"
                              }
                            >
                              {isMarkedForDeletion ? (
                                <RefreshCcw className="h-4 w-4" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </button>
                          )}
                          {isPrimary && (
                            <span className="absolute left-1 bottom-1 rounded-full bg-emerald-500 px-2 py-0.5 text-xs font-semibold text-white shadow">
                              Ảnh chính
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-gray-500">
                    Chưa có ảnh nào cho sân này.
                  </p>
                )}

                <label className="mt-3 flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-center text-sm text-gray-600 hover:bg-gray-100">
                  <UploadCloud className="h-5 w-5 text-gray-500" />
                  <span>Thêm ảnh mới cho sân</span>
                  <input
                    type="file"
                    className="sr-only"
                    accept="image/*"
                    multiple
                    onChange={handleEditSelectImages}
                  />
                </label>

                {editImageUploading && (
                  <p className="mt-2 flex items-center gap-2 text-sm text-gray-600">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Đang tải ảnh...
                  </p>
                )}

                {editImageError && (
                  <div className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {editImageError}
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={onDeleteField}
                  className="btn-danger flex items-center gap-1"
                >
                  <Trash2 className="w-4 h-4" />
                  Xoá sân
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onCloseEdit}
                    className="btn-ghost"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={saving || editImageUploading}
                    className="btn-primary"
                  >
                    {saving ? "Đang lưu..." : "Lưu thay đổi"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== MODAL CREATE ===== */}
      {creating && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:p-6">
          <div className="absolute inset-0 bg-black/40" onClick={closeCreate} />
          <div className="relative z-10 mt-12 w-full max-w-lg rounded-2xl bg-white shadow-xl border border-gray-200 p-5 max-h-[90vh] overflow-y-auto">
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

            <form
              className="grid grid-cols-1 gap-4"
              onSubmit={(event) => {
                event.preventDefault();
                onCreate();
              }}
            >
              <label className="block">
                <span className="text-sm text-gray-600">Tên sân *</span>
                <input
                  className="input mt-1 w-full"
                  value={formNew.field_name}
                  onChange={(e) => {
                    setFormNew({ ...formNew, field_name: e.target.value });
                    setFormErrors((prev) => ({
                      ...prev,
                      field_name: undefined,
                    }));
                  }}
                  placeholder="VD: Sân bóng đá số 3"
                />
                {formErrors.field_name && (
                  <p className="mt-1 text-sm text-red-600">
                    {formErrors.field_name}
                  </p>
                )}
              </label>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-sm text-gray-600">Loại môn *</span>
                  <select
                    className="input mt-1 w-full"
                    value={formNew.sport_type}
                    onChange={(e) => {
                      setFormNew({
                        ...formNew,
                        sport_type: e.target.value as SportType,
                      });
                      setFormErrors((prev) => ({
                        ...prev,
                        sport_type: undefined,
                      }));
                    }}
                  >
                    {SPORT_OPTIONS.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                  {formErrors.sport_type && (
                    <p className="mt-1 text-sm text-red-600">
                      {formErrors.sport_type}
                    </p>
                  )}
                </label>

                <label className="block">
                  <span className="text-sm text-gray-600">Giá / giờ *</span>
                  <input
                    type="number"
                    min={0}
                    className="input mt-1 w-full"
                    value={formNew.price_per_hour}
                    onChange={(e) => {
                      setFormNew({
                        ...formNew,
                        price_per_hour: Number(e.target.value),
                      });
                      setFormErrors((prev) => ({
                        ...prev,
                        price_per_hour: undefined,
                      }));
                    }}
                    placeholder="VD: 150000"
                  />
                  {formErrors.price_per_hour && (
                    <p className="mt-1 text-sm text-red-600">
                      {formErrors.price_per_hour}
                    </p>
                  )}
                </label>
              </div>

              {locationsError && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
                  {locationsError}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <label className="block">
                  <span className="text-sm text-gray-600">Tỉnh / Thành *</span>
                  <select
                    className="input mt-1 w-full"
                    value={formNew.provinceCode}
                    onChange={(e) => {
                      const value = e.target.value;
                      setFormNew((prev) => ({
                        ...prev,
                        provinceCode: value,
                        districtCode: "",
                        wardCode: "",
                      }));
                      setFormErrors((prev) => ({
                        ...prev,
                        provinceCode: undefined,
                        districtCode: undefined,
                        wardCode: undefined,
                      }));
                    }}
                    disabled={locationsLoading || !provinces.length}
                  >
                    <option value="" disabled>
                      {locationsLoading ? "Đang tải..." : "Chọn tỉnh / thành"}
                    </option>
                    {provinces.map((province) => (
                      <option key={province.code} value={province.code}>
                        {province.name}
                      </option>
                    ))}
                  </select>
                  {formErrors.provinceCode && (
                    <p className="mt-1 text-sm text-red-600">
                      {formErrors.provinceCode}
                    </p>
                  )}
                </label>

                <label className="block">
                  <span className="text-sm text-gray-600">Quận / Huyện *</span>
                  <select
                    className="input mt-1 w-full"
                    value={formNew.districtCode}
                    onChange={(e) => {
                      const value = e.target.value;
                      setFormNew((prev) => ({
                        ...prev,
                        districtCode: value,
                        wardCode: "",
                      }));
                      setFormErrors((prev) => ({
                        ...prev,
                        districtCode: undefined,
                        wardCode: undefined,
                      }));
                    }}
                    disabled={
                      !selectedProvince || availableDistricts.length === 0
                    }
                  >
                    <option value="" disabled>
                      {!selectedProvince
                        ? "Chọn tỉnh trước"
                        : "Chọn quận / huyện"}
                    </option>
                    {availableDistricts.map((district) => (
                      <option key={district.code} value={district.code}>
                        {district.name}
                      </option>
                    ))}
                  </select>
                  {formErrors.districtCode && (
                    <p className="mt-1 text-sm text-red-600">
                      {formErrors.districtCode}
                    </p>
                  )}
                </label>

                <label className="block">
                  <span className="text-sm text-gray-600">Phường / Xã *</span>
                  <select
                    className="input mt-1 w-full"
                    value={formNew.wardCode}
                    onChange={(e) => {
                      setFormNew((prev) => ({
                        ...prev,
                        wardCode: e.target.value,
                      }));
                      setFormErrors((prev) => ({
                        ...prev,
                        wardCode: undefined,
                      }));
                    }}
                    disabled={!selectedDistrict || availableWards.length === 0}
                  >
                    <option value="" disabled>
                      {!selectedDistrict
                        ? "Chọn quận/huyện trước"
                        : "Chọn phường / xã"}
                    </option>
                    {availableWards.map((ward) => (
                      <option key={ward.code} value={ward.code}>
                        {ward.name}
                      </option>
                    ))}
                  </select>
                  {formErrors.wardCode && (
                    <p className="mt-1 text-sm text-red-600">
                      {formErrors.wardCode}
                    </p>
                  )}
                </label>
              </div>

              <label className="block">
                <span className="text-sm text-gray-600">
                  Số nhà, tên đường *
                </span>
                <input
                  className="input mt-1 w-full"
                  value={formNew.street}
                  onChange={(e) => {
                    setFormNew({ ...formNew, street: e.target.value });
                    setFormErrors((prev) => ({ ...prev, street: undefined }));
                  }}
                  placeholder="VD: 123 Nguyễn Trãi"
                />
                {formErrors.street && (
                  <p className="mt-1 text-sm text-red-600">
                    {formErrors.street}
                  </p>
                )}
              </label>

              <div>
                <span className="text-sm text-gray-600">Ảnh sân</span>
                <label className="mt-1 flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-center text-sm text-gray-600 hover:bg-gray-100">
                  <UploadCloud className="h-5 w-5 text-gray-500" />
                  <span>Chọn ảnh (tối đa {MAX_UPLOAD_IMAGES} ảnh mỗi lần)</span>
                  <input
                    type="file"
                    className="sr-only"
                    accept="image/*"
                    multiple
                    onChange={handleSelectImages}
                  />
                </label>

                {newImages.length > 0 && (
                  <>
                    <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <p className="col-span-3 text-xs text-gray-500">
                        Đã chọn {newImages.length}/{MAX_UPLOAD_IMAGES} ảnh. Ảnh
                        đầu tiên sẽ được ưu tiên hiển thị trên danh sách.
                      </p>
                      {newImages.map((img, idx) => (
                        <div
                          key={`${img.url}-${idx}`}
                          className="relative h-24 w-full overflow-hidden rounded-xl border border-gray-200"
                        >
                          <img
                            src={img.url}
                            alt={`Ảnh sân ${idx + 1}`}
                            className="h-full w-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveNewImage(idx)}
                            className="absolute right-1 top-1 inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-gray-600 shadow hover:bg-white"
                            title="Xóa ảnh"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={clearNewImages}
                      className="mt-3 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
                    >
                      <Trash2 className="h-4 w-4" />
                      Xóa tất cả ảnh đã chọn
                    </button>
                  </>
                )}
              </div>
              {createError && (
                <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 whitespace-pre-wrap break-words">
                  {createError}
                </div>
              )}

              <div className="mt-5 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={closeCreate}
                  className="btn-ghost"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary min-w-[120px] justify-center"
                >
                  {saving ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Đang tạo...
                    </span>
                  ) : (
                    "Tạo sân"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default ShopFieldsPage;
