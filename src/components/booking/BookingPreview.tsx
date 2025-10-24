import React from "react";
import { usePriceCalculation } from "../../hooks/usePriceCalculation";
import type { ShopPromotion } from "../../types";

interface BookingPreviewProps {
  basePrice: number;
  selectedPromotion: ShopPromotion | null;
  promotionCode: string;
  isAuthenticated: boolean;
  onApplyPromotion?: (code: string) => void;
}

/**
 * Preview component showing booking summary and pricing
 * Displays total, discounts, and fees
 */
export const BookingPreview: React.FC<BookingPreviewProps> = ({
  basePrice,
  selectedPromotion,
  promotionCode,
  isAuthenticated,
  onApplyPromotion,
}) => {
  const pricing = usePriceCalculation(
    { totalPrice: basePrice },
    selectedPromotion,
    isAuthenticated,
    promotionCode
  );

  const platformFee = Math.round(basePrice * 0.05 * 100) / 100;
  const netToShop = basePrice - platformFee - pricing.discount;

  return (
    <div className="booking-preview">
      <div className="preview-card">
        <h3>Booking Summary</h3>

        <div className="summary-section">
          <div className="summary-row">
            <span className="label">Base Price:</span>
            <span className="value">{pricing.before.toLocaleString("vi-VN")}₫</span>
          </div>

          {pricing.discount > 0 && (
            <div className="summary-row discount">
              <span className="label">Discount ({pricing.feedback}):</span>
              <span className="value">-{pricing.discount.toLocaleString("vi-VN")}₫</span>
            </div>
          )}

          <div className="summary-row">
            <span className="label">Platform Fee (5%):</span>
            <span className="value">{platformFee.toLocaleString("vi-VN")}₫</span>
          </div>

          <div className="summary-row total">
            <span className="label">Total:</span>
            <span className="value">{pricing.final.toLocaleString("vi-VN")}₫</span>
          </div>

          <div className="summary-row">
            <span className="label">Shop Receives:</span>
            <span className="value">{netToShop.toLocaleString("vi-VN")}₫</span>
          </div>
        </div>

        {isAuthenticated && onApplyPromotion && (
          <div className="promo-section">
            <input
              type="text"
              placeholder="Enter promotion code"
              defaultValue={promotionCode}
              onBlur={(e) => onApplyPromotion(e.target.value)}
              className="form-control"
            />
            <p className={`promo-feedback ${pricing.feedbackClass}`}>
              {pricing.feedback || "Enter a valid promotion code"}
            </p>
          </div>
        )}

        <div className="preview-info">
          <p className="text-muted">
            * Platform fee helps us maintain the service
          </p>
          <p className="text-muted">
            * Final amount may vary based on slot selection
          </p>
        </div>
      </div>
    </div>
  );
};

export default BookingPreview;
