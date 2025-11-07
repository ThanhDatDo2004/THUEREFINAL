import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Calendar,
  CheckCircle,
  Clock,
  Compass,
  MapPin,
  Quote,
  ShieldCheck,
  Sparkles,
  Star,
  Timer,
  Users,
  Zap,
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

  // const quickShortcuts = [
  //   {
  //     icon: MapPin,
  //     title: "Sân bóng đá 7 người",
  //     description: "Lịch trống cuối tuần luôn sẵn",
  //     to: "/fields?sportType=football",
  //   },
  //   {
  //     icon: Clock,
  //     title: "Slot giờ vàng",
  //     description: "Sau 17:00 mỗi ngày",
  //     to: "/fields?sortBy=price&sortDir=asc",
  //   },
  //   {
  //     icon: Calendar,
  //     title: "Đặt liền tay",
  //     description: "Xác nhận chỉ trong 60s",
  //     to: "/fields?sortBy=rating&sortDir=desc",
  //   },
  // ];

  const featureHighlights = [
    {
      icon: ShieldCheck,
      title: "Đối tác uy tín",
      description:
        "100% sân đã được đội ngũ kiểm duyệt chất lượng, cơ sở vật chất, phòng thay đồ và hệ thống chiếu sáng.",
    },
    {
      icon: Sparkles,
      title: "Trải nghiệm liền mạch",
      description:
        "Tra cứu lịch trống, đặt sân, thanh toán – tất cả trong một giao diện thống nhất.",
    },
    {
      icon: Zap,
      title: "Ưu đãi độc quyền",
      description:
        "Combo giờ thấp điểm, mã giảm giá hàng tuần và chương trình thân thiết giúp đội bạn tối ưu chi phí.",
    },
  ];

  const categoryPills = [
    {
      label: "Bóng đá sân 7",
      meta: "Mặt cỏ nhân tạo, có đèn đêm",
      to: "/fields?sportType=football",
    },
    {
      label: "Cầu lông trong nhà",
      meta: "Sàn gỗ chuẩn thi đấu, phòng lạnh",
      to: "/fields?sportType=badminton",
    },
    {
      label: "Tennis ngoài trời",
      meta: "Hệ thống đèn LED tiêu chuẩn",
      to: "/fields?sportType=tennis",
    },
    {
      label: "Bóng rổ cộng đồng",
      meta: "Sân outdoor, đặt nhanh theo giờ",
      to: "/fields?sportType=basketball",
    },
    {
      label: "Bơi & Fitness",
      meta: "Gói thành viên linh hoạt",
      to: "/fields?sportType=swimming",
    },
  ];

  const howItWorks = [
    {
      step: "01",
      title: "Tìm sân phù hợp",
      description:
        "Lọc theo môn, vị trí, khung giờ và giá để cân đối đội hình và ngân sách.",
    },
    {
      step: "02",
      title: "Giữ lịch tức thì",
      description:
        "Xem lịch trống theo thời gian thực, giữ chỗ online và nhận xác nhận qua email.",
    },
    {
      step: "03",
      title: "Tận hưởng trận đấu",
      description:
        "Check-in bằng mã CODE, nhận hỗ trợ từ đội ngũ chăm sóc và tích điểm thưởng mỗi lần chơi.",
    },
  ];

  return (
    <div className="page">
      {/* Hero */}
      <section className="hero">
        <div className="hero-pattern" />
        <div className="hero-inner hero-grid">
          <div className="hero-copy">
            <span className="hero-eyebrow">Nền tảng đặt sân thể thao</span>
            <h1 className="hero-title">
              Sẵn sàng cho trận đấu{" "}
              <span className="hero-highlight">mọi lúc</span>,
              <span className="hero-highlight"> mọi nơi</span>.
            </h1>
            <p className="hero-subtitle">
              Chọn sân phù hợp, giữ vị trí đẹp và hoàn tất thanh toán chỉ trong
              vài thao tác. Đội của bạn sẽ luôn có mặt sân hoàn hảo cho mỗi cuộc
              hẹn.
            </p>

            <div className="hero-actions">
              <Link to="/fields" className="hero-cta">
                <span className="inline-flex items-center">
                  Tìm sân ngay
                  <ArrowRight className="w-5 h-5 ml-2" />
                </span>
              </Link>
              <a href="#shop-form" className="hero-ghost">
                Trở thành đối tác sân
              </a>
            </div>

            <div className="hero-badges">
              <div className="hero-badge">
                <Timer className="w-4 h-4" />
                Giữ lịch tức thời
              </div>
              <div className="hero-badge">
                <Sparkles className="w-4 h-4" />
                Ưu đãi độc quyền hằng tuần
              </div>
            </div>
          </div>

          {/* <div className="hero-card">
            <div className="hero-card-header">
              <span className="hero-card-pill">Gợi ý nhanh</span>
              <h3 className="hero-card-title">Bạn muốn chơi môn gì hôm nay?</h3>
              <p className="hero-card-subtitle">
                Lựa chọn một gợi ý để xem lịch trống và khuyến mãi phù hợp nhất.
              </p>
            </div>

            <div className="hero-shortcuts">
              {quickShortcuts.map((item) => (
                <Link key={item.title} to={item.to} className="hero-shortcut">
                  <div className="hero-shortcut-icon">
                    <item.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">
                      {item.title}
                    </div>
                    <p className="text-sm text-gray-500">{item.description}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-emerald-600 ml-auto" />
                </Link>
              ))}
            </div>

            <div className="hero-card-footer">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <p className="text-xs text-gray-500">
                Giá hiển thị đã bao gồm phí sân và có thể áp dụng khuyến mãi.
              </p>
            </div>
          </div> */}
        </div>
      </section>

      {/* Feature highlights */}
      <section className="home-section">
        <div className="section-header">
          <span className="section-eyebrow">Vì sao chọn chúng tôi?</span>
          <h2 className="section-title">
            Nền tảng đặt sân được tín nhiệm bởi hàng nghìn đội bóng, câu lạc bộ
            và doanh nghiệp.
          </h2>
        </div>
        <div className="feature-grid">
          {featureHighlights.map((item) => (
            <article key={item.title} className="feature-card">
              <div className="feature-icon">
                <item.icon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="feature-title">{item.title}</h3>
                <p className="feature-description">{item.description}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="home-section">
        <div className="section-header">
          <span className="section-eyebrow">Danh mục hot</span>
          <h2 className="section-title">
            Khám phá các bộ môn được đặt nhiều trong tuần này
          </h2>
        </div>
        <div className="categories-scroll">
          {categoryPills.map((item) => (
            <Link key={item.label} to={item.to} className="category-pill">
              <div className="category-label">{item.label}</div>
              <div className="category-meta">{item.meta}</div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured fields */}
      <section className="home-section">
        <div className="section-header">
          <span className="section-eyebrow">Sân được yêu thích</span>
          <div className="section-actions">
            <Link to="/fields" className="btn-link inline-flex items-center">
              Xem tất cả <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
          <h2 className="section-title">
            Những sân đang được đặt lịch – bạn nên giữ chỗ sớm!
          </h2>
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

      {/* How it works */}
      <section className="home-section workflow-section">
        <div className="section-header">
          <span className="section-eyebrow">Đặt sân trong 3 bước</span>
          <h2 className="section-title">
            Quy trình tối giản giúp bạn dành thời gian cho trận đấu thay vì việc
            quản lý.
          </h2>
        </div>
        <div className="workflow-grid">
          {howItWorks.map((item) => (
            <div key={item.step} className="workflow-step">
              <div className="workflow-step-number">{item.step}</div>
              <div className="workflow-step-body">
                <h3 className="workflow-step-title">{item.title}</h3>
                <p className="workflow-step-description">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Shop CTA */}
      <section className="home-section shop-invite">
        <div className="shop-invite-content">
          <div>
            <span className="section-eyebrow text-white/80">
              Dành cho chủ sân & quản lý cụm sân
            </span>
            <h2 className="shop-invite-title">
              Tăng tỷ lệ lấp đầy & quản lý lịch thông minh chỉ với một bảng điều
              khiển
            </h2>
            <p className="shop-invite-subtitle">
              Đăng ký miễn phí, nhận hỗ trợ và cùng hàng trăm đối tác xây dựng
              trải nghiệm thể thao đẳng cấp.
            </p>
          </div>
          <a href="#shop-form" className="shop-invite-button">
            Gửi yêu cầu hợp tác
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </section>

      {/* Shop Request */}
      <section id="shop-form" className="home-section shop-form-wrapper">
        <div className="shop-form-card">
          <ShopRequestForm />
        </div>
      </section>
    </div>
  );
};

export default HomePage;
