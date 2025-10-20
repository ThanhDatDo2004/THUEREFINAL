import React from "react";
import { AlertCircle } from "lucide-react";

export type CourtAvailabilityOption = {
  quantity_id: number;
  quantity_number: number;
  status: "available" | "held" | "booked";
  holdExpiresAt?: string | null;
};

interface AvailableCourtSelectorProps {
  courts: CourtAvailabilityOption[];
  selectedQuantityID?: number;
  onSelectCourt: (quantityID: number) => void;
  loading?: boolean;
}

const formatHoldExpiresAt = (value?: string | null) => {
  if (!value) return "";
  const normalized = value.replace(" ", "T");
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const AvailableCourtSelector: React.FC<AvailableCourtSelectorProps> = ({
  courts,
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

  if (!courts.length) {
    return (
      <div className="flex items-start gap-2 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-yellow-700">
        <span>Không có dữ liệu sân cho khung giờ này.</span>
      </div>
    );
  }

  const sortedCourts = [...courts].sort(
    (a, b) => a.quantity_number - b.quantity_number
  );
  const availableCount = sortedCourts.filter(
    (court) => court.status === "available"
  ).length;

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Chọn sân <span className="text-red-500">*</span>
        </label>
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
          {sortedCourts.map((court) => {
            const isSelected = selectedQuantityID === court.quantity_id;
            const isSelectable = court.status === "available";
            const isHeld = court.status === "held";
            const isBooked = court.status === "booked";
            const holdInfo = formatHoldExpiresAt(court.holdExpiresAt);

            return (
              <button
                key={court.quantity_id}
                type="button"
                onClick={() => {
                  if (isSelectable) {
                    onSelectCourt(court.quantity_id);
                  }
                }}
                disabled={!isSelectable}
                className={`relative flex flex-col items-center gap-2 rounded-xl border px-4 py-3 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 ${
                  !isSelectable
                    ? "border-gray-200 bg-gray-100 text-gray-500 cursor-not-allowed opacity-70"
                    : isSelected
                    ? "border-emerald-500 bg-emerald-50 shadow-sm focus-visible:ring-emerald-400"
                    : "border-gray-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/60 focus-visible:ring-emerald-400"
                }`}
                aria-pressed={isSelected}
                aria-disabled={!isSelectable}
              >
                <span
                  className={`text-2xl font-bold ${
                    !isSelectable ? "text-gray-500" : "text-gray-900"
                  }`}
                >
                  Sân {court.quantity_number}
                </span>
                <span
                  className={`text-xs font-medium rounded-full px-2 py-1 ${
                    isSelectable
                      ? "bg-green-100 text-green-700"
                      : isHeld
                      ? "bg-amber-100 text-amber-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {isSelectable
                    ? "Trống"
                    : isHeld
                    ? "Đang giữ"
                    : "Đã đặt"}
                </span>
                {!isSelectable && holdInfo && isHeld && (
                  <span className="text-xs text-amber-600">
                    Giữ đến {holdInfo}
                  </span>
                )}
                {isSelected && isSelectable && (
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

      {availableCount === 0 && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <div>
            <p className="font-medium">Không còn sân trống</p>
            <p className="text-sm">Vui lòng chọn khung giờ khác.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AvailableCourtSelector;
