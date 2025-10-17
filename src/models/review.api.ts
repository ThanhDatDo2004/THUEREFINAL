import api from "./api";
import type { IApiSuccessResponse } from "../interfaces/common";

export interface Review {
  ReviewCode: number;
  Rating: number;
  Comment?: string;
  FullName: string;
  CreateAt: string;
}

export interface ReviewsListResponse {
  data: Review[];
  stats: {
    avg_rating: number;
    total_reviews: number;
  };
  pagination: {
    limit: number;
    offset: number;
    total: number;
  };
}

export interface CreateReviewRequest {
  rating: number; // 1-5
  comment?: string;
}

export interface CreateReviewResponse {
  reviewCode: number;
  fieldCode: number;
  rating: number;
}

export interface UpdateReviewRequest {
  rating?: number;
  comment?: string;
}

/**
 * Get reviews for a field
 */
export const getFieldReviewsApi = async (
  fieldCode: number,
  limit: number = 10,
  offset: number = 0
): Promise<IApiSuccessResponse<ReviewsListResponse>> => {
  const response = await api.get<IApiSuccessResponse<ReviewsListResponse>>(
    `/fields/${fieldCode}/reviews`,
    { params: { limit, offset } }
  );
  return response.data;
};

/**
 * Create a review for a field
 */
export const createReviewApi = async (
  fieldCode: number,
  data: CreateReviewRequest
): Promise<IApiSuccessResponse<CreateReviewResponse>> => {
  const response = await api.post<IApiSuccessResponse<CreateReviewResponse>>(
    `/fields/${fieldCode}/reviews`,
    data
  );
  return response.data;
};

/**
 * Update a review
 */
export const updateReviewApi = async (
  reviewCode: number,
  data: UpdateReviewRequest
): Promise<IApiSuccessResponse<CreateReviewResponse>> => {
  const response = await api.put<IApiSuccessResponse<CreateReviewResponse>>(
    `/reviews/${reviewCode}`,
    data
  );
  return response.data;
};

/**
 * Delete a review
 */
export const deleteReviewApi = async (
  reviewCode: number
): Promise<IApiSuccessResponse<{ success: true }>> => {
  const response = await api.delete<IApiSuccessResponse<{ success: true }>>(
    `/reviews/${reviewCode}`
  );
  return response.data;
};
