import React, { useEffect, useState } from "react";
import { MapPin, TrendingUp, Clock } from "lucide-react";
import type { FieldWithImages } from "../../types";
import { Link } from "react-router-dom";
import {
  getFieldStatusClass,
  getFieldStatusLabel,
  getSportLabel,
  resolveFieldPrice,
} from "../../utils/field-helpers";
import { fetchFieldStats } from "../../models/fields.api";
import resolveImageUrl from "../../utils/image-helpers";

interface FieldCardProps {
  field: FieldWithImages;
}

const FieldCard: React.FC<FieldCardProps> = ({ field }) => {
  const [bookingCount, setBookingCount] = useState(
    (field as any)?.booking_count || 0
  );
  const [statsLoading, setStatsLoading] = useState(false);

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

  // Fetch field stats to get booking count
  useEffect(() => {
    const loadStats = async () => {
      try {
        setStatsLoading(true);
        const stats = await fetchFieldStats(field.field_code);
        setBookingCount(stats.booking_count || 0);
      } catch (error) {
        console.error("Error loading field stats:", error);
        // Fallback to field data if available
        setBookingCount((field as any)?.booking_count || 0);
      } finally {
        setStatsLoading(false);
      }
    };

    loadStats();
  }, [field.field_code]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const primaryImage = field.images?.[0];
  const img = resolveImageUrl(primaryImage?.image_url, primaryImage?.storage);
  const price = resolveFieldPrice(field);

  return (
    <div className="card field-card flex flex-col">
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
      <div className="card-body flex flex-col flex-grow p-4">
        <div className="flex-grow">
          <h3 className="card-title">{field.field_name}</h3>
          <div className="rating">
            <TrendingUp className="rating-icon text-green-500" />
            <span className="rating-text">
              {statsLoading ? "..." : `${bookingCount} lượt đặt`}
            </span>
          </div>

          <div className="field-meta mt-2">
            <MapPin className="w-4 h-4" />
            <span>{field.address}</span>
          </div>

          <div className="field-meta">
            <Clock className="w-4 h-4" />
            <span>Giờ mở cửa: 6:00 - 22:00</span>
          </div>
        </div>

        <div className="field-footer mt-4 flex items-center justify-between">
          <div className="price">{formatPrice(price)}/giờ</div>
          <Link
            to={`/fields/${field.field_code}`}
            className="btn btn-primary"
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
