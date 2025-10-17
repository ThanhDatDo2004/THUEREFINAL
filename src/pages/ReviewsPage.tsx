import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  getFieldReviewsApi,
  createReviewApi,
  updateReviewApi,
  deleteReviewApi,
  Review,
} from "../models/review.api";
import { extractErrorMessage } from "../models/api.helpers";
import LoadingSpinner from "../components/common/LoadingSpinner";
import Layout from "../components/layouts/Layout";
import { Star, Edit2, Trash2 } from "lucide-react";

interface ReviewsState {
  loading: boolean;
  error: string | null;
  reviews: Review[];
  avgRating: number;
  totalReviews: number;
  showForm: boolean;
  formData: {
    rating: number;
    comment: string;
  };
  editingReview: Review | null;
  submitting: boolean;
  totalPagination: number;
  currentPage: number;
}

const ReviewsPage: React.FC = () => {
  const { fieldCode } = useParams<{ fieldCode: string }>();
  const [state, setState] = useState<ReviewsState>({
    loading: true,
    error: null,
    reviews: [],
    avgRating: 0,
    totalReviews: 0,
    showForm: false,
    formData: {
      rating: 5,
      comment: "",
    },
    editingReview: null,
    submitting: false,
    totalPagination: 0,
    currentPage: 0,
  });

  const itemsPerPage = 10;

  // Load reviews
  useEffect(() => {
    loadReviews();
  }, [fieldCode, state.currentPage]);

  const loadReviews = async () => {
    if (!fieldCode) return;

    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      const response = await getFieldReviewsApi(
        parseInt(fieldCode),
        itemsPerPage,
        state.currentPage * itemsPerPage
      );

      if (response.success && response.data) {
        setState((prev) => ({
          ...prev,
          reviews: response.data.data,
          avgRating: response.data.stats.avg_rating,
          totalReviews: response.data.stats.total_reviews,
          totalPagination: response.data.pagination.total,
          loading: false,
        }));
      }
    } catch (err: unknown) {
      const errorMsg = extractErrorMessage(err, "Failed to load reviews");
      setState((prev) => ({ ...prev, error: errorMsg, loading: false }));
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fieldCode) return;

    try {
      setState((prev) => ({ ...prev, submitting: true }));

      if (state.editingReview) {
        // Update review
        await updateReviewApi(state.editingReview.ReviewCode, {
          rating: state.formData.rating,
          comment: state.formData.comment,
        });
        alert("Review updated successfully");
      } else {
        // Create new review
        await createReviewApi(parseInt(fieldCode), {
          rating: state.formData.rating,
          comment: state.formData.comment,
        });
        alert("Review created successfully");
      }

      // Reset form and reload
      setState((prev) => ({
        ...prev,
        showForm: false,
        formData: { rating: 5, comment: "" },
        editingReview: null,
        submitting: false,
        currentPage: 0,
      }));

      await loadReviews();
    } catch (err: unknown) {
      const errorMsg = extractErrorMessage(err, "Failed to submit review");
      setState((prev) => ({ ...prev, submitting: false }));
      alert(errorMsg);
    }
  };

  const handleEditReview = (review: Review) => {
    setState((prev) => ({
      ...prev,
      editingReview: review,
      formData: {
        rating: review.Rating,
        comment: review.Comment || "",
      },
      showForm: true,
    }));
  };

  const handleDeleteReview = async (reviewCode: number) => {
    if (!confirm("Bạn có chắc chắn muốn xóa review này?")) return;

    try {
      await deleteReviewApi(reviewCode);
      alert("Review deleted successfully");
      await loadReviews();
    } catch (err: unknown) {
      const errorMsg = extractErrorMessage(err, "Failed to delete review");
      alert(errorMsg);
    }
  };

  const handleCancelEdit = () => {
    setState((prev) => ({
      ...prev,
      showForm: false,
      formData: { rating: 5, comment: "" },
      editingReview: null,
    }));
  };

  if (state.loading && state.reviews.length === 0) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <LoadingSpinner />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8 flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Đánh Giá Sân</h1>
              <p className="text-gray-600">Xem và chia sẻ đánh giá về sân bóng</p>
            </div>
            {!state.showForm && (
              <button
                onClick={() =>
                  setState((prev) => ({ ...prev, showForm: true }))
                }
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition"
              >
                + Viết Đánh Giá
              </button>
            )}
          </div>

          {/* Error Message */}
          {state.error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-600">{state.error}</p>
            </div>
          )}

          {/* Rating Summary */}
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Đánh Giá Trung Bình</h2>
              </div>
              <div className="text-center">
                <p className="text-5xl font-bold text-blue-600">{state.avgRating.toFixed(1)}</p>
                <div className="flex justify-center gap-1 mt-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-6 h-6 ${
                        star <= Math.round(state.avgRating)
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-gray-600 text-sm mt-2">
                  Dựa trên {state.totalReviews} đánh giá
                </p>
              </div>
            </div>
          </div>

          {/* Review Form */}
          {state.showForm && (
            <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">
                {state.editingReview ? "Cập Nhật Đánh Giá" : "Viết Đánh Giá"}
              </h3>

              <form onSubmit={handleSubmitReview}>
                {/* Rating Input */}
                <div className="mb-6">
                  <label className="block text-gray-700 font-semibold mb-3">
                    Đánh Giá (Sao)
                  </label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() =>
                          setState((prev) => ({
                            ...prev,
                            formData: { ...prev.formData, rating: star },
                          }))
                        }
                        className="focus:outline-none transition transform hover:scale-110"
                      >
                        <Star
                          className={`w-12 h-12 ${
                            star <= state.formData.rating
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-300"
                          } cursor-pointer`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Comment Input */}
                <div className="mb-6">
                  <label className="block text-gray-700 font-semibold mb-3">
                    Nhận Xét (Tùy Chọn)
                  </label>
                  <textarea
                    value={state.formData.comment}
                    onChange={(e) =>
                      setState((prev) => ({
                        ...prev,
                        formData: { ...prev.formData, comment: e.target.value },
                      }))
                    }
                    placeholder="Chia sẻ trải nghiệm của bạn..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none"
                    rows={4}
                  />
                </div>

                {/* Buttons */}
                <div className="flex gap-4">
                  <button
                    type="submit"
                    disabled={state.submitting}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition"
                  >
                    {state.submitting ? "Đang Gửi..." : "Gửi Đánh Giá"}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-900 font-semibold py-3 px-4 rounded-lg transition"
                  >
                    Hủy
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Reviews List */}
          <div className="space-y-4">
            {state.reviews.length > 0 ? (
              state.reviews.map((review) => (
                <div
                  key={review.ReviewCode}
                  className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-semibold text-gray-900">{review.FullName}</p>
                      <p className="text-gray-600 text-sm">
                        {new Date(review.CreateAt).toLocaleDateString("vi-VN")}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {/* Edit Button */}
                      <button
                        onClick={() => handleEditReview(review)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        title="Edit review"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      {/* Delete Button */}
                      <button
                        onClick={() => handleDeleteReview(review.ReviewCode)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="Delete review"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Rating */}
                  <div className="flex gap-1 mb-3">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-5 h-5 ${
                          star <= review.Rating
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>

                  {/* Comment */}
                  {review.Comment && (
                    <p className="text-gray-700">{review.Comment}</p>
                  )}
                </div>
              ))
            ) : (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <p className="text-gray-600 text-lg">Chưa có đánh giá nào</p>
              </div>
            )}
          </div>

          {/* Load More */}
          {state.reviews.length < state.totalPagination && (
            <div className="text-center mt-8">
              <button
                onClick={() =>
                  setState((prev) => ({
                    ...prev,
                    currentPage: prev.currentPage + 1,
                  }))
                }
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition"
              >
                Xem Thêm
              </button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ReviewsPage;
