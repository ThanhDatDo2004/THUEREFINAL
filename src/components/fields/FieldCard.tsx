import React from "react";
import { MapPin, Star, Clock, DollarSign } from "lucide-react";
import type { FieldWithImages } from "../../types";
import { Link } from "react-router-dom";
import {
  getFieldStatusClass,
  getFieldStatusLabel,
  getSportLabel,
  resolveFieldPrice,
} from "../../utils/field-helpers";
import resolveImageUrl from "../../utils/image-helpers";

interface FieldCardProps {
  field: FieldWithImages;
}

const FieldCard: React.FC<FieldCardProps> = ({ field }) => {
  const sportLabel = getSportLabel(field.sport_type);
  const statusLabel = getFieldStatusLabel(field.status);
  const statusClassName = getFieldStatusClass(field.status);
  const normalizedStatus = field.status
    ? field.status.toString().trim().toLowerCase()
    : "";
  const isBookable = ["active", "available", "open", "trống"].includes(
    normalizedStatus
  );
  const actionLabel = isBookable ? "Xem sân" : statusLabel;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const primaryImage = field.images?.[0];
  const img = resolveImageUrl(
    primaryImage?.image_url,
    primaryImage?.storage
  );
  const price = resolveFieldPrice(field);

  return (
    <div className="card field-card">
      {/* Image */}
      <div className="img-wrap">
        {img ? (
          <img src={img} alt={field.field_name} />
        ) : (
          <div className="img-fallback" />
        )}
        <div className="badge-bl">
          <span className={statusClassName}>{statusLabel}</span>
        </div>
        <div className="badge-tr">
          <span className="badge bg-white/90 backdrop-blur-sm text-gray-800">
            {sportLabel}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="card-body">
        <div className="flex items-start justify-between mb-3">
          <h3 className="card-title">{field.field_name}</h3>
          <div className="rating">
            <Star className="rating-icon" />
            <span className="rating-text">
              {field.averageRating?.toFixed(1) || "0.0"}
            </span>
          </div>
        </div>

        <div className="field-meta">
          <MapPin className="w-4 h-4" />
          <span>{field.address}</span>
        </div>

        <div className="field-meta">
          <Clock className="w-4 h-4" />
          <span>Giờ mở cửa: 6:00 - 22:00</span>
        </div>

        <div className="field-footer">
          <div className="price">{formatPrice(price)}/giờ</div>
          <Link
            to={`/fields/${field.field_code}`}
            className="btn-primary"
            aria-disabled={!isBookable}
          >
            {actionLabel}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default FieldCard;
