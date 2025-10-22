import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, LogOut, Trophy } from "lucide-react";
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
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
              <Trophy className="w-5 h-5 text-white" />
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
                <div className="flex items-center space-x-2">
                  <User className="w-5 h-5 text-gray-600" />
                  <span className="text-gray-700 font-medium">
                    {user.user_name}
                  </span>
                  <span className="px-2 py-1 text-xs bg-emerald-100 text-emerald-600 rounded-full">
                    {user.level_type}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-1 text-gray-600 hover:text-red-600 transition-colors duration-200"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Đăng xuất</span>
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
