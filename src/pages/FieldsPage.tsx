import React, { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ChevronDown,
  MapPin,
  RefreshCcw,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import FieldCard from "../components/fields/FieldCard";
import { fetchFields } from "../models/fields.api";
import type { FieldWithImages, FieldsQuery } from "../types";
import type { FieldsListResultNormalized } from "../models/fields.api";

type PriceRange = { min: number; max: number };

const DEFAULT_PRICE: PriceRange = { min: 0, max: 500_000 };
const PAGE_SIZE_OPTIONS = [6, 9, 12];

type WardOption = { code: string; name: string };
type DistrictOption = { code: string; name: string; wards: WardOption[] };
type ProvinceOption = {
  code: string;
  name: string;
  districts: DistrictOption[];
};

type QuickFilter =
  | {
      id: string;
      label: string;
      type: "price";
      payload: PriceRange;
    }
  | {
      id: string;
      label: string;
      type: "sport" | "location";
      payload: string;
    }
  | {
      id: string;
      label: string;
      type: "reset";
    };

const FieldsPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSportType, setSelectedSportType] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [priceRange, setPriceRange] = useState<PriceRange>(DEFAULT_PRICE);
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[2]);
  const [activeQuickFilter, setActiveQuickFilter] = useState<string | null>(
    null
  );

  const [provinces, setProvinces] = useState<ProvinceOption[]>([]);
  const [locationsLoading, setLocationsLoading] = useState(false);
  const [locationsError, setLocationsError] = useState("");
  const [provinceCode, setProvinceCode] = useState("");
  const [districtCode, setDistrictCode] = useState("");
  const [wardCode, setWardCode] = useState("");

  const [fields, setFields] = useState<FieldWithImages[]>([]);
  const [queryMeta, setQueryMeta] = useState<
    FieldsListResultNormalized["meta"] | null
  >(null);
  const [total, setTotal] = useState(0);
  const [facets, setFacets] = useState<{
    sportTypes: string[];
    locations: string[];
  }>({ sportTypes: [], locations: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    setError("");
    const q: FieldsQuery = {
      search: searchQuery || undefined,
      sportType: selectedSportType || undefined,
      location: selectedLocation || undefined,
      priceMin:
        priceRange.min !== DEFAULT_PRICE.min ? priceRange.min : undefined,
      priceMax:
        priceRange.max !== DEFAULT_PRICE.max ? priceRange.max : undefined,
      page,
      pageSize,
      // Do not force sorting by rating; let backend default ordering apply
    };
    try {
      // DEBUG: verify requested page/params
      // eslint-disable-next-line no-console
      console.log("[FieldsPage] Request params", q);
      const payload = await fetchFields(q);
      // DEBUG: verify response pagination and items
      // eslint-disable-next-line no-console
      console.log(
        "[FieldsPage] Response pagination",
        payload?.meta?.pagination,
        "firstCodes",
        (payload?.items || []).slice(0, 3).map((x) => x.field_code),
        "count",
        payload?.items?.length
      );
      setFields(payload.items);
      setTotal(payload.meta.pagination.total);
      setFacets({
        sportTypes: payload.facets.sportTypes ?? [],
        locations: payload.facets.locations ?? [],
      });
      setQueryMeta(payload.meta);
    } catch (err: any) {
      setError(
        err?.message || "Không thể tải danh sách sân. Vui lòng thử lại."
      );
      setFields([]);
      setQueryMeta(null);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [
    page,
    pageSize,
    priceRange.max,
    priceRange.min,
    searchQuery,
    selectedLocation,
    selectedSportType,
  ]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    let cancelled = false;
    const loadLocations = async () => {
      setLocationsLoading(true);
      setLocationsError("");
      try {
        const response = await fetch(
          "https://provinces.open-api.vn/api/?depth=3"
        );
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const data = (await response.json()) as Array<{
          code: number | string;
          name: string;
          districts: Array<{
            code: number | string;
            name: string;
            wards: Array<{ code: number | string; name: string }>;
          }>;
        }>;
        if (!cancelled) {
          const normalized: ProvinceOption[] = data.map((province) => ({
            code: String(province.code),
            name: province.name,
            districts: province.districts.map((district) => ({
              code: String(district.code),
              name: district.name,
              wards: district.wards.map((ward) => ({
                code: String(ward.code),
                name: ward.name,
              })),
            })),
          }));
          setProvinces(normalized);
        }
      } catch (error) {
        console.error("Failed to load provinces", error);
        if (!cancelled) {
          setLocationsError(
            "Không thể tải danh sách tỉnh/thành, hãy tự nhập hoặc thử lại sau"
          );
          setProvinces([]);
        }
      } finally {
        if (!cancelled) {
          setLocationsLoading(false);
        }
      }
    };

    loadLocations();
    return () => {
      cancelled = true;
    };
  }, []);

  const totalPages = queryMeta?.pagination.totalPages ?? 1;
  const currentPage = queryMeta?.pagination.page ?? page;

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedSportType("");
    setSelectedLocation("");
    setPriceRange(DEFAULT_PRICE);
    setPage(1);
    setActiveQuickFilter(null);
    setProvinceCode("");
    setDistrictCode("");
    setWardCode("");
  };

  const facetSportTypeOptions = useMemo(() => {
    return facets.sportTypes.map((item) => ({ label: item, value: item }));
  }, [facets.sportTypes]);

  const facetLocationOptions = useMemo(() => {
    return facets.locations.map((item) => ({ label: item, value: item }));
  }, [facets.locations]);

  const quickFilters = useMemo<QuickFilter[]>(() => {
    const filters: QuickFilter[] = [
      {
        id: "price-under-150",
        label: "Giá dưới 150K",
        type: "price",
        payload: { min: 0, max: 150_000 },
      },
      {
        id: "price-150-300",
        label: "150K - 300K",
        type: "price",
        payload: { min: 150_000, max: 300_000 },
      },
      {
        id: "price-over-300",
        label: "Trên 300K",
        type: "price",
        payload: { min: 300_000, max: 1_000_000 },
      },
    ];

    facets.sportTypes.slice(0, 2).forEach((sport, index) => {
      filters.push({
        id: `sport-${index}`,
        label: `Sân ${sport}`,
        type: "sport",
        payload: sport,
      });
    });

    facets.locations.slice(0, 2).forEach((location, index) => {
      filters.push({
        id: `location-${index}`,
        label: location,
        type: "location",
        payload: location,
      });
    });

    filters.push({ id: "reset", label: "Xóa gợi ý", type: "reset" });

    return filters;
  }, [facets.locations, facets.sportTypes]);

  const isFiltering =
    Boolean(searchQuery || selectedSportType || selectedLocation) ||
    priceRange.min !== DEFAULT_PRICE.min ||
    priceRange.max !== DEFAULT_PRICE.max;

  const applyQuickFilter = (filter: QuickFilter) => {
    setActiveQuickFilter(filter.id === "reset" ? null : filter.id);
    if (filter.type === "price") {
      setPriceRange(filter.payload);
      setSelectedLocation("");
      setSelectedSportType("");
      setPage(1);
      return;
    }
    if (filter.type === "sport") {
      setSelectedSportType(filter.payload);
      setSelectedLocation("");
      setPriceRange(DEFAULT_PRICE);
      setPage(1);
      setProvinceCode("");
      setDistrictCode("");
      setWardCode("");
      return;
    }
    if (filter.type === "location") {
      setSelectedLocation(filter.payload);
      setSelectedSportType("");
      setPriceRange(DEFAULT_PRICE);
      setPage(1);
      setProvinceCode("");
      setDistrictCode("");
      setWardCode("");
      return;
    }
    if (filter.type === "reset") {
      handleResetFilters();
    }
  };

  const selectedProvince = useMemo(() => {
    if (!provinceCode) return null;
    return provinces.find((province) => province.code === provinceCode) ?? null;
  }, [provinceCode, provinces]);

  const availableDistricts = selectedProvince?.districts ?? [];

  const selectedDistrict = useMemo(() => {
    if (!districtCode) return null;
    return (
      availableDistricts.find((district) => district.code === districtCode) ??
      null
    );
  }, [availableDistricts, districtCode]);

  const availableWards = selectedDistrict?.wards ?? [];

  const selectedWard = useMemo(() => {
    if (!wardCode) return null;
    return availableWards.find((ward) => ward.code === wardCode) ?? null;
  }, [availableWards, wardCode]);

  useEffect(() => {
    if (!provinceCode) {
      setDistrictCode("");
      setWardCode("");
    }
  }, [provinceCode]);

  useEffect(() => {
    if (!districtCode) {
      setWardCode("");
    }
  }, [districtCode]);

  useEffect(() => {
    if (!provinceCode && !districtCode && !wardCode) {
      return;
    }

    const parts = [
      selectedWard?.name,
      selectedDistrict?.name,
      selectedProvince?.name,
    ].filter(Boolean);

    const composed = parts.join(", ");
    setSelectedLocation(composed);
    setActiveQuickFilter(null);
    setPage(1);
  }, [
    selectedDistrict,
    selectedProvince,
    selectedWard,
    provinceCode,
    districtCode,
    wardCode,
  ]);

  return (
    <div className="page">
      <div className="fields-layout">
        <aside className={`filters-panel ${showFilterDrawer ? "open" : ""}`}>
          <div className="filters-header">
            <div>
              <span className="filters-eyebrow">Bộ lọc</span>
              <h2 className="filters-title">Tìm nhanh sân phù hợp</h2>
            </div>
            <button
              className="filters-close"
              onClick={() => setShowFilterDrawer(false)}
            >
              Đóng
            </button>
          </div>

          <div className="filters-body">
            <div className="filter-group">
              <label className="filter-label">
                Tìm theo tên sân hoặc từ khóa
              </label>
              <div className="filter-search">
                <Search className="filter-search-icon" />
                <input
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setActiveQuickFilter(null);
                  }}
                  placeholder="Nhập tên sân, địa điểm, quận..."
                />
              </div>
            </div>

            <div className="filter-group">
              <label className="filter-label">Loại hình</label>
              <div className="filter-select">
                <select
                  value={selectedSportType}
                  onChange={(e) => {
                    setSelectedSportType(e.target.value);
                    setActiveQuickFilter(null);
                    setPage(1);
                  }}
                >
                  <option value="">Tất cả</option>
                  {facetSportTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="filter-select-icon" />
              </div>
            </div>

            <div className="filter-group">
              <label className="filter-label">Khu vực</label>
              <div className="filter-select">
                <select
                  value={selectedLocation}
                  onChange={(e) => {
                    setSelectedLocation(e.target.value);
                    setActiveQuickFilter(null);
                    setPage(1);
                  }}
                >
                  <option value="">Tất cả</option>
                  {facetLocationOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <MapPin className="filter-select-icon" />
              </div>
            </div>

            <div className="filter-group">
              <label className="filter-label">Khoảng giá (VND / giờ)</label>
              <div className="filter-price">
                <div>
                  <span>Tối thiểu</span>
                  <input
                    type="number"
                    min={0}
                    step={10_000}
                    value={priceRange.min}
                    onChange={(e) => {
                      const value = Number(e.target.value);
                      setPriceRange((prev) => ({ ...prev, min: value }));
                      setActiveQuickFilter(null);
                      setPage(1);
                    }}
                  />
                </div>
                <div>
                  <span>Tối đa</span>
                  <input
                    type="number"
                    min={0}
                    step={10_000}
                    value={priceRange.max}
                    onChange={(e) => {
                      const value = Number(e.target.value);
                      setPriceRange((prev) => ({ ...prev, max: value }));
                      setActiveQuickFilter(null);
                      setPage(1);
                    }}
                  />
                </div>
              </div>
            </div>
            <div className="filter-group">
              <label className="filter-label">Tỉnh / Thành</label>
              <div className="filter-select">
                <select
                  value={provinceCode}
                  onChange={(e) => {
                    setProvinceCode(e.target.value);
                    setActiveQuickFilter(null);
                  }}
                  disabled={locationsLoading || !provinces.length}
                >
                  <option value="">
                    {locationsLoading ? "Đang tải..." : "Chọn tỉnh / thành"}
                  </option>
                  {provinces.map((province) => (
                    <option key={province.code} value={province.code}>
                      {province.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="filter-select-icon" />
              </div>
              {locationsError && !provinces.length && (
                <p className="filter-hint text-xs text-amber-600">
                  {locationsError}
                </p>
              )}
            </div>

            <div className="filter-group">
              <label className="filter-label">Quận / Huyện</label>
              <div className="filter-select">
                <select
                  value={districtCode}
                  onChange={(e) => {
                    setDistrictCode(e.target.value);
                    setActiveQuickFilter(null);
                  }}
                  disabled={!availableDistricts.length}
                >
                  <option value="">
                    {provinceCode ? "Chọn quận / huyện" : "Chọn tỉnh trước"}
                  </option>
                  {availableDistricts.map((district) => (
                    <option key={district.code} value={district.code}>
                      {district.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="filter-select-icon" />
              </div>
            </div>

            <div className="filter-group">
              <label className="filter-label">Phường / Xã</label>
              <div className="filter-select">
                <select
                  value={wardCode}
                  onChange={(e) => {
                    setWardCode(e.target.value);
                    setActiveQuickFilter(null);
                  }}
                  disabled={!availableWards.length}
                >
                  <option value="">
                    {districtCode ? "Chọn phường / xã" : "Chọn quận trước"}
                  </option>
                  {availableWards.map((ward) => (
                    <option key={ward.code} value={ward.code}>
                      {ward.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="filter-select-icon" />
              </div>
            </div>
          </div>

          <div className="filters-footer">
            <button className="btn-reset" onClick={handleResetFilters}>
              <RefreshCcw className="w-4 h-4" />
              Xóa bộ lọc
            </button>
          </div>
        </aside>

        <main className="fields-content">
          <header className="fields-header">
            <div>
              <h1 className="fields-title">Tìm sân thể thao</h1>
              <p className="fields-subtitle">
                Lọc theo vị trí, loại hình, giá và đánh giá để đặt sân phù hợp
                nhất.
              </p>
            </div>
            <button
              className="filters-toggle"
              onClick={() => setShowFilterDrawer((prev) => !prev)}
            >
              <SlidersHorizontal className="w-4 h-4" />
              Bộ lọc
              {isFiltering && <span className="filters-dot" />}
            </button>
          </header>

          {!!error && (
            <div className="notice notice-error">
              <AlertCircle className="w-5 h-5" />
              {error}
            </div>
          )}

          {!error && (
            <div className="fields-topbar">
              <div className="fields-summary">
                <span className="fields-summary-count">{total}</span>
                <span className="fields-summary-label">sân phù hợp</span>
              </div>
              <div className="fields-controls">
                <label className="fields-page-size">
                  <span>Hiển thị</span>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setActiveQuickFilter(null);
                      setPage(1);
                    }}
                  >
                    {PAGE_SIZE_OPTIONS.map((size) => (
                      <option key={size} value={size}>
                        {size} / trang
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>
          )}

          {!error && quickFilters.length > 0 && (
            <div className="quick-filters">
              <span className="quick-filters-label">Gợi ý nhanh:</span>
              <div className="quick-filters-scroll">
                {quickFilters.map((filter) => (
                  <button
                    key={filter.id}
                    className={`quick-filter-chip ${
                      activeQuickFilter === filter.id ? "active" : ""
                    }`}
                    onClick={() => applyQuickFilter(filter)}
                    type="button"
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {loading ? (
            <div className="fields-loading">Đang tải dữ liệu...</div>
          ) : fields.length ? (
            <div className="grid-cards">
              {fields.map((field) => (
                <FieldCard key={field.field_code} field={field} />
              ))}
            </div>
          ) : !error ? (
            <div className="empty-state">
              <AlertCircle className="empty-state-icon" />
              <h3>Không tìm thấy sân phù hợp</h3>
              <p>Hãy điều chỉnh bộ lọc hoặc thử tìm kiếm với từ khóa khác.</p>
              <button className="btn-primary" onClick={handleResetFilters}>
                Đặt lại bộ lọc
              </button>
            </div>
          ) : null}

          {totalPages > 1 && !loading && (
            <div className="pagination">
              <button
                className="pagination-button"
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage <= 1}
              >
                Trước
              </button>
              <div className="pagination-info">
                Trang {currentPage} / {totalPages}
              </div>
              <button
                className="pagination-button"
                onClick={() =>
                  setPage((prev) => Math.min(totalPages, prev + 1))
                }
                disabled={currentPage >= totalPages}
              >
                Sau
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default FieldsPage;
