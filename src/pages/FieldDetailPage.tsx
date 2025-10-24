// src/pages/FieldDetailPage.tsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Link, useParams } from "react-router-dom";
import {
  MapPin,
  TrendingUp,
  Clock,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Heart,
  Share2,
  Phone,
  Mail,
  Users,
  Award,
  Star,
  Check,
} from "lucide-react";
import { fetchFieldById } from "../models/fields.api";
import { fetchFieldStats } from "../models/fields.api";
import { getFieldUtilities, AVAILABLE_UTILITIES } from "../models/utilities.api";
import type { FieldWithImages } from "../types";
import {
  // getFieldStatusClass, // Không dùng class tiện ích nữa
  getFieldStatusLabel,
  getSportLabel,
  resolveFieldPrice,
} from "../utils/field-helpers";
import resolveImageUrl from "../utils/image-helpers";

type AnyImage = {
  image_code?: number;
  field_code?: number;
  image_url: string;
  sort_order?: number;
  is_primary?: number | boolean;
  storage?: {
    bucket?: string;
    key?: string;
    region?: string;
  };
};

// Helper mới để map status với các class trong skin.css
// Thay thế cho getFieldStatusClass
const getSkinStatusClass = (status: string) => {
  if (status === "TRONG") {
    return "status-trong";
  }
  if (status === "BAO_TRI") {
    return "status-bao-tri";
  }
  return "status-khac";
};

const FieldDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const [field, setField] = useState<FieldWithImages | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [error, setError] = useState("");
  const [bookingCount, setBookingCount] = useState(0);
  const [liked, setLiked] = useState(false);
  const [utilities, setUtilities] = useState<Record<string, boolean>>({});

  const fetchFieldData = useCallback(async () => {
    if (!id || !Number.isFinite(Number(id))) {
      throw new Error("Mã sân không hợp lệ.");
    }
    return fetchFieldById(Number(id));
  }, [id]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setError("");
        const f = await fetchFieldData();
        if (alive) setField(f);

        // Fetch booking stats
        if (f && alive) {
          try {
            const stats = await fetchFieldStats(f.field_code);
            if (alive) {
              setBookingCount(stats.booking_count || 0);
            }
          } catch (err) {
            console.error("Error loading field stats:", err);
            // Fallback to 0 or field data if available
            if (alive) {
              setBookingCount((f as any)?.booking_count || 0);
            }
          }

          // Fetch field utilities
          try {
            const utils = await getFieldUtilities(f.field_code);
            if (alive) {
              setUtilities(utils);
            }
          } catch (err) {
            console.error("Error loading field utilities:", err);
            // Fallback to all false
            if (alive) {
              const fallback: Record<string, boolean> = {};
              AVAILABLE_UTILITIES.forEach(util => {
                fallback[util.id] = false;
              });
              setUtilities(fallback);
            }
          }
        }
      } catch (err: unknown) {
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
    return sorted.map((img) => {
      const resolved = resolveImageUrl(img.image_url, img.storage);
      return {
        ...img,
        image_url: resolved ?? img.image_url,
      };
    });
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
      // Sử dụng class từ spinner.css
      <div className="page loading-wrap">
        <div className="text-center">
          <div className="spinner" />
          <p className="mt-4 text-gray-600">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page">
        {/* Sử dụng class từ layout.css */}
        <div className="container max-w-4xl">
          {/* Sử dụng class từ buttons.css */}
          <Link to="/fields" className="btn-link inline-flex items-center mb-8">
            <ChevronLeft className="w-4 h-4 mr-1" /> Quay lại danh sách sân
          </Link>
          {/* Sử dụng class từ skin.css */}
          <div className="card p-12 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Không thể tải dữ liệu</h2>
            <p className="text-gray-600 mb-6">{error}</p>
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
              // Sử dụng class từ skin.css
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
      <div className="page">
        <div className="container max-w-4xl">
          <Link to="/fields" className="btn-link inline-flex items-center mb-8">
            <ChevronLeft className="w-4 h-4 mr-1" /> Quay lại danh sách sân
          </Link>
          {/* Sử dụng class từ skin.css */}
          <div className="card p-12 text-center">
            <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900">Không tìm thấy sân</h2>
            <p className="text-gray-600 mt-2">Sân bạn yêu cầu không tồn tại hoặc đã bị xóa.</p>
          </div>
        </div>
      </div>
    );
  }

  const activeImage = images[currentIndex];
  const activeSrc =
    resolveImageUrl(activeImage?.image_url, activeImage?.storage) ??
    activeImage?.image_url;
  const price = resolveFieldPrice(field);
  const brandColor = "var(--brand-600)";
  const brandLightBg = "var(--brand-50)";

  return (
    // Sử dụng class từ layout.css
    <div className="page">
      {/* Header Navigation - Sử dụng class từ nav.css */}
      <div className="navbar sticky top-0 z-40">
        <div className="navbar-inner">
          <Link to="/fields" className="nav-link inline-flex items-center" style={{ color: brandColor }}>
            <ChevronLeft className="w-5 h-5 mr-1" /> Danh sách sân
          </Link>
          <div className="flex gap-2">
            {/* Sử dụng class từ skin.css */}
            <button className="btn-ghost p-2" onClick={() => setLiked(!liked)}>
              <Heart className={`w-5 h-5 ${liked ? "fill-red-500 text-red-500" : "text-gray-600"}`} />
            </button>
            <button className="btn-ghost p-2">
              <Share2 className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content - Sử dụng class từ layout.css */}
      <div className="container">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Gallery & Info */}
          <div className="lg:col-span-2">
            {/* Image Gallery - Cập nhật bo góc và màu sắc */}
            <div className="relative rounded-2xl overflow-hidden mb-6 bg-gray-200 h-96 md:h-96 group">
              {activeSrc ? (
                <img
                  src={activeSrc}
                  alt={`${field.field_name}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                  <span className="text-gray-500">Không có ảnh</span>
                </div>
              )}

              {/* Navigation Buttons */}
              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={handlePrev}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full transition opacity-0 group-hover:opacity-100"
                  >
                    <ChevronLeft className="w-6 h-6 text-gray-900" />
                  </button>
                  <button
                    type="button"
                    onClick={handleNext}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full transition opacity-0 group-hover:opacity-100"
                  >
                    <ChevronRight className="w-6 h-6 text-gray-900" />
                  </button>

                  <div className="absolute bottom-4 right-4 bg-black/60 text-white px-3 py-1 rounded-full text-sm font-medium">
                    {currentIndex + 1}/{images.length}
                  </div>

                  {/* Thumbnail Gallery - Cập nhật màu active */}
                  <div className="absolute bottom-4 left-4 flex gap-2">
                    {images.slice(0, 5).map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentIndex(idx)}
                        className={`w-12 h-12 rounded-lg border-2 transition ${
                          idx === currentIndex ? "border-[var(--brand-600)]" : "border-gray-300 opacity-60 hover:opacity-100"
                        }`}
                        style={{
                          backgroundImage: `url(${images[idx]?.image_url})`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                        }}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Field Title & Basic Info - Sử dụng class .section */}
            <div className="section mb-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">{field.field_name}</h1>
                  <p className="text-gray-600 mt-1">
                    {field.shop?.shop_name}
                  </p>
                </div>
                <div className="text-right">
                  {/* Cập nhật màu xanh lá tối */}
                  <div className="flex items-center gap-2 text-[var(--brand-600)] font-semibold">
                    <TrendingUp className="w-5 h-5" />
                    <span>{bookingCount} đặt</span>
                  </div>
                </div>
              </div>

              {/* Status Badge - Sử dụng class từ skin.css */}
              <div className="inline-block">
                <span className={`status-chip ${getSkinStatusClass(field.status)}`}>
                  {getFieldStatusLabel(field.status)}
                </span>
              </div>
            </div>

            {/* Details Section - Sử dụng class .section */}
            <div className="section mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Thông tin sân</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  {/* Cập nhật màu theo skin */}
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: brandLightBg }}>
                    <MapPin className="w-5 h-5" style={{ color: brandColor }} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Địa điểm</p>
                    <p className="font-medium text-gray-900">{field.address}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: brandLightBg }}>
                    <Award className="w-5 h-5" style={{ color: brandColor }} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Loại hình</p>
                    <p className="font-medium text-gray-900">{getSportLabel(field.sport_type)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: brandLightBg }}>
                    <Clock className="w-5 h-5" style={{ color: brandColor }} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Giờ mở cửa</p>
                    <p className="font-medium text-gray-900">6:00 - 22:00</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: brandLightBg }}>
                    <DollarSign className="w-5 h-5" style={{ color: brandColor }} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Giá</p>
                    <p className="font-medium text-gray-900">{formatVND(price)}/giờ</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Amenities Section - Sử dụng class .section */}
            <div className="section">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Tiện ích</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {AVAILABLE_UTILITIES.map((utility) => {
                  const isAvailable = utilities[utility.id] === true;
                  return (
                    <div key={utility.id} className="flex items-center gap-2">
                      {isAvailable ? (
                        <Check className="w-5 h-5 text-[var(--brand-600)] flex-shrink-0" />
                      ) : (
                        <div className="w-5 h-5 flex items-center justify-center text-gray-400 font-medium flex-shrink-0">
                          X
                        </div>
                      )}
                      <span className={`text-gray-700 ${!isAvailable ? "line-through text-gray-400" : ""}`}>
                        {utility.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column - Booking Card */}
          <div className="lg:col-span-1">
            {/* Price Card - Sử dụng class .card từ skin.css */}
            <div className="card p-6 sticky top-24">
              <div className="mb-6">
                <p className="text-sm text-gray-600 mb-1">Giá mỗi giờ</p>
                <p className="text-3xl font-bold text-gray-900">{formatVND(price)}</p>
              </div>

              {/* Sử dụng class .btn-primary từ skin.css */}
              <Link
                to={`/booking/${field.field_code}`}
                state={{ field }}
                className="btn-primary w-full text-center mb-3"
              >
                Đặt sân ngay
              </Link>

              {/* Sử dụng class .btn-ghost từ skin.css, tùy biến lại màu */}
              <button 
                className="btn-ghost w-full mb-6"
                style={{
                  borderColor: 'var(--brand-600)', 
                  color: 'var(--brand-600)'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--brand-50)'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#fff'}
              >
                Liên hệ chủ sân
              </button>

              {/* Shop Info */}
              <div className="border-t pt-6">
                <h3 className="font-bold text-gray-900 mb-4">Thông tin chủ sân</h3>
                <div className="flex items-center gap-3 mb-4">
                  {/* Cập nhật gradient theo skin */}
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
                    style={{ backgroundImage: 'linear-gradient(135deg, var(--brand-500), var(--brand-600))' }}
                  >
                    {field.shop?.shop_name?.charAt(0) || "S"}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{field.shop?.shop_name}</p>
                    <p className="text-sm text-gray-600">Chủ sân xác minh</p>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-700">
                    <Phone className="w-4 h-4" style={{ color: brandColor }} />
                    <span>0987 654 321</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <Mail className="w-4 h-4" style={{ color: brandColor }} />
                    <span>contact@field.vn</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <Users className="w-4 h-4" style={{ color: brandColor }} />
                    <span>{bookingCount} lượt đặt</span>
                  </div>
                </div>
              </div>

              {/* Guarantee Badge - Cập nhật màu theo skin */}
              <div 
                className="mt-6 p-3 rounded-lg border"
                style={{ 
                  backgroundColor: 'var(--brand-50)', 
                  borderColor: 'var(--brand-200)',
                  color: 'var(--brand-600)'
                }}
              >
                <p className="text-xs font-medium">
                  ✓ Đặt ngay - Thanh toán an toàn - Hoàn tiền nếu hủy
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FieldDetailPage;