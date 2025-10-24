import React, { useEffect, useState } from "react";
import { MapPin, TrendingUp, Clock, Calendar } from "lucide-react";
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
  const actionLabel = isBookable ? "Đặt sân" : statusLabel;

  useEffect(() => {
    const loadStats = async () => {
      try {
        setStatsLoading(true);
        const stats = await fetchFieldStats(field.field_code);
        setBookingCount(stats.booking_count || 0);
      } catch (error) {
        console.error("Error loading field stats:", error);
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

  const getStatusBadgeStyle = (className: string) => {
    if (
      className.includes("available") ||
      className.includes("active") ||
      className.includes("open")
    ) {
      return "bg-green-100 text-green-700 border border-green-200";
    } else if (className.includes("busy") || className.includes("occupied")) {
      return "bg-orange-100 text-orange-700 border border-orange-200";
    } else {
      return "bg-gray-100 text-gray-700 border border-gray-200";
    }
  };

  return (
    <div className="group relative bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2">
      {/* Image Section with Overlay */}
      <div className="relative h-56 overflow-hidden bg-gradient-to-br from-green-50 to-green-100">
        {img ? (
          <img
            src={img}
            alt={field.field_name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-green-100 to-green-200">
            <Calendar className="w-20 h-20 text-green-300" />
          </div>
        )}

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        {/* Sport Type Badge */}
        <div className="absolute top-4 left-4">
          <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-white/95 backdrop-blur-sm text-green-700 shadow-lg">
            {sportLabel}
          </span>
        </div>

        {/* Status Badge */}
        <div className="absolute top-4 right-4">
          <span
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${getStatusBadgeStyle(
              statusClassName
            )} backdrop-blur-sm shadow-lg`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isBookable ? "bg-green-500" : "bg-gray-400"
              } animate-pulse`}
            />
            {statusLabel}
          </span>
        </div>

        {/* Booking Stats Overlay */}
        {bookingCount > 0 && (
          <div className="absolute bottom-4 left-4 flex items-center gap-2 px-3 py-2 rounded-lg bg-white/95 backdrop-blur-sm shadow-lg">
            <TrendingUp className="w-4 h-4 text-green-600" />
            <span className="text-sm font-semibold text-gray-800">
              {statsLoading ? "..." : `${bookingCount} lượt đặt`}
            </span>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-6 space-y-4">
        {/* Title */}
        <h3 className="text-xl font-bold text-gray-900 line-clamp-1 group-hover:text-green-600 transition-colors duration-300">
          {field.field_name}
        </h3>

        {/* Info Items */}
        <div className="space-y-3">
          {/* Address */}
          <div className="flex items-start gap-3 text-gray-600">
            <MapPin className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
            <span className="text-sm leading-relaxed line-clamp-2">
              {field.address}
            </span>
          </div>

          {/* Opening Hours */}
          <div className="flex items-center gap-3 text-gray-600">
            <Clock className="w-5 h-5 text-green-500 flex-shrink-0" />
            <span className="text-sm">
              Giờ mở cửa:{" "}
              <span className="font-semibold text-gray-800">6:00 - 22:00</span>
            </span>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-green-200 to-transparent" />

        {/* Footer */}
        <div className="flex items-center justify-between pt-2">
          {/* Price */}
          <div className="flex flex-col">
            <span className="text-sm text-gray-500">Giá thuê</span>
            <span className="text-2xl font-bold bg-gradient-to-r from-green-600 to-green-500 bg-clip-text text-transparent">
              {formatPrice(price)}
              <span className="text-sm font-normal text-gray-600">/giờ</span>
            </span>
          </div>

          {/* Action Button */}
          <Link
            to={`/fields/${field.field_code}`}
            className={`
              relative px-6 py-3 rounded-xl font-semibold text-sm
              transition-all duration-300 transform
              ${
                isBookable
                  ? "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg shadow-green-500/30 hover:shadow-xl hover:shadow-green-500/40 hover:scale-105 active:scale-95"
                  : "bg-gray-200 text-gray-500 cursor-not-allowed pointer-events-none"
              }
            `}
            aria-disabled={!isBookable}
          >
            {actionLabel}
          </Link>
        </div>
      </div>

      {/* Decorative Corner Element */}
      <div className="absolute bottom-0 right-0 w-32 h-32 bg-gradient-to-tl from-green-50 to-transparent opacity-50 rounded-tl-full transform translate-x-16 translate-y-16 group-hover:scale-150 transition-transform duration-700" />
    </div>
  );
};

export default FieldCard;
