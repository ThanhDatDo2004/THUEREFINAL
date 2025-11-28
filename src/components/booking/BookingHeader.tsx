import React from "react";
import type { FieldWithImages } from "../../types";

interface BookingHeaderProps {
  field: FieldWithImages | null;
  loading: boolean;
}

/**
 * Header component for booking page
 * Displays field information and images
 */
export const BookingHeader: React.FC<BookingHeaderProps> = ({ field, loading }) => {
  if (loading) {
    return (
      <div className="booking-header loading">
        <div className="placeholder">Loading field information...</div>
      </div>
    );
  }

  if (!field) {
    return (
      <div className="booking-header error">
        <div className="alert alert-danger">Field not found</div>
      </div>
    );
  }

  return (
    <div className="booking-header">
      <div className="field-info">
        <h1>{field.field_name}</h1>
        <p className="sport-type">{field.sport_type}</p>
        <p className="location">{field.address}</p>
      </div>

      {field.images && field.images.length > 0 && (
        <div className="field-images carousel">
          {field.images.map((image, idx) => (
            <div key={idx} className="carousel-item">
              <img src={image.image_url} alt={`${field.field_name} ${idx}`} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BookingHeader;
