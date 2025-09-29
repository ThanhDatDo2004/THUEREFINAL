// Refactored: use utils/fakeApi (JSON) + external CSS
import React, { useEffect, useState } from "react";
import { Search, Filter, MapPin, DollarSign } from "lucide-react";
import FieldCard from "../components/fields/FieldCard";
import { getFields, type FieldsQuery } from "../utils/fakeApi";

const FieldsPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSportType, setSelectedSportType] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [priceRange, setPriceRange] = useState({ min: 0, max: 500000 });
  const [showFilters, setShowFilters] = useState(false);

  const [fields, setFields] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [facets, setFacets] = useState<{
    sportTypes: string[];
    locations: string[];
  }>({
    sportTypes: [],
    locations: [],
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let ignore = false;
    (async () => {
      setLoading(true);
      const q: FieldsQuery = {
        search: searchQuery || undefined,
        sportType: selectedSportType || undefined,
        location: selectedLocation || undefined,
        priceMin: priceRange.min,
        priceMax: priceRange.max,
        page: 1,
        pageSize: 12,
      };
      const { items, total, facets } = await getFields(q);
      if (!ignore) {
        setFields(items);
        setTotal(total);
        setFacets(facets);
      }
      setLoading(false);
    })();
    return () => {
      ignore = true;
    };
  }, [searchQuery, selectedSportType, selectedLocation, priceRange]);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("vi-VN").format(price);

  return (
    <div className="page">
      <div className="container">
        {/* Header */}
        <div className="header-center">
          <h1 className="title-xl">Tìm sân thể thao</h1>
          <p className="subtitle">
            Khám phá và đặt sân thể thao phù hợp với nhu cầu của bạn
          </p>
        </div>

        {/* Search + Filters */}
        <div className="panel">
          {/* Search Bar */}
          <div className="search-wrap mb-4">
            <Search className="search-icon" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm theo tên sân, địa điểm..."
              className="search-input"
            />
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="filter-toggle"
          >
            <Filter className="w-5 h-5" />
            <span>Bộ lọc {showFilters ? "▼" : "▶"}</span>
          </button>

          {/* Filters */}
          {showFilters && (
            <div className="filters-grid">
              {/* Sport Type */}
              <div>
                <label className="label">Loại sân</label>
                <select
                  value={selectedSportType}
                  onChange={(e) => setSelectedSportType(e.target.value)}
                  className="select"
                >
                  <option value="">Tất cả</option>
                  {facets.sportTypes.map((sport) => (
                    <option key={sport} value={sport}>
                      {sport}
                    </option>
                  ))}
                </select>
              </div>

              {/* Location */}
              <div>
                <label className="label">
                  <MapPin className="inline mr-1 w-4 h-4" />
                  Khu vực
                </label>
                <select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="select"
                >
                  <option value="">Tất cả</option>
                  {facets.locations.map((location) => (
                    <option key={location} value={location}>
                      {location}
                    </option>
                  ))}
                </select>
              </div>

              {/* Price Min */}
              <div>
                <label className="label">
                  <DollarSign className="inline mr-1 w-4 h-4" />
                  Giá tối thiểu (VND/giờ)
                </label>
                <input
                  type="number"
                  value={priceRange.min}
                  onChange={(e) =>
                    setPriceRange((prev) => ({
                      ...prev,
                      min: Number(e.target.value),
                    }))
                  }
                  className="input"
                  min={0}
                  step={10000}
                />
              </div>

              {/* Price Max */}
              <div>
                <label className="label">Giá tối đa (VND/giờ)</label>
                <input
                  type="number"
                  value={priceRange.max}
                  onChange={(e) =>
                    setPriceRange((prev) => ({
                      ...prev,
                      max: Number(e.target.value),
                    }))
                  }
                  className="input"
                  min={0}
                  step={10000}
                />
              </div>
            </div>
          )}
        </div>

        {/* Results */}
        <div className="results-bar">
          <h2 className="results-title">Kết quả ({total} sân)</h2>
          <div className="price-info">
            Giá: {formatPrice(priceRange.min)}đ - {formatPrice(priceRange.max)}đ
          </div>
        </div>

        {/* Fields Grid */}
        {loading ? (
          <div className="center muted">Đang tải...</div>
        ) : fields.length > 0 ? (
          <div className="grid-cards">
            {fields.map((field) => (
              <FieldCard key={field.field_code} field={field} />
            ))}
          </div>
        ) : (
          <div className="empty">
            <div className="empty-icon-wrap">
              <Search className="empty-icon" />
            </div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              Không tìm thấy sân phù hợp
            </h3>
            <p className="muted mb-4">
              Hãy thử điều chỉnh bộ lọc để tìm được sân mong muốn
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedSportType("");
                setSelectedLocation("");
                setPriceRange({ min: 0, max: 500000 });
              }}
              className="btn-primary"
            >
              Xóa bộ lọc
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FieldsPage;
