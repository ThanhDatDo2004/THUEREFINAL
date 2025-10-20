import React from "react";
import type { Quantity } from "../../models/fields.api";
import { AlertCircle } from "lucide-react";

interface AvailableCourtSelectorProps {
  availableQuantities: Quantity[];
  bookedQuantities?: Quantity[];
  selectedQuantityID?: number;
  onSelectCourt: (quantityID: number) => void;
  loading?: boolean;
}

const AvailableCourtSelector: React.FC<AvailableCourtSelectorProps> = ({
  availableQuantities,
  bookedQuantities = [],
  selectedQuantityID,
  onSelectCourt,
  loading = false,
}) => {
  if (loading) {
    return (
      <div className="flex items-center gap-3 text-gray-600">
        <div className="spinner" />
        <span>Đang tải danh sách sân...</span>
      </div>
    );
  }

  if (availableQuantities.length === 0 && bookedQuantities.length === 0) {
    return (
      <div className="flex items-start gap-2 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-yellow-700">
        <span>Không có sân nào cho khung giờ này.</span>
      </div>
    );
  }

  if (availableQuantities.length === 0) {
    return (
      <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
        <AlertCircle className="h-5 w-5 shrink-0 flex-shrink-0" />
        <div>
          <p className="font-medium">Không có sân nào trống</p>
          <p className="text-sm">Vui lòng chọn khung giờ khác.</p>
        </div>
      </div>
    );
  }

  // Combine available and booked courts, sorted by quantity_number
  const allCourts = [...availableQuantities, ...bookedQuantities].sort(
    (a, b) => a.quantity_number - b.quantity_number
  );
  const bookedIds = new Set(bookedQuantities.map((q) => q.quantity_id));

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Chọn sân <span className="text-red-500">*</span>
        </label>
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
          {allCourts.map((quantity) => {
            const isBooked = bookedIds.has(quantity.quantity_id);
            const isSelected = selectedQuantityID === quantity.quantity_id;
            const isSelectable = !isBooked;

            return (
              <button
                key={quantity.quantity_id}
                type="button"
                onClick={() => {
                  if (isSelectable) {
                    onSelectCourt(quantity.quantity_id);
                  }
                }}
                disabled={!isSelectable}
                className={`relative flex flex-col items-center gap-2 rounded-xl border px-4 py-3 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 ${
                  isBooked
                    ? "border-gray-200 bg-gray-100 cursor-not-allowed opacity-60"
                    : isSelected
                    ? "border-emerald-500 bg-emerald-50 shadow-sm focus-visible:ring-emerald-400"
                    : "border-gray-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/60 focus-visible:ring-emerald-400"
                }`}
                aria-pressed={isSelected}
                aria-disabled={!isSelectable}
              >
                <span className={`text-2xl font-bold ${isBooked ? "text-gray-500" : "text-gray-900"}`}>
                  Sân {quantity.quantity_number}
                </span>
                <span
                  className={`text-xs font-medium rounded-full px-2 py-1 ${
                    isBooked
                      ? "bg-red-100 text-red-700"
                      : quantity.status === "available"
                      ? "bg-green-100 text-green-700"
                      : quantity.status === "maintenance"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {isBooked
                    ? "Đã được đặt"
                    : quantity.status === "available"
                    ? "Trống"
                    : quantity.status === "maintenance"
                    ? "Bảo trì"
                    : "Không khả dụng"}
                </span>
                {isSelected && !isBooked && (
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

      {bookedQuantities.length > 0 && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-700">
          <p className="font-medium mb-1">Ghi chú:</p>
          <p>Sân ghi "Đã được đặt" không khả dụng trong khung giờ này. Hãy chọn sân khác hoặc thay đổi khung giờ.</p>
        </div>
      )}
    </div>
  );
};

export default AvailableCourtSelector;
