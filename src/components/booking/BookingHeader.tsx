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
        <h1>{field.FieldName}</h1>
        <p className="sport-type">{field.SportType}</p>
        <p className="location">{field.Location}</p>
      </div>

      {field.images && field.images.length > 0 && (
        <div className="field-images carousel">
          {field.images.map((image, idx) => (
            <div key={idx} className="carousel-item">
              <img src={image.ImageUrl} alt={`${field.FieldName} ${idx}`} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BookingHeader;
