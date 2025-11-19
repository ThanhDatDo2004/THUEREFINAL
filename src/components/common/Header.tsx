import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { LogOut, ShoppingCart, Trophy, User as UserIcon } from "lucide-react";
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
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/40">
              <Trophy className="w-5 h-5" />
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
                to="/shop/fields"
                className="text-gray-700 hover:text-emerald-600 transition-colors duration-200 font-medium"
              >
                Quản lý tài khoản
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
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                    <UserIcon className="h-5 w-5" />
                  </span>
                  <div className="flex flex-col leading-tight">
                    <span className="text-gray-700 font-medium">
                      {user.user_name}
                    </span>
                  </div>
                  <span className="px-2 py-1 text-xs bg-emerald-100 text-emerald-600 rounded-full capitalize">
                    {user.level_type}
                  </span>
                </div>
                {user.level_type === "cus" && (
                  <Link
                    to="/cart"
                    className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 px-3 py-1 text-sm font-medium text-emerald-700 transition-colors duration-200 hover:bg-emerald-50 md:hidden"
                  >
                    <ShoppingCart className="h-4 w-4" />
                    Giỏ hàng
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center gap-1 rounded-lg border border-transparent px-3 py-1 text-sm font-semibold text-gray-600 transition hover:border-red-100 hover:text-red-600"
                >
                  <LogOut className="h-4 w-4" />
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
