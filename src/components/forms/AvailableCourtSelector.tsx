import React from "react";
import type { Quantity } from "../../models/fields.api";

interface AvailableCourtSelectorProps {
  availableQuantities: Quantity[];
  selectedQuantityID?: number;
  onSelectCourt: (quantityID: number) => void;
  loading?: boolean;
}

const AvailableCourtSelector: React.FC<AvailableCourtSelectorProps> = ({
  availableQuantities,
  selectedQuantityID,
  onSelectCourt,
  loading = false,
}) => {
  if (loading) {
    return (
      <div className="flex items-center gap-3 text-gray-600">
        <div className="spinner" />
        <span>Đang tải danh sách sân trống...</span>
      </div>
    );
  }

  if (availableQuantities.length === 0) {
    return (
      <div className="flex items-start gap-2 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-yellow-700">
        <span>Không có sân nào trống cho khung giờ này.</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        Chọn sân <span className="text-red-500">*</span>
      </label>
      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
        {availableQuantities.map((quantity) => {
          const isSelected = selectedQuantityID === quantity.quantity_id;
          return (
            <button
              key={quantity.quantity_id}
              type="button"
              onClick={() => onSelectCourt(quantity.quantity_id)}
              className={`relative flex flex-col items-center gap-2 rounded-xl border px-4 py-3 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-1 ${
                isSelected
                  ? "border-emerald-500 bg-emerald-50 shadow-sm"
                  : "border-gray-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/60"
              }`}
              aria-pressed={isSelected}
            >
              <span className="text-2xl font-bold text-gray-900">
                Sân {quantity.quantity_number}
              </span>
              <span
                className={`text-xs font-medium rounded-full px-2 py-1 ${
                  quantity.status === "available"
                    ? "bg-green-100 text-green-700"
                    : quantity.status === "maintenance"
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                {quantity.status === "available"
                  ? "Có sẵn"
                  : quantity.status === "maintenance"
                  ? "Bảo trì"
                  : "Không khả dụng"}
              </span>
              {isSelected && (
                <div className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500">
                  <svg
                    className="h-3 w-3 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default AvailableCourtSelector;
