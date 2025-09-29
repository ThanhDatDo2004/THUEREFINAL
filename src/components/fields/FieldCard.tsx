import React from "react";
import { MapPin, Star, Clock, DollarSign } from "lucide-react";
import { FieldWithImages } from "../../types";
import { Link } from "react-router-dom";

interface FieldCardProps {
  field: FieldWithImages;
}

const FieldCard: React.FC<FieldCardProps> = ({ field }) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const img = field.images?.[0]?.image_url;

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
          <span className="badge">{field.status}</span>
        </div>
        <div className="badge-tr">
          <span className="badge bg-white/90 backdrop-blur-sm text-gray-800">{field.sport_type}</span>
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
          <div className="price">{formatPrice(field.price_per_hour)}/giờ</div>
          <Link
            to={`/fields/${field.field_code}`}
            className={"btn-primary"}
          >
            {field.status === "trống" ? "Xem sân" : field.status}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default FieldCard;
