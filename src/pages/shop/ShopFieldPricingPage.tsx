import React, { useEffect, useState } from "react";
import { Plus, Edit, Trash2, Save, X, Clock } from "lucide-react";
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

// Removed mock data - now using real API calls

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
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
      <div className="flex items-center gap-4">
        <div className="w-20 text-sm font-medium text-gray-700">
          {DAY_NAMES[operatingHours.day_of_week]}
        </div>
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-gray-500" />
          <span className="text-sm text-gray-600">
            {operatingHours.start_time} - {operatingHours.end_time}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex gap-1">
          <button
            onClick={() => onEdit(operatingHours)}
            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
            title="Chỉnh sửa"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(operatingHours.pricing_id)}
            className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors"
            title="Xóa"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
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
    // Normalize payload to prevent NaN and enforce snake_case keys
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
    console.log("Submitting operating hours payload:", normalizedPayload);
    onSave(normalizedPayload);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {operatingHours
              ? "Chỉnh sửa giờ hoạt động"
              : "Thêm giờ hoạt động mới"}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-md transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Thứ trong tuần
            </label>
            <select
              value={formData.day_of_week}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  day_of_week: parseInt(e.target.value),
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Giờ mở cửa
              </label>
              <input
                type="time"
                value={formData.start_time}
                onChange={(e) =>
                  setFormData({ ...formData, start_time: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Giờ đóng cửa
              </label>
              <input
                type="time"
                value={formData.end_time}
                onChange={(e) =>
                  setFormData({ ...formData, end_time: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          {/* Removed price_per_hour field - pricing is managed separately */}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-md transition-colors flex items-center justify-center gap-2"
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
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <div
        className="flex items-center justify-between p-4 bg-white cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <div>
            <h3 className="font-semibold text-gray-900">{field.field_name}</h3>
            <p className="text-sm text-gray-500 capitalize">
              {field.sport_type} • {field.address}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">
            {isLoading
              ? "Đang tải..."
              : `${fieldOperatingHours.length} khung giờ`}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddOperatingHours(field.field_code);
            }}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Thêm giờ hoạt động"
            disabled={isLoading}
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-gray-200 p-4 space-y-3">
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
              <p>Đang tải khung giờ...</p>
            </div>
          ) : fieldOperatingHours.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Clock className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>Chưa có giờ hoạt động nào được thiết lập</p>
              <button
                onClick={() => onAddOperatingHours(field.field_code)}
                className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
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

      // Load operating hours data for all fields
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

      // Update operating hours data for this specific field
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
      console.log("Saving operating hours with data:", data);

      let savedOperatingHours: FieldOperatingHours;

      if (editingOperatingHours) {
        // Update existing operating hours
        console.log(
          "Updating existing operating hours:",
          editingOperatingHours.pricing_id
        );
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
        // Create new operating hours
        console.log("Creating new operating hours");
        savedOperatingHours = await createFieldOperatingHours(data);
        console.log("Created operating hours:", savedOperatingHours);
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
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Giá & Giờ hoạt động
            </h1>
            <p className="text-gray-600 mt-1">
              Thiết lập giờ mở cửa, đóng cửa và giá cho từng thứ trong tuần
            </p>
          </div>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-red-600 mr-3">
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-medium text-red-800">
                Lỗi tải dữ liệu
              </h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
          <div className="mt-3">
            <button
              onClick={loadFields}
              className="text-sm bg-red-100 text-red-800 px-3 py-1 rounded-md hover:bg-red-200 transition-colors"
            >
              Thử lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Giờ hoạt động</h1>
          <p className="text-gray-600 mt-1">
            Thiết lập giờ mở cửa và đóng cửa cho từng thứ trong tuần
          </p>
        </div>
      </div>

      {fields.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <Clock className="h-16 w-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Chưa có sân nào
          </h3>
          <p className="text-gray-500 mb-4">
            Bạn cần tạo sân trước khi có thể thiết lập giờ hoạt động
          </p>
          <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
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
