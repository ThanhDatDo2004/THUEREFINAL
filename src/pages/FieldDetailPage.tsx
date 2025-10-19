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
  getFieldStatusClass,
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
          <p className="mt-4 text-gray-600">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <Link to="/fields" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-8">
            <ChevronLeft className="w-4 h-4 mr-1" /> Quay lại danh sách sân
          </Link>
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
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
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <Link to="/fields" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-8">
            <ChevronLeft className="w-4 h-4 mr-1" /> Quay lại danh sách sân
          </Link>
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header Navigation */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/fields" className="inline-flex items-center text-blue-600 hover:text-blue-700 transition">
            <ChevronLeft className="w-5 h-5 mr-1" /> Danh sách sân
          </Link>
          <div className="flex gap-2">
            <button className="p-2 hover:bg-gray-100 rounded-lg transition" onClick={() => setLiked(!liked)}>
              <Heart className={`w-5 h-5 ${liked ? "fill-red-500 text-red-500" : "text-gray-600"}`} />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-lg transition">
              <Share2 className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Gallery & Info */}
          <div className="lg:col-span-2">
            {/* Image Gallery */}
            <div className="relative rounded-xl overflow-hidden mb-6 bg-gray-200 h-96 md:h-96 group">
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

                  {/* Image Counter */}
                  <div className="absolute bottom-4 right-4 bg-black/60 text-white px-3 py-1 rounded-full text-sm font-medium">
                    {currentIndex + 1}/{images.length}
                  </div>

                  {/* Thumbnail Gallery */}
                  <div className="absolute bottom-4 left-4 flex gap-2">
                    {images.slice(0, 5).map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentIndex(idx)}
                        className={`w-12 h-12 rounded border-2 transition ${
                          idx === currentIndex ? "border-white" : "border-gray-300 opacity-60 hover:opacity-100"
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

            {/* Field Title & Basic Info */}
            <div className="bg-white rounded-xl p-6 mb-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">{field.field_name}</h1>
                  <p className="text-gray-600 mt-1">
                    {field.shop?.shop_name}
                  </p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2 text-green-600 font-semibold">
                    <TrendingUp className="w-5 h-5" />
                    <span>{bookingCount} đặt</span>
                  </div>
                </div>
              </div>

              {/* Status Badge */}
              <div className="inline-block">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getFieldStatusClass(field.status)}`}>
                  {getFieldStatusLabel(field.status)}
                </span>
              </div>
            </div>

            {/* Details Section */}
            <div className="bg-white rounded-xl p-6 mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Thông tin sân</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Địa điểm</p>
                    <p className="font-medium text-gray-900">{field.address}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Award className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Loại hình</p>
                    <p className="font-medium text-gray-900">{getSportLabel(field.sport_type)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Giờ mở cửa</p>
                    <p className="font-medium text-gray-900">6:00 - 22:00</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Giá</p>
                    <p className="font-medium text-gray-900">{formatVND(price)}/giờ</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Amenities Section */}
            <div className="bg-white rounded-xl p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Tiện ích</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {AVAILABLE_UTILITIES.map((utility) => {
                  const isAvailable = utilities[utility.id] === true;
                  return (
                    <div key={utility.id} className="flex items-center gap-2">
                      {isAvailable ? (
                        <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                      ) : (
                        <div className="w-5 h-5 flex items-center justify-center text-red-500 font-bold flex-shrink-0">
                          ✕
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
            {/* Price Card */}
            <div className="bg-white rounded-xl shadow-lg p-6 sticky top-24">
              <div className="mb-6">
                <p className="text-sm text-gray-600 mb-1">Giá mỗi giờ</p>
                <p className="text-3xl font-bold text-gray-900">{formatVND(price)}</p>
              </div>

              <Link
                to={`/booking/${field.field_code}`}
                state={{ field }}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-semibold hover:shadow-lg transition mb-3 text-center inline-block"
              >
                Đặt sân ngay
              </Link>

              <button className="w-full py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:border-gray-400 transition mb-6">
                Liên hệ chủ sân
              </button>

              {/* Shop Info */}
              <div className="border-t pt-6">
                <h3 className="font-bold text-gray-900 mb-4">Thông tin chủ sân</h3>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                    {field.shop?.shop_name?.charAt(0) || "S"}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{field.shop?.shop_name}</p>
                    <p className="text-sm text-gray-600">Chủ sân xác minh</p>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-700">
                    <Phone className="w-4 h-4 text-blue-600" />
                    <span>0987 654 321</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <Mail className="w-4 h-4 text-blue-600" />
                    <span>contact@field.vn</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <Users className="w-4 h-4 text-blue-600" />
                    <span>{bookingCount} lượt đặt</span>
                  </div>
                </div>
              </div>

              {/* Guarantee Badge */}
              <div className="mt-6 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-xs text-blue-900 font-medium">
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
