// src/pages/FieldDetailPage.tsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Link, useParams } from "react-router-dom";
import {
  MapPin,
  Star,
  Clock,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import { fetchFieldById } from "../models/field.api";
import type { FieldWithImages } from "../types";

type AnyImage = {
  image_code?: number;
  field_code?: number;
  image_url: string;
  sort_order?: number;
  is_primary?: number | boolean;
};

const FieldDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const [field, setField] = useState<FieldWithImages | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [error, setError] = useState("");

  const fetchFieldData = useCallback(async () => {
    if (!id || !Number.isFinite(Number(id))) {
      throw new Error("Mã sân không hợp lệ.");
    }
    return fetchFieldById(Number(id));
  }, [id]);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const data = await fetchFieldData();
        if (alive) setField(data ?? null);
      } catch (err: any) {
        if (alive) {
          setError(
            err?.message || "Không thể tải thông tin sân. Vui lòng thử lại."
          );
          setField(null);
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [fetchFieldData]);

  const statusClass = (s?: string) => {
    if (s === "trống") return "status-chip status-trong";
    if (s === "bảo trì") return "status-chip status-bao-tri";
    return "status-chip status-khac";
  };

  const formatVND = (n: number) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      minimumFractionDigits: 0,
    }).format(n);

  // Helpers to read optional fields safely
  const isPrimary = (img: AnyImage) =>
    Number(img?.is_primary) === 1 || img?.is_primary === true;
  const sortOrder = (img: AnyImage) =>
    typeof img?.sort_order === "number" ? img.sort_order! : 0;
  const imageCode = (img: AnyImage) =>
    typeof img?.image_code === "number" ? img.image_code! : 0;

  // Sắp xếp ảnh: primary -> sort_order -> image_code
  const images: AnyImage[] = useMemo(() => {
    if (!field?.images?.length) return [];
    const sorted = [...(field.images as unknown as AnyImage[])].sort((a, b) => {
      const pa = isPrimary(a) ? 1 : 0;
      const pb = isPrimary(b) ? 1 : 0;
      if (pa !== pb) return pb - pa; // primary trước
      const sa = sortOrder(a);
      const sb = sortOrder(b);
      if (sa !== sb) return sa - sb; // nhỏ trước
      return imageCode(a) - imageCode(b);
    });
    return sorted;
  }, [field]);

  // Khi thay field/images: đặt index về ảnh primary nếu có
  useEffect(() => {
    if (!images.length) {
      setCurrentIndex(0);
      return;
    }
    const idxPrimary = images.findIndex(isPrimary);
    setCurrentIndex(idxPrimary >= 0 ? idxPrimary : 0);
  }, [images]);

  const handlePrev = useCallback(() => {
    if (!images.length) return;
    setCurrentIndex((i) => (i - 1 + images.length) % images.length);
  }, [images.length]);

  const handleNext = useCallback(() => {
    if (!images.length) return;
    setCurrentIndex((i) => (i + 1) % images.length);
  }, [images.length]);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        handlePrev();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        handleNext();
      }
    },
    [handlePrev, handleNext]
  );

  if (loading) {
    return (
      <div className="field-page">
        <div className="field-container">
          <div className="detail-section center">
            <div className="spinner" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="field-page">
        <div className="field-container">
          <Link to="/fields" className="btn-link inline-flex items-center mb-4">
            <ChevronLeft className="w-4 h-4 mr-1" /> Quay lại danh sách sân
          </Link>
          <div className="detail-section flex flex-col items-center text-center gap-3">
            <AlertCircle className="w-10 h-10 text-red-500" />
            <h2 className="text-xl font-semibold text-gray-900">
              Không thể tải dữ liệu
            </h2>
            <p className="text-gray-600">{error}</p>
            <button
              type="button"
              onClick={() => {
                setError("");
                setLoading(true);
                void (async () => {
                  try {
                    const data = await fetchFieldData();
                    setField(data ?? null);
                  } catch (err: any) {
                    setError(
                      err?.message ||
                        "Không thể tải thông tin sân. Vui lòng thử lại."
                    );
                    setField(null);
                  } finally {
                    setLoading(false);
                  }
                })();
              }}
              className="btn-primary"
            >
              Thử lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!field) {
    return (
      <div className="field-page">
        <div className="field-container">
          <Link to="/fields" className="btn-link inline-flex items-center mb-4">
            <ChevronLeft className="w-4 h-4 mr-1" /> Quay lại danh sách sân
          </Link>
          <div className="detail-section">Không tìm thấy sân bạn yêu cầu.</div>
        </div>
      </div>
    );
  }

  const activeSrc = images[currentIndex]?.image_url;

  return (
    <div className="field-page">
      <div className="field-container">
        {/* Breadcrumb/back */}
        <Link to="/fields" className="btn-link inline-flex items-center mb-4">
          <ChevronLeft className="w-4 h-4 mr-1" /> Quay lại danh sách sân
        </Link>

        {/* Hero / Carousel */}
        <section className="field-hero">
          <div
            className="relative w-full h-72 md:h-96 rounded-lg mb-4 overflow-hidden group"
            tabIndex={0}
            onKeyDown={onKeyDown}
            aria-label="Bộ sưu tập hình ảnh sân"
          >
            {activeSrc ? (
              <img
                src={activeSrc}
                alt={`${field.field_name} - ảnh ${currentIndex + 1}/${
                  images.length || 1
                }`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gray-100" />
            )}

            {/* Prev/Next Buttons */}
            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={handlePrev}
                  aria-label="Ảnh trước"
                  className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 hover:bg-black/60 p-2 text-white opacity-0 group-hover:opacity-100 focus:opacity-100 transition"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  aria-label="Ảnh sau"
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 hover:bg-black/60 p-2 text-white opacity-0 group-hover:opacity-100 focus:opacity-100 transition"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>

                {/* Counter */}
                <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                  {currentIndex + 1}/{images.length}
                </div>
              </>
            )}
          </div>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="field-title">{field.field_name}</h1>
              <p className="field-sub">Thuộc: {field.shop?.shop_name}</p>
            </div>
            <div className="rating">
              <Star className="rating-icon" />
              <span className="rating-text">
                {field.averageRating?.toFixed(1) ?? "0.0"}
              </span>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-2">
            <div className="meta">
              <MapPin className="meta-icon" />
              <span>{field.address}</span>
            </div>
            <div className="meta">
              <Clock className="meta-icon" />
              <span>Giờ mở cửa: 6:00 - 22:00</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-gray-700">
                <DollarSign className="w-5 h-5" />
                <span className="font-medium">
                  {formatVND(field.price_per_hour)}/giờ
                </span>
              </div>

              <Link to={`/booking/${field.field_code}`} className="btn-primary">
                Đặt sân
              </Link>
            </div>
            <div>
              <span className={statusClass(field.status)}>{field.status}</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default FieldDetailPage;
