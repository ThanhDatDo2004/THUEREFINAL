import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { Loader2, Plus, RefreshCcw, Pause, Play } from "lucide-react";
import {
  createShopPromotion,
  fetchShopPromotions,
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

  const renderDiscountValue = (promotion: ShopPromotion) => {
    if (promotion.discount_type === "percent") {
      const limitText = promotion.max_discount_amount
        ? ` (tối đa ${formatCurrency(promotion.max_discount_amount)})`
        : "";
      return `${promotion.discount_value}%${limitText}`;
    }
    return formatCurrency(promotion.discount_value);
  };

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

      <div className="section">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Danh sách chiến dịch</h2>
          {loading && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" /> Đang tải...
            </div>
          )}
        </div>

        {loading ? (
          <div className="loading-wrap">
            <div className="spinner" />
          </div>
        ) : promotions.length === 0 ? (
          <div className="py-8 text-center text-gray-500">
            Chưa có chiến dịch nào. Hãy tạo khuyến mãi đầu tiên!
          </div>
        ) : (
          <div className="table-wrap overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Mã / Tiêu đề</th>
                  <th>Giảm</th>
                  <th>Thời gian</th>
                  <th>Giới hạn</th>
                  <th>Trạng thái</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {promotions.map((promotion) => {
                  const action = computeStatusAction(promotion);
                  return (
                    <tr key={promotion.promotion_id}>
                      <td>
                        <div className="font-semibold text-gray-900">
                          {promotion.promotion_code}
                        </div>
                        <div className="text-sm text-gray-500">
                          {promotion.title}
                        </div>
                      </td>
                      <td>{renderDiscountValue(promotion)}</td>
                      <td className="text-sm text-gray-600">
                        {formatDateRange(promotion.start_at, promotion.end_at)}
                      </td>
                      <td className="text-sm text-gray-600">
                        {promotion.usage_limit
                          ? `${promotion.usage_count}/${promotion.usage_limit}`
                          : `${promotion.usage_count}`}
                      </td>
                      <td>
                        <span
                          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                            statusStyles[promotion.current_status]
                          }`}
                        >
                          {statusLabels[promotion.current_status] || "—"}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          {action ? (
                            <button
                              type="button"
                              className="btn-outline flex items-center"
                              onClick={() => handleStatusAction(promotion)}
                              disabled={statusLoadingId === promotion.promotion_id}
                            >
                              {statusLoadingId === promotion.promotion_id ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : action.next === "disabled" ? (
                                <Pause className="mr-2 h-4 w-4" />
                              ) : (
                                <Play className="mr-2 h-4 w-4" />
                              )}
                              {action.label}
                            </button>
                          ) : (
                            <span className="text-sm text-gray-400">
                              Không khả dụng
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShopPromotionsPage;
