import React, { useState } from "react";
import type { ConfirmBookingPayload } from "../../models/booking.api";

type BookingFormSubmitPayload = ConfirmBookingPayload & {
  field_code: number;
};

interface BookingFormProps {
  onSubmit: (payload: BookingFormSubmitPayload) => Promise<void>;
  loading: boolean;
  fieldCode: number;
}

type PaymentMethod = "card" | "bank" | "ewallet";

interface BookingFormState {
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  payment_method: PaymentMethod;
  notes: string;
}

type CustomerFieldKey = keyof BookingFormState["customer"];

const CUSTOMER_FIELDS: ReadonlyArray<CustomerFieldKey> = ["name", "email", "phone"];
const isCustomerField = (value: string): value is CustomerFieldKey =>
  (CUSTOMER_FIELDS as readonly string[]).includes(value);

const initialState: BookingFormState = {
  customer: {
    name: "",
    email: "",
    phone: "",
  },
  payment_method: "card",
  notes: "",
};

/**
 * Form component for booking submission
 * Handles customer info and booking confirmation
 */
export const BookingForm: React.FC<BookingFormProps> = ({
  onSubmit,
  loading,
  fieldCode,
}) => {
  const [formData, setFormData] = useState<BookingFormState>(initialState);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    if (name.startsWith("customer.")) {
      const [, field] = name.split(".");
      if (field && isCustomerField(field)) {
        setFormData((prev) => ({
          ...prev,
          customer: {
            ...prev.customer,
            [field]: value,
          },
        }));
      }
      return;
    }
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!formData.customer.name || !formData.customer.email) {
      alert("Please fill in required fields");
      return;
    }

    const payload: BookingFormSubmitPayload = {
      ...formData,
      field_code: fieldCode,
      slots: [],
      total_price: 0,
    };

    await onSubmit(payload);
  };

  return (
    <form className="booking-form" onSubmit={handleSubmit}>
      <div className="form-section">
        <h3>Customer Information</h3>
        
        <div className="form-group">
          <label>Full Name *</label>
          <input
            type="text"
            name="customer.name"
            value={formData.customer.name}
            onChange={handleInputChange}
            required
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label>Email *</label>
          <input
            type="email"
            name="customer.email"
            value={formData.customer.email}
            onChange={handleInputChange}
            required
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label>Phone</label>
          <input
            type="tel"
            name="customer.phone"
            value={formData.customer.phone}
            onChange={handleInputChange}
            disabled={loading}
          />
        </div>
      </div>

      <div className="form-section">
        <h3>Payment Method</h3>
        
        <div className="form-group">
          <select
            name="payment_method"
            value={formData.payment_method}
            onChange={handleInputChange}
            disabled={loading}
          >
            <option value="card">Credit Card</option>
            <option value="bank">Bank Transfer</option>
            <option value="ewallet">E-Wallet</option>
          </select>
        </div>
      </div>

      <div className="form-section">
        <h3>Additional Notes</h3>
        
        <div className="form-group">
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleInputChange}
            placeholder="Any special requests?"
            rows={3}
            disabled={loading}
          />
        </div>
      </div>

      <button
        type="submit"
        className="btn btn-primary btn-lg"
        disabled={loading}
      >
        {loading ? "Booking..." : "Confirm Booking"}
      </button>
    </form>
  );
};

export default BookingForm;
