import React, { useEffect, useState, useMemo } from "react";
import { AlertCircle, CheckCircle2, Loader } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { fetchMyShop } from "../../models/shop.api";
import {
  AVAILABLE_UTILITIES,
  getShopUtilities,
  updateShopUtilities,
  type FieldUtility,
} from "../../models/utilities.api";

const ShopUtilitiesPage: React.FC = () => {
  const { user } = useAuth();
  const [shopCode, setShopCode] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedUtilities, setSelectedUtilities] = useState<string[]>([]);
  const [utilities, setUtilities] = useState<FieldUtility[]>([]);

  // Fetch shop code and utilities
  useEffect(() => {
    let ignore = false;
    (async () => {
      if (!user?.user_code) return;
      try {
        setLoading(true);
        setError("");
        const shop = await fetchMyShop();
        if (!ignore && shop) {
          setShopCode(shop.shop_code);
          // Fetch utilities
          const utils = await getShopUtilities(shop.shop_code);
          if (!ignore) {
            setUtilities(utils);
            const selected = utils.map((u) => u.utility_id);
            setSelectedUtilities(selected);
          }
        }
      } catch (err: any) {
        if (!ignore) {
          setError(err?.message || "Không thể tải dữ liệu");
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, [user?.user_code]);

  // Handle utility toggle
  const handleToggleUtility = (utilityId: string) => {
    setSelectedUtilities((prev) => {
      if (prev.includes(utilityId)) {
        return prev.filter((u) => u !== utilityId);
      } else {
        return [...prev, utilityId];
      }
    });
  };

  // Handle save
  const handleSave = async () => {
    if (!shopCode) return;
    try {
      setSaving(true);
      setError("");
      setSuccess("");
      await updateShopUtilities(shopCode, selectedUtilities);
      setSuccess("✓ Cập nhật tiện ích thành công!");
      // Refetch utilities
      const utils = await getShopUtilities(shopCode);
      setUtilities(utils);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err?.message || "Không thể cập nhật tiện ích");
    } finally {
      setSaving(false);
    }
  };

  const utilityGroups = useMemo(() => {
    return [
      {
        title: "Tiện ích Cơ Bản",
        utilities: AVAILABLE_UTILITIES.slice(0, 4),
      },
      {
        title: "Tiện ích Bổ Sung",
        utilities: AVAILABLE_UTILITIES.slice(4),
      },
    ];
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader className="animate-spin w-8 h-8 text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Quản lý Tiện ích
        </h1>
        <p className="text-gray-600">
          Chọn các tiện ích mà sân của bạn cung cấp để giúp khách hàng dễ dàng
          tìm kiếm
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <span className="text-red-800">{error}</span>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
          <span className="text-green-800">{success}</span>
        </div>
      )}

      {/* Utilities Grid */}
      <div className="space-y-8">
        {utilityGroups.map((group) => (
          <div key={group.title}>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {group.title}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {group.utilities.map((utility) => {
                const isSelected = selectedUtilities.includes(utility.id);
                return (
                  <button
                    key={utility.id}
                    onClick={() => handleToggleUtility(utility.id)}
                    className={`relative p-6 rounded-xl border-2 transition-all text-left ${
                      isSelected
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 bg-white hover:border-gray-300"
                    }`}
                  >
                    {/* Checkmark */}
                    {isSelected && (
                      <div className="absolute top-3 right-3 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                        <svg
                          className="w-4 h-4 text-white"
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

                    {/* Icon and Label */}
                    <div className="flex items-center gap-3">
                      <div className="text-3xl">{utility.icon}</div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {utility.label}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {getUtilityDescription(utility.id)}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="mt-8 flex gap-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition font-semibold flex items-center gap-2"
        >
          {saving && <Loader className="w-4 h-4 animate-spin" />}
          {saving ? "Đang lưu..." : "✓ Lưu Thay Đổi"}
        </button>
        <button
          onClick={() => {
            const selected = utilities.map((u) => u.utility_id);
            setSelectedUtilities(selected);
            setError("");
            setSuccess("");
          }}
          className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-semibold"
        >
          ↻ Hoàn tác
        </button>
      </div>

      {/* Stats */}
      <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Tiện ích được chọn</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {selectedUtilities.length}/{AVAILABLE_UTILITIES.length}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Thay đổi</p>
            <p
              className={`text-2xl font-bold mt-1 ${
                selectedUtilities.length === utilities.length
                  ? "text-gray-400"
                  : "text-blue-600"
              }`}
            >
              {selectedUtilities.length === utilities.length ? "0" : "Chưa lưu"}
            </p>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="mt-8 p-6 bg-blue-50 rounded-xl border border-blue-200">
        <h3 className="font-semibold text-gray-900 mb-2">💡 Mẹo</h3>
        <ul className="text-sm text-gray-700 space-y-2">
          <li>
            • Chọn các tiện ích mà sân của bạn có để tăng tính hấp dẫn cho khách
            hàng
          </li>
          <li>• Cập nhật thường xuyên nếu thêm hoặc bỏ tiện ích nào</li>
          <li>• Khách hàng sẽ dễ dàng tìm thấy sân bạn qua bộ lọc tiện ích</li>
        </ul>
      </div>
    </div>
  );
};

// Helper function to get utility descriptions
function getUtilityDescription(utilityId: string): string {
  const descriptions: Record<string, string> = {
    parking: "Bãi đỗ xe rộng rãi",
    restroom: "Nhà vệ sinh sạch sẽ",
    changing_room: "Phòng thay đồ riêng",
    ac: "Hệ thống điều hòa",
    hot_water: "Nước nóng, tắm rửa",
    wifi: "Kết nối WiFi miễn phí",
    racket_rental: "Cho thuê vợt, dạo cầu",
    ball_rental: "Cho thuê bóng, dụng cụ",
  };
  return descriptions[utilityId] || "";
}

export default ShopUtilitiesPage;
