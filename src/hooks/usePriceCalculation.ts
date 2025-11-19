import { useMemo } from "react";
import type { ShopPromotion } from "../types";

export interface BookingDetails {
  totalPrice: number;
}

export interface PriceCalculation {
  discount: number;
  final: number;
  before: number;
  feedback: string;
  feedbackClass: string;
}

export const usePriceCalculation = (
  effectiveBooking: BookingDetails | null,
  selectedPromotion: ShopPromotion | null,
  isAuthenticated: boolean,
  promotionCode: string
): PriceCalculation => {
  return useMemo(() => {
    if (!effectiveBooking) {
      return {
        discount: 0,
        final: 0,
        before: 0,
        feedback: "",
        feedbackClass: "text-gray-600",
      };
    }

    const basePrice = effectiveBooking.totalPrice;
    let discount = 0;

    if (isAuthenticated && selectedPromotion && promotionCode.trim()) {
      const minOrder = selectedPromotion.min_order_amount ?? 0;
      if (basePrice >= minOrder) {
        discount =
          selectedPromotion.discount_type === "percent"
            ? (basePrice * selectedPromotion.discount_value) / 100
            : selectedPromotion.discount_value;

        if (
          selectedPromotion.discount_type === "percent" &&
          selectedPromotion.max_discount_amount !== null &&
          selectedPromotion.max_discount_amount >= 0
        ) {
          discount = Math.min(discount, selectedPromotion.max_discount_amount);
        }
        discount = Math.min(discount, basePrice);
        discount = Math.round(discount * 100) / 100;
      }
    }

    const final = Math.max(basePrice - discount, 0);

    // Generate feedback
    let feedback = "";
    let feedbackClass = "text-gray-600";

    if (promotionCode.trim()) {
      if (!isAuthenticated) {
        feedback = "Hãy đăng nhập để được áp dụng khuyến mãi.";
        feedbackClass = "text-red-600";
      } else if (!selectedPromotion) {
        feedback = "Không tìm thấy khuyến mãi tương ứng.";
        feedbackClass = "text-gray-600";
      } else if (basePrice < (selectedPromotion.min_order_amount ?? 0)) {
        feedback = `Áp dụng cho đơn từ ${(
          selectedPromotion.min_order_amount ?? 0
        ).toLocaleString("vi-VN")}₫.`;
        feedbackClass = "text-gray-600";
      } else if (discount > 0) {
        feedback =
          selectedPromotion.discount_type === "percent"
            ? `Đã giảm -${selectedPromotion.discount_value}%`
            : `Đã giảm -${discount.toLocaleString("vi-VN")}₫`;
        feedbackClass = "text-emerald-600";
      }
    }

    return {
      discount,
      final,
      before: basePrice,
      feedback,
      feedbackClass,
    };
  }, [effectiveBooking, selectedPromotion, isAuthenticated, promotionCode]);
};
