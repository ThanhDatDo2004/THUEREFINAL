import React, { useEffect, useState } from "react";
import { Plus, Edit, Trash2, Save, X, Clock, DollarSign, AlertCircle } from "lucide-react";
import {
  fetchShopFields,
  fetchFieldOperatingHours,
  createFieldOperatingHours,
  updateFieldOperatingHours,
  deleteFieldOperatingHours,
} from "../../models/shop.api";
import type {
  Fields,
  FieldWithImages,
  FieldOperatingHours,
  FieldOperatingHoursPayload,
} from "../../types";

// Day names in Vietnamese
const DAY_NAMES = [
  "Chủ nhật",
  "Thứ hai",
  "Thứ ba",
  "Thứ tư",
  "Thứ năm",
  "Thứ sáu",
  "Thứ bảy",
];

interface OperatingHoursRowProps {
  operatingHours: FieldOperatingHours;
  onEdit: (operatingHours: FieldOperatingHours) => void;
  onDelete: (pricingId: number) => void;
}

const OperatingHoursRow: React.FC<OperatingHoursRowProps> = ({
  operatingHours,
  onEdit,
  onDelete,
}) => {
  return (
    <div className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow hover:border-blue-200">
      <div className="flex items-center gap-4 flex-1">
        <div className="flex-shrink-0 w-24 font-semibold text-gray-900">
          {DAY_NAMES[operatingHours.day_of_week]}
        </div>
        <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg">
          <Clock className="h-4 w-4 text-blue-600" />
          <span className="text-sm font-medium text-gray-800">
            {operatingHours.start_time} - {operatingHours.end_time}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onEdit(operatingHours)}
          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          title="Chỉnh sửa"
        >
          <Edit className="h-4 w-4" />
        </button>
        <button
          onClick={() => onDelete(operatingHours.pricing_id)}
          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          title="Xóa"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

interface EditOperatingHoursModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: FieldOperatingHoursPayload) => void;
  operatingHours?: FieldOperatingHours;
  fieldCode: number;
}

const EditOperatingHoursModal: React.FC<EditOperatingHoursModalProps> = ({
  isOpen,
  onClose,
  onSave,
  operatingHours,
  fieldCode,
}) => {
  const [formData, setFormData] = useState<FieldOperatingHoursPayload>({
    field_code: fieldCode,
    day_of_week: 1,
    start_time: "08:00",
    end_time: "22:00",
  });

  useEffect(() => {
    if (operatingHours) {
      setFormData({
        field_code: operatingHours.field_code,
        day_of_week: operatingHours.day_of_week,
        start_time: operatingHours.start_time,
        end_time: operatingHours.end_time,
      });
    } else {
      setFormData({
        field_code: fieldCode,
        day_of_week: 1,
        start_time: "08:00",
        end_time: "22:00",
      });
    }
  }, [operatingHours, fieldCode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedDay = Number(formData.day_of_week);
    const normalizedFieldCode = Number(fieldCode);
    const start = (formData.start_time || "").trim();
    const end = (formData.end_time || "").trim();
    if (!Number.isFinite(normalizedFieldCode)) {
      return;
    }
    if (
      !Number.isInteger(normalizedDay) ||
      normalizedDay < 0 ||
      normalizedDay > 6
    ) {
      return;
    }
    if (!start || !end) {
      return;
    }
    const normalizedPayload = {
      field_code: normalizedFieldCode,
      day_of_week: normalizedDay,
      start_time: start,
      end_time: end,
    };
    onSave(normalizedPayload);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <h2 className="text-xl font-bold text-gray-900">
            {operatingHours
              ? "Chỉnh sửa giờ hoạt động"
              : "Thêm giờ hoạt động"}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Ngày trong tuần
            </label>
            <select
              value={formData.day_of_week}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  day_of_week: parseInt(e.target.value),
                })
              }
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              {DAY_NAMES.map((day, index) => (
                <option key={index} value={index}>
                  {day}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Giờ mở cửa
              </label>
              <input
                type="time"
                value={formData.start_time}
                onChange={(e) =>
                  setFormData({ ...formData, start_time: e.target.value })
                }
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Giờ đóng cửa
              </label>
              <input
                type="time"
                value={formData.end_time}
                onChange={(e) =>
                  setFormData({ ...formData, end_time: e.target.value })
                }
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors flex items-center justify-center gap-2 font-medium"
            >
              <Save className="h-4 w-4" />
              Lưu
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface FieldOperatingHoursSectionProps {
  field: FieldWithImages;
  operatingHoursList: FieldOperatingHours[];
  onAddOperatingHours: (fieldCode: number) => void;
  onEditOperatingHours: (operatingHours: FieldOperatingHours) => void;
  onDeleteOperatingHours: (pricingId: number) => void;
  isLoading?: boolean;
}

const FieldOperatingHoursSection: React.FC<FieldOperatingHoursSectionProps> = ({
  field,
  operatingHoursList,
  onAddOperatingHours,
  onEditOperatingHours,
  onDeleteOperatingHours,
  isLoading = false,
}) => {
  const fieldOperatingHours = operatingHoursList.filter(
    (h) => h.field_code === field.field_code
  );
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow">
      <div
        className="flex items-center justify-between p-5 bg-gradient-to-r from-gray-50 to-white cursor-pointer hover:from-blue-50 hover:to-indigo-50 transition-colors border-b border-gray-100"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-4 flex-1">
          <div className="flex-shrink-0 w-3 h-3 rounded-full bg-green-500"></div>
          <div>
            <h3 className="font-bold text-gray-900 text-base">{field.field_name}</h3>
            <p className="text-sm text-gray-500 mt-0.5">
              {field.sport_type} • {field.address}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-lg">
            <Clock className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-gray-700">
              {isLoading
                ? "Đang tải..."
                : `${fieldOperatingHours.length} khung giờ`}
            </span>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddOperatingHours(field.field_code);
            }}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex-shrink-0"
            title="Thêm giờ hoạt động"
            disabled={isLoading}
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-gray-200 bg-white">
          <div className="p-5 space-y-3">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="w-10 h-10 rounded-full border-4 border-gray-200 border-t-blue-600 animate-spin mx-auto mb-3"></div>
                <p className="text-gray-500 text-sm">Đang tải khung giờ...</p>
              </div>
            ) : fieldOperatingHours.length === 0 ? (
              <div className="text-center py-12 px-4">
                <Clock className="h-14 w-14 mx-auto mb-3 text-gray-300" />
                <p className="text-gray-600 font-medium mb-4">Chưa có giờ hoạt động</p>
                <button
                  onClick={() => onAddOperatingHours(field.field_code)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
                >
                  <Plus className="h-4 w-4" />
                  Thêm giờ hoạt động đầu tiên
                </button>
              </div>
            ) : (
              fieldOperatingHours.map((operatingHours) => (
                <OperatingHoursRow
                  key={operatingHours.pricing_id}
                  operatingHours={operatingHours}
                  onEdit={onEditOperatingHours}
                  onDelete={onDeleteOperatingHours}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const ShopFieldOperatingHoursPage: React.FC = () => {
  const [fields, setFields] = useState<FieldWithImages[]>([]);
  const [operatingHoursData, setOperatingHoursData] = useState<
    FieldOperatingHours[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [operatingHoursLoading, setOperatingHoursLoading] = useState<{
    [fieldCode: number]: boolean;
  }>({});
  const [selectedField, setSelectedField] = useState<number | null>(null);
  const [editingOperatingHours, setEditingOperatingHours] = useState<
    FieldOperatingHours | undefined
  >();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadFields();
  }, []);

  const loadFields = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await fetchShopFields();
      setFields(result.items || []);

      if (result.items && result.items.length > 0) {
        await loadAllOperatingHoursData(result.items);
      }
    } catch (error) {
      console.error("Lỗi khi tải danh sách sân:", error);
      setError("Không thể tải danh sách sân. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const loadAllOperatingHoursData = async (fieldsList: FieldWithImages[]) => {
    const allOperatingHours: FieldOperatingHours[] = [];

    for (const field of fieldsList) {
      try {
        setOperatingHoursLoading((prev) => ({
          ...prev,
          [field.field_code]: true,
        }));
        const operatingHours = await fetchFieldOperatingHours(field.field_code);
        allOperatingHours.push(...operatingHours);
      } catch (error) {
        console.error(
          `Lỗi khi tải giờ hoạt động cho sân ${field.field_name}:`,
          error
        );
      } finally {
        setOperatingHoursLoading((prev) => ({
          ...prev,
          [field.field_code]: false,
        }));
      }
    }

    setOperatingHoursData(allOperatingHours);
  };

  const loadFieldOperatingHours = async (fieldCode: number) => {
    try {
      setOperatingHoursLoading((prev) => ({ ...prev, [fieldCode]: true }));
      const operatingHours = await fetchFieldOperatingHours(fieldCode);

      setOperatingHoursData((prev) => {
        const filtered = prev.filter((h) => h.field_code !== fieldCode);
        return [...filtered, ...operatingHours];
      });
    } catch (error) {
      console.error(`Lỗi khi tải giờ hoạt động cho sân ${fieldCode}:`, error);
    } finally {
      setOperatingHoursLoading((prev) => ({ ...prev, [fieldCode]: false }));
    }
  };

  const handleAddOperatingHours = (fieldCode: number) => {
    setSelectedField(fieldCode);
    setEditingOperatingHours(undefined);
    setIsModalOpen(true);
  };

  const handleEditOperatingHours = (operatingHours: FieldOperatingHours) => {
    setEditingOperatingHours(operatingHours);
    setIsModalOpen(true);
  };

  const handleSaveOperatingHours = async (data: FieldOperatingHoursPayload) => {
    try {
      setError(null);

      let savedOperatingHours: FieldOperatingHours;

      if (editingOperatingHours) {
        savedOperatingHours = await updateFieldOperatingHours(
          editingOperatingHours.pricing_id,
          data
        );
        setOperatingHoursData((prev) =>
          prev.map((h) =>
            h.pricing_id === editingOperatingHours.pricing_id
              ? savedOperatingHours
              : h
          )
        );
      } else {
        savedOperatingHours = await createFieldOperatingHours(data);
        setOperatingHoursData((prev) => [...prev, savedOperatingHours]);
      }

      setIsModalOpen(false);
      setEditingOperatingHours(undefined);
      setSelectedField(null);
    } catch (error) {
      console.error("Lỗi khi lưu giờ hoạt động:", error);
      setError(
        `Không thể lưu giờ hoạt động: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  const handleDeleteOperatingHours = async (pricingId: number) => {
    if (!confirm("Bạn có chắc chắn muốn xóa giờ hoạt động này?")) {
      return;
    }

    try {
      setError(null);
      await deleteFieldOperatingHours(pricingId);
      setOperatingHoursData((prev) =>
        prev.filter((h) => h.pricing_id !== pricingId)
      );
    } catch (error) {
      console.error("Lỗi khi xóa giờ hoạt động:", error);
      setError("Không thể xóa giờ hoạt động. Vui lòng thử lại.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-4 border-gray-200 border-t-blue-600 animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Giờ hoạt động</h1>
          </div>
          <p className="text-gray-600 ml-11">
            Thiết lập giờ mở cửa và đóng cửa cho từng sân mỗi ngày
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-red-900">Lỗi</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
            <button
              onClick={loadFields}
              className="text-sm text-red-600 hover:text-red-700 font-medium whitespace-nowrap"
            >
              Thử lại
            </button>
          </div>
        )}

        {/* Stats */}
        {fields.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
              <div className="text-gray-600 text-sm font-medium">Tổng sân</div>
              <div className="text-3xl font-bold text-gray-900 mt-1">{fields.length}</div>
            </div>
            <div className="bg-white rounded-lg border border-blue-200 p-4 shadow-sm bg-gradient-to-br from-white to-blue-50">
              <div className="text-blue-700 text-sm font-medium">Khung giờ</div>
              <div className="text-3xl font-bold text-blue-900 mt-1">{operatingHoursData.length}</div>
            </div>
            <div className="bg-white rounded-lg border border-green-200 p-4 shadow-sm bg-gradient-to-br from-white to-green-50">
              <div className="text-green-700 text-sm font-medium">Sân có giờ</div>
              <div className="text-3xl font-bold text-green-900 mt-1">
                {fields.filter((f) =>
                  operatingHoursData.some((h) => h.field_code === f.field_code)
                ).length}
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        {fields.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-gray-300">
            <Clock className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Chưa có sân nào
            </h3>
            <p className="text-gray-500 mb-6 max-w-sm mx-auto">
              Bạn cần tạo sân trước khi có thể thiết lập giờ hoạt động
            </p>
            <button className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
              <Plus className="h-4 w-4" />
              Tạo sân đầu tiên
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {fields.map((field) => (
              <FieldOperatingHoursSection
                key={field.field_code}
                field={field}
                operatingHoursList={operatingHoursData}
                onAddOperatingHours={handleAddOperatingHours}
                onEditOperatingHours={handleEditOperatingHours}
                onDeleteOperatingHours={handleDeleteOperatingHours}
                isLoading={operatingHoursLoading[field.field_code] || false}
              />
            ))}
          </div>
        )}
      </div>

      <EditOperatingHoursModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingOperatingHours(undefined);
          setSelectedField(null);
        }}
        onSave={handleSaveOperatingHours}
        operatingHours={editingOperatingHours}
        fieldCode={selectedField || 0}
      />
    </div>
  );
};

export default ShopFieldOperatingHoursPage;
