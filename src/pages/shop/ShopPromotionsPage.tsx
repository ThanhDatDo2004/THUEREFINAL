import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import {
  Loader2,
  Plus,
  RefreshCcw,
  Pause,
  Play,
  Search,
  Sparkles,
  CalendarClock,
  ArrowUpRight,
} from "lucide-react";
import {
  createShopPromotion,
  fetchShopPromotions,
  deleteShopPromotion,
  updateShopPromotionStatus,
  type ShopPromotionInput,
} from "../../models/promotions.api";
import type { ShopPromotion, ShopPromotionStatus } from "../../types";

const promotionFormSchema = yup
  .object({
    promotion_code: yup
      .string()
      .trim()
      .required("Vui lòng nhập mã khuyến mãi")
      .matches(/^[A-Z0-9_-]+$/i, "Mã chỉ gồm chữ, số, dấu gạch ngang hoặc gạch dưới")
      .min(3, "Mã khuyến mãi phải có ít nhất 3 ký tự")
      .max(50, "Mã khuyến mãi không được vượt quá 50 ký tự"),
    title: yup
      .string()
      .trim()
      .required("Vui lòng nhập tiêu đề chiến dịch")
      .min(3, "Tiêu đề phải có ít nhất 3 ký tự")
      .max(150, "Tiêu đề không được vượt quá 150 ký tự"),
    description: yup
      .string()
      .trim()
      .max(2000, "Mô tả không được vượt quá 2000 ký tự")
      .optional(),
    discount_type: yup
      .mixed<"percent" | "fixed">()
      .oneOf(["percent", "fixed"], "Loại giảm giá không hợp lệ")
      .required(),
    discount_value: yup
      .number()
      .typeError("Giá trị giảm không hợp lệ")
      .positive("Giá trị giảm phải lớn hơn 0")
      .when("discount_type", {
        is: "percent",
        then: (schema) => schema.max(100, "Giảm theo % tối đa 100%"),
        otherwise: (schema) => schema.max(100000000, "Giảm tối đa 100 triệu"),
      })
      .required("Vui lòng nhập giá trị giảm"),
    max_discount_amount: yup.string().trim().optional(),
    min_order_amount: yup.string().trim().optional(),
    usage_limit: yup.string().trim().optional(),
    usage_per_customer: yup.string().trim().optional(),
    start_at: yup.string().required("Vui lòng chọn thời gian bắt đầu"),
    end_at: yup
      .string()
      .required("Vui lòng chọn thời gian kết thúc")
      .test("endAfterStart", "Thời gian kết thúc phải sau thời gian bắt đầu", function (value) {
        const { start_at } = this.parent;
        if (!value || !start_at) return true;
        return new Date(value) > new Date(start_at);
      }),
    status: yup
      .mixed<ShopPromotionStatus>()
      .oneOf(["draft", "active"], "Trạng thái không hợp lệ")
      .default("draft"),
  })
  .required();

type PromotionFormValues = yup.InferType<typeof promotionFormSchema>;

const statusLabels: Record<ShopPromotionStatus, string> = {
  draft: "Nháp",
  scheduled: "Sắp diễn ra",
  active: "Đang chạy",
  expired: "Hết hạn",
  disabled: "Tạm dừng",
};

const statusStyles: Record<ShopPromotionStatus, string> = {
  draft: "bg-amber-100 text-amber-700",
  scheduled: "bg-blue-100 text-blue-700",
  active: "bg-emerald-100 text-emerald-700",
  expired: "bg-gray-200 text-gray-600",
  disabled: "bg-rose-100 text-rose-700",
};

function toLocalDateInputValue(date: Date) {
  const pad = (value: number) => value.toString().padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function createDefaultFormValues(): PromotionFormValues {
  const start = new Date();
  start.setMinutes(0, 0, 0);
  start.setHours(start.getHours() + 2);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);

  return {
    promotion_code: "",
    title: "",
    description: "",
    discount_type: "percent",
    discount_value: 10,
    max_discount_amount: "",
    min_order_amount: "",
    usage_limit: "",
    usage_per_customer: "",
    start_at: toLocalDateInputValue(start),
    end_at: toLocalDateInputValue(end),
    status: "draft",
  } as PromotionFormValues;
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "string" && error.trim()) return error;
  return fallback;
}

const numberFormatter = new Intl.NumberFormat("vi-VN");
const dateTimeFormatter = new Intl.DateTimeFormat("vi-VN", {
  dateStyle: "short",
  timeStyle: "short",
});

const formatCurrency = (value?: number | null) => {
  if (value === null || value === undefined) return "—";
  return `${numberFormatter.format(value)}₫`;
};

const formatDateRange = (start: string, end: string) => {
  try {
    const startLabel = dateTimeFormatter.format(new Date(start));
    const endLabel = dateTimeFormatter.format(new Date(end));
    return `${startLabel} → ${endLabel}`;
  } catch (_err) {
    return "—";
  }
};

type UpdatableStatus = "active" | "disabled" | "draft";

const computeStatusAction = (
  promotion: ShopPromotion
): { label: string; next: UpdatableStatus } | null => {
  switch (promotion.current_status) {
    case "disabled":
      return { label: "Kích hoạt", next: "active" };
    case "draft":
      return { label: "Kích hoạt", next: "active" };
    case "expired":
      return null;
    default:
      return { label: "Tạm dừng", next: "disabled" };
  }
};

const ShopPromotionsPage: React.FC = () => {
  const [promotions, setPromotions] = useState<ShopPromotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [globalError, setGlobalError] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [formMessage, setFormMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [statusLoadingId, setStatusLoadingId] = useState<number | null>(null);
  const [deleteLoadingId, setDeleteLoadingId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<
    ShopPromotionStatus | "all"
  >("all");
  const [searchTerm, setSearchTerm] = useState("");

  const defaultValues = useMemo(() => createDefaultFormValues(), []);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<PromotionFormValues>({
    resolver: yupResolver(promotionFormSchema),
    defaultValues,
    mode: "onBlur",
  });

  const discountType = watch("discount_type");

  const loadPromotions = useCallback(async () => {
    setLoading(true);
    setGlobalError("");
    try {
      const data = await fetchShopPromotions();
      setPromotions(data);
    } catch (error) {
      setGlobalError(
        getErrorMessage(error, "Không thể tải danh sách khuyến mãi")
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPromotions();
  }, [loadPromotions]);

  const parseOptionalNumber = (label: string, raw?: string) => {
    if (!raw || !raw.trim()) return null;
    const value = Number(raw);
    if (!Number.isFinite(value)) {
      throw new Error(`${label} không hợp lệ`);
    }
    return value;
  };

  const parseOptionalInteger = (label: string, raw?: string) => {
    if (!raw || !raw.trim()) return null;
    const value = Number(raw);
    if (!Number.isFinite(value) || !Number.isInteger(value)) {
      throw new Error(`${label} phải là số nguyên`);
    }
    if (value <= 0) {
      throw new Error(`${label} phải lớn hơn 0`);
    }
    return value;
  };

  const onSubmit = handleSubmit(async (values) => {
    setFormMessage(null);
    setGlobalError("");

    try {
      const maxDiscount = parseOptionalNumber(
        "Giá trị giảm tối đa",
        values.max_discount_amount
      );
      const minOrder = parseOptionalNumber(
        "Đơn tối thiểu",
        values.min_order_amount
      );
      const usageLimit = parseOptionalInteger(
        "Giới hạn lượt dùng",
        values.usage_limit
      );
      const usagePerCustomer = parseOptionalInteger(
        "Số lượt mỗi khách",
        values.usage_per_customer
      );

      if (
        usageLimit !== null &&
        usagePerCustomer !== null &&
        usagePerCustomer > usageLimit
      ) {
        throw new Error(
          "Số lượt mỗi khách không được vượt quá tổng lượt sử dụng"
        );
      }

      if (maxDiscount !== null && maxDiscount <= 0) {
        throw new Error("Giá trị giảm tối đa phải lớn hơn 0");
      }

      if (minOrder !== null && minOrder < 0) {
        throw new Error("Đơn tối thiểu không được âm");
      }

      const payload: ShopPromotionInput = {
        promotion_code: values.promotion_code.trim().toUpperCase(),
        title: values.title.trim(),
        description: values.description?.trim()
          ? values.description.trim()
          : null,
        discount_type: values.discount_type,
        discount_value: values.discount_value,
        max_discount_amount:
          values.discount_type === "percent" ? maxDiscount : null,
        min_order_amount: minOrder ?? 0,
        usage_limit: usageLimit,
        usage_per_customer: usagePerCustomer ?? 1,
        start_at: values.start_at,
        end_at: values.end_at,
        status: values.status,
      };

      setSubmitting(true);
      const created = await createShopPromotion(payload);
      setPromotions((prev) => [created, ...prev]);
      setFormMessage({ type: "success", text: "Tạo khuyến mãi thành công" });
      reset(createDefaultFormValues());
      setFormOpen(false);
    } catch (error) {
      setFormMessage({
        type: "error",
        text: getErrorMessage(error, "Không thể tạo khuyến mãi"),
      });
    } finally {
      setSubmitting(false);
    }
  });

  const handleRefresh = async () => {
    await loadPromotions();
  };

  const handleStatusAction = async (promotion: ShopPromotion) => {
    const action = computeStatusAction(promotion);
    if (!action) return;
    setStatusLoadingId(promotion.promotion_id);
    setGlobalError("");
    try {
      const updated = await updateShopPromotionStatus(
        promotion.promotion_id,
        action.next
      );
      setPromotions((prev) =>
        prev.map((item) =>
          item.promotion_id === updated.promotion_id ? updated : item
        )
      );
    } catch (error) {
      setGlobalError(
        getErrorMessage(error, "Không thể cập nhật trạng thái khuyến mãi")
      );
    } finally {
      setStatusLoadingId(null);
    }
  };

  const handleDelete = async (promotion: ShopPromotion) => {
    const confirmed = window.confirm(
      `Bạn chắc chắn muốn xóa mã ${promotion.promotion_code}? Hành động này không thể hoàn tác.`
    );
    if (!confirmed) return;
    setDeleteLoadingId(promotion.promotion_id);
    setGlobalError("");
    try {
      await deleteShopPromotion(promotion.promotion_id);
      setPromotions((prev) =>
        prev.filter((item) => item.promotion_id !== promotion.promotion_id)
      );
    } catch (error) {
      setGlobalError(
        getErrorMessage(error, "Không thể xóa khuyến mãi. Vui lòng thử lại.")
      );
    } finally {
      setDeleteLoadingId(null);
    }
  };

  const renderDiscountValue = (promotion: ShopPromotion) => {
    if (promotion.discount_type === "percent") {
      const limitText = promotion.max_discount_amount
        ? ` (tối đa ${formatCurrency(promotion.max_discount_amount)})`
        : "";
      return `${promotion.discount_value}%${limitText}`;
    }
    return formatCurrency(promotion.discount_value);
  };

  const summaryCards = useMemo(() => {
    const total = promotions.length;
    const active = promotions.filter(
      (item) => item.current_status === "active"
    ).length;
    const scheduled = promotions.filter(
      (item) => item.current_status === "scheduled"
    ).length;
    const expired = promotions.filter(
      (item) => item.current_status === "expired"
    ).length;
    return [
      {
        title: "Tổng chiến dịch",
        value: total,
        subtitle: "Tất cả thời gian",
        accent: "from-emerald-400/20 to-emerald-500/10 text-emerald-700",
        icon: <Sparkles className="h-5 w-5" />,
      },
      {
        title: "Đang chạy",
        value: active,
        subtitle: "Tích cực trong tháng",
        accent: "from-blue-400/20 to-blue-500/10 text-blue-700",
        icon: <Play className="h-5 w-5" />,
      },
      {
        title: "Sắp diễn ra",
        value: scheduled,
        subtitle: "Chuẩn bị kích hoạt",
        accent: "from-amber-400/20 to-amber-500/10 text-amber-700",
        icon: <CalendarClock className="h-5 w-5" />,
      },
      {
        title: "Đã hết hạn",
        value: expired,
        subtitle: "Cần xem xét tái khởi động",
        accent: "from-gray-400/20 to-gray-500/10 text-gray-700",
        icon: <Pause className="h-5 w-5" />,
      },
    ];
  }, [promotions]);

  const filteredPromotions = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return promotions.filter((promotion) => {
      const byStatus =
        statusFilter === "all" || promotion.current_status === statusFilter;
      if (!byStatus) return false;
      if (!term) return true;
      const haystack = [
        promotion.promotion_code,
        promotion.title,
        promotion.description ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [promotions, statusFilter, searchTerm]);

  const isFiltered =
    statusFilter !== "all" || searchTerm.trim().length > 0;

  return (
    <div className="space-y-6">
      <div className="shop-header">
        <div>
          <h1 className="shop-title">Chiến dịch khuyến mãi</h1>
          <p className="shop-sub">
            Tạo mã giảm giá và quản lý hiệu quả các chương trình ưu đãi
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            className="btn-outline"
            onClick={handleRefresh}
            disabled={loading}
          >
            <RefreshCcw className="mr-2 h-4 w-4" />
            Làm mới
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              setFormOpen((v) => !v);
              setFormMessage(null);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            {formOpen ? "Đóng biểu mẫu" : "Tạo khuyến mãi"}
          </button>
        </div>
      </div>

      {globalError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {globalError}
        </div>
      )}

      {formOpen && (
        <div className="section">
          <form onSubmit={onSubmit} className="grid gap-4 md:grid-cols-2">
            {formMessage && (
              <div
                className={`md:col-span-2 rounded-lg border px-3 py-2 text-sm ${
                  formMessage.type === "success"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-red-200 bg-red-50 text-red-700"
                }`}
              >
                {formMessage.text}
              </div>
            )}

            <div className="form-group">
              <label className="label">Mã khuyến mãi</label>
              <input
                className="input uppercase"
                placeholder="SUMMER50"
                {...register("promotion_code")}
                onBlur={(event) =>
                  setValue("promotion_code", event.target.value.toUpperCase())
                }
              />
              {errors.promotion_code && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.promotion_code.message}
                </p>
              )}
            </div>

            <div className="form-group">
              <label className="label">Tiêu đề</label>
              <input
                className="input"
                placeholder="Giảm 20% sân cuối tuần"
                {...register("title")}
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.title.message}
                </p>
              )}
            </div>

            <div className="form-group md:col-span-2">
              <label className="label">Mô tả</label>
              <textarea
                className="input min-h-[100px]"
                placeholder="Mô tả ngắn gọn về ưu đãi, điều kiện áp dụng..."
                {...register("description")}
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.description.message}
                </p>
              )}
            </div>

            <div className="form-group">
              <label className="label">Loại giảm</label>
              <select className="input" {...register("discount_type")}>
                <option value="percent">Phần trăm</option>
                <option value="fixed">Số tiền cố định</option>
              </select>
            </div>

            <div className="form-group">
              <label className="label">
                Giá trị giảm {discountType === "percent" ? "(%)" : "(₫)"}
              </label>
              <input
                type="number"
                step={discountType === "percent" ? 1 : 1000}
                min={0}
                className="input"
                {...register("discount_value", { valueAsNumber: true })}
              />
              {errors.discount_value && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.discount_value.message}
                </p>
              )}
            </div>

            {discountType === "percent" && (
              <div className="form-group">
                <label className="label">Giảm tối đa (₫)</label>
                <input
                  type="number"
                  min={0}
                  step={1000}
                  className="input"
                  placeholder="Ví dụ: 50000"
                  {...register("max_discount_amount")}
                />
              </div>
            )}

            <div className="form-group">
              <label className="label">Đơn tối thiểu (₫)</label>
              <input
                type="number"
                min={0}
                step={1000}
                className="input"
                placeholder="Không bắt buộc"
                {...register("min_order_amount")}
              />
            </div>

            <div className="form-group">
              <label className="label">Giới hạn lượt dùng</label>
              <input
                type="number"
                min={1}
                step={1}
                className="input"
                placeholder="Không giới hạn nếu để trống"
                {...register("usage_limit")}
              />
            </div>

            <div className="form-group">
              <label className="label">Mỗi khách sử dụng</label>
              <input
                type="number"
                min={1}
                step={1}
                className="input"
                placeholder="Mặc định 1"
                {...register("usage_per_customer")}
              />
            </div>

            <div className="form-group">
              <label className="label">Bắt đầu</label>
              <input type="datetime-local" className="input" {...register("start_at")}
              />
              {errors.start_at && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.start_at.message}
                </p>
              )}
            </div>

            <div className="form-group">
              <label className="label">Kết thúc</label>
              <input type="datetime-local" className="input" {...register("end_at")}
              />
              {errors.end_at && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.end_at.message}
                </p>
              )}
            </div>

            <div className="form-group">
              <label className="label">Trạng thái khi tạo</label>
              <select className="input" {...register("status")}>
                <option value="draft">Nháp</option>
                <option value="active">Kích hoạt khi đến hạn</option>
              </select>
            </div>

            <div className="md:col-span-2 flex items-center gap-3 pt-2">
              <button
                type="submit"
                className="btn-primary"
                disabled={submitting}
              >
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Lưu chiến dịch
              </button>
              <button
                type="button"
                className="btn-outline"
                onClick={() => reset(createDefaultFormValues())}
                disabled={submitting}
              >
                Đặt lại
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-4 md:grid-cols-2">
        {summaryCards.map((card) => (
          <div
            key={card.title}
            className={`rounded-2xl border border-transparent bg-gradient-to-br ${card.accent} p-5 shadow-sm`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-gray-500">
                  {card.title}
                </p>
                <p className="mt-1 text-3xl font-bold text-gray-900">
                  {card.value}
                </p>
                <p className="mt-2 text-xs text-gray-500">{card.subtitle}</p>
              </div>
              <span className="rounded-full bg-white/70 p-2 text-gray-700 shadow">
                {card.icon}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="section space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            Danh sách chiến dịch
          </h2>
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="flex flex-wrap gap-2">
              {(
                [
                  { key: "all", label: "Tất cả" },
                  { key: "active", label: "Đang chạy" },
                  { key: "scheduled", label: "Sắp diễn ra" },
                  { key: "draft", label: "Nháp" },
                  { key: "disabled", label: "Tạm dừng" },
                  { key: "expired", label: "Hết hạn" },
                ] as Array<{ key: ShopPromotionStatus | "all"; label: string }>
              ).map((filter) => (
                <button
                  key={filter.key}
                  type="button"
                  onClick={() => setStatusFilter(filter.key)}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                    statusFilter === filter.key
                      ? "border-emerald-500 bg-emerald-50 text-emerald-600"
                      : "border-gray-200 text-gray-600 hover:border-emerald-400"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="search"
                className="input pl-9 pr-3"
                placeholder="Tìm theo mã, tiêu đề, mô tả..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="loading-wrap">
            <div className="spinner" />
          </div>
        ) : filteredPromotions.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-6 py-10 text-center text-gray-500">
            <p className="text-sm">
              {promotions.length === 0
                ? "Chưa có chiến dịch nào. Hãy tạo khuyến mãi đầu tiên!"
                : "Không tìm thấy khuyến mãi phù hợp với bộ lọc hiện tại."}
            </p>
            {isFiltered && (
              <button
                type="button"
                className="btn-outline mt-4 inline-flex items-center"
                onClick={() => {
                  setStatusFilter("all");
                  setSearchTerm("");
                }}
              >
                Đặt lại bộ lọc
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredPromotions.map((promotion) => {
              const action = computeStatusAction(promotion);
              return (
                <div
                  key={promotion.promotion_id}
                  className="group flex h-full flex-col justify-between rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                          {promotion.promotion_code}
                        </span>
                        <h3 className="mt-1 text-lg font-semibold text-gray-900">
                          {promotion.title}
                        </h3>
                      </div>
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[promotion.current_status]}`}
                      >
                        {statusLabels[promotion.current_status] || "—"}
                      </span>
                    </div>
                    {promotion.description && (
                      <p className="text-sm text-gray-600">
                        {promotion.description}
                      </p>
                    )}
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                        <p className="text-xs text-gray-500">Giảm</p>
                        <p className="font-semibold text-gray-900">
                          {renderDiscountValue(promotion)}
                        </p>
                      </div>
                      <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                        <p className="text-xs text-gray-500">Đơn tối thiểu</p>
                        <p className="font-semibold text-gray-900">
                          {promotion.min_order_amount
                            ? formatCurrency(promotion.min_order_amount)
                            : "Không yêu cầu"}
                        </p>
                      </div>
                      <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                        <p className="text-xs text-gray-500">Giới hạn</p>
                        <p className="font-semibold text-gray-900">
                          {promotion.usage_limit
                            ? `${promotion.usage_count}/${promotion.usage_limit}`
                            : "Không giới hạn"}
                        </p>
                      </div>
                      <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                        <p className="text-xs text-gray-500">Mỗi khách</p>
                        <p className="font-semibold text-gray-900">
                          {promotion.usage_per_customer ?? 1}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between rounded-lg border border-dashed border-emerald-200 bg-emerald-50/60 px-3 py-2 text-xs text-emerald-700">
                      <span>Thời gian áp dụng</span>
                      <span className="font-semibold">
                        {formatDateRange(
                          promotion.start_at,
                          promotion.end_at
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="mt-5 flex items-center justify-between">
                    <div className="text-xs text-gray-500">
                      Cập nhật{" "}
                      {dateTimeFormatter.format(new Date(promotion.update_at))}
                    </div>
                    <div className="flex items-center gap-2">
                      {action ? (
                        <button
                          type="button"
                          className="btn-outline flex items-center gap-1"
                          onClick={() => handleStatusAction(promotion)}
                          disabled={statusLoadingId === promotion.promotion_id}
                        >
                          {statusLoadingId === promotion.promotion_id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : action.next === "disabled" ? (
                            <Pause className="h-4 w-4" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                          {action.label}
                        </button>
                      ) : (
                        <div className="inline-flex items-center gap-1 text-xs text-gray-400">
                          Đã kết thúc
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        </div>
                      )}
                      <button
                        type="button"
                        className="btn-outline border-rose-200 text-rose-700 hover:border-rose-400 hover:text-rose-800"
                        onClick={() => handleDelete(promotion)}
                        disabled={deleteLoadingId === promotion.promotion_id}
                      >
                        {deleteLoadingId === promotion.promotion_id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Xóa"
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ShopPromotionsPage;
