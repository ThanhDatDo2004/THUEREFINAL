import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  Star,
  Users,
  CheckCircle,
  ArrowRight,
  Calendar,
  MapPin,
  Clock,
} from "lucide-react";
import FieldCard from "../components/fields/FieldCard";
import ShopRequestForm from "../components/forms/ShopRequestForm";
import { fetchFields } from "../models/fields.api";
import type { FieldWithImages, FieldsQuery } from "../types";

const HomePage: React.FC = () => {
  const [featured, setFeatured] = useState<FieldWithImages[]>([]);
  const [loadingFeatured, setLoadingFeatured] = useState(false);
  const [featuredError, setFeaturedError] = useState("");

  useEffect(() => {
    let ignore = false;
    (async () => {
      setLoadingFeatured(true);
      setFeaturedError("");
      const q: FieldsQuery = {
        page: 1,
        pageSize: 6,
        sortBy: "rating",
        sortDir: "desc",
      };
      try {
        const { items } = await fetchFields(q);
        if (!ignore) setFeatured(items);
      } catch (err: any) {
        if (!ignore) {
          setFeaturedError(
            err?.message || "Không thể tải danh sách sân nổi bật."
          );
          setFeatured([]);
        }
      } finally {
        if (!ignore) setLoadingFeatured(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, []);

  const stats = [
    { icon: Users, label: "Người dùng", value: "25K+" },
    { icon: CheckCircle, label: "Đặt sân thành công", value: "120K+" },
    { icon: Calendar, label: "Sân khả dụng", value: "350+" },
    { icon: Star, label: "Đánh giá trung bình", value: "4.8/5" },
  ];

  return (
    <div className="page">
      {/* Hero */}
      <section className="hero">
        <div className="hero-overlay" />
        <div className="hero-inner">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="hero-title">
              Đặt sân thể thao
              <span className="hero-highlight">Dễ dàng & Nhanh chóng</span>
            </h1>
            <p className="hero-subtitle">
              Kết nối bạn với hàng trăm sân thể thao chất lượng cao trên toàn
              quốc. Đặt sân chỉ trong vài click!
            </p>

            <div className="hero-actions">
              <Link to="/fields" className="hero-cta">
                <span className="inline-flex items-center">
                  Bắt đầu tìm sân
                  <ArrowRight className="w-5 h-5 ml-2" />
                </span>
              </Link>
              <a href="#shop-form" className="hero-ghost">
                Đăng ký mở shop
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="container">
          <div className="stats-grid">
            {stats.map((stat, i) => (
              <div key={i} className="stat-card">
                <div className="stat-icon">
                  <stat.icon className="w-8 h-8 text-emerald-600" />
                </div>
                <div className="text-sm uppercase tracking-wider text-gray-500">
                  {stat.label}
                </div>
                <div className="text-3xl font-bold text-gray-900">
                  {stat.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured fields */}
      <section className="featured-section">
        <div className="featured-header">
          <h2 className="featured-title">Sân nổi bật</h2>
          <Link to="/fields" className="btn-link inline-flex items-center">
            Xem tất cả <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </div>
        <div className="featured-grid">
          {loadingFeatured ? (
            <div className="col-span-full text-center text-gray-500">
              Đang tải sân nổi bật...
            </div>
          ) : featuredError ? (
            <div className="col-span-full text-center text-red-600">
              {featuredError}
            </div>
          ) : featured.length > 0 ? (
            featured.map((field) => (
              <FieldCard key={field.field_code} field={field} />
            ))
          ) : (
            <div className="col-span-full text-center text-gray-500">
              Chưa có sân nổi bật để hiển thị.
            </div>
          )}
        </div>
      </section>

      {/* Shop Request */}
      <section id="shop-form" className="container">
        <ShopRequestForm />
      </section>
    </div>
  );
};

export default HomePage;
