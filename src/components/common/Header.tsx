import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <header className="navbar">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-9 h-9 bg-emerald-600 rounded-lg flex items-center justify-center text-sm font-semibold text-white tracking-widest">
              TR
            </div>
            <span className="text-xl font-bold text-gray-900">ThueRe</span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex space-x-8">
            <Link
              to="/"
              className="text-gray-700 hover:text-emerald-600 transition-colors duration-200 font-medium"
            >
              Trang chủ
            </Link>
            <Link
              to="/fields"
              className="text-gray-700 hover:text-emerald-600 transition-colors duration-200 font-medium"
            >
              Danh sách sân
            </Link>
            {user?.level_type === "cus" && (
              <Link
                to="/cart"
                className="text-gray-700 hover:text-emerald-600 transition-colors duration-200 font-medium"
              >
                Giỏ hàng
              </Link>
            )}
            {user?.level_type === "shop" && (
              <Link
                to="/shop/dashboard"
                className="text-gray-700 hover:text-emerald-600 transition-colors duration-200 font-medium"
              >
                Quản lý Shop
              </Link>
            )}
            {user?.level_type === "admin" && (
              <Link
                to="/admin/dashboard"
                className="text-gray-700 hover:text-emerald-600 transition-colors duration-200 font-medium"
              >
                Quản lý Admin
              </Link>
            )}
          </nav>

          {/* User Actions */}
          <div className="flex items-center">
            {user ? (
              <div className="flex items-center space-x-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-sm font-semibold uppercase text-emerald-700">
                    {user.user_name?.slice(0, 2) ?? "TR"}
                  </span>
                  <div className="flex flex-col leading-tight">
                    <span className="text-gray-700 font-medium">
                      {user.user_name}
                    </span>
                    <span className="text-xs uppercase tracking-wide text-gray-400">
                      ID {user.level_type}
                    </span>
                  </div>
                  <span className="px-2 py-1 text-xs bg-emerald-100 text-emerald-600 rounded-full capitalize">
                    {user.level_type}
                  </span>
                </div>
                {user.level_type === "cus" && (
                  <Link
                    to="/cart"
                    className="inline-flex rounded-lg border border-emerald-200 px-3 py-1 text-sm font-medium text-emerald-700 transition-colors duration-200 hover:bg-emerald-50 md:hidden"
                  >
                    Giỏ hàng
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="rounded-lg border border-transparent px-3 py-1 text-sm font-semibold text-gray-600 transition hover:border-red-100 hover:text-red-600"
                >
                  Đăng xuất
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-emerald-600 transition-colors duration-200 font-medium"
                >
                  Đăng nhập
                </Link>
                <Link
                  to="/register"
                  className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors duration-200 font-medium"
                >
                  Đăng ký
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
