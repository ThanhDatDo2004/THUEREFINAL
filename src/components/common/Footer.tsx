import React from "react";
import { Clock, Mail, MapPin, Phone } from "lucide-react";

const Footer: React.FC = () => {
  const contactItems = [
    {
      icon: MapPin,
      label: "Địa chỉ",
      value: "615 Âu Cơ, Phường Tân Phú, TP. Hồ Chí Minh",
    },
    { icon: Phone, label: "Hotline", value: "0866 845 867" },
    { icon: Mail, label: "Email", value: "thuere2004@gmail.com" },
    { icon: Clock, label: "Hỗ trợ", value: "24/7 Hỗ trợ khách hàng" },
  ];

  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-grid">
          {/* Company Info */}
          <div className="space-y-4">
            <h3 className="footer-title">ThueRe</h3>
            <p className="footer-text">
              Nền tảng đặt sân thể thao hàng đầu Việt Nam. Kết nối người chơi
              với các sân thể thao chất lượng cao.
            </p>
            <div className="flex space-x-3">
              <div className="w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center">
                <span className="text-sm font-bold">
                  <a href="https://www.facebook.com/people/ThueRe/61580979570690/">
                    FB
                  </a>
                </span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="footer-title">Liên kết nhanh</h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="/"
                  className="footer-link"
                >
                  Trang chủ
                </a>
              </li>
              <li>
                <a
                  href="/fields"
                  className="footer-link"
                >
                  Danh sách sân
                </a>
              </li>
              <li>
                <a
                  href="/register"
                  className="footer-link"
                >
                  Đăng ký
                </a>
              </li>
              <li>
                <a
                  href="/login"
                  className="footer-link"
                >
                  Đăng nhập
                </a>
              </li>
            </ul>
          </div>

          {/* Sports */}
          <div className="space-y-4">
            <h3 className="footer-title">Loại sân</h3>
            <ul className="space-y-2">
              <li className="footer-text">Bóng đá</li>
              <li className="footer-text">Cầu lông</li>
              <li className="footer-text">Tennis</li>
              <li className="footer-text">Bóng bàn</li>
              <li className="footer-text">Bóng chày</li>
              <li className="footer-text">Bơi lội</li>
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h3 className="footer-title">Liên hệ</h3>
            <div className="space-y-3">
              {contactItems.map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-emerald-200">
                    <Icon className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.3em] text-emerald-200/60">
                      {label}
                    </p>
                    <p className="text-gray-300 text-sm">{value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
