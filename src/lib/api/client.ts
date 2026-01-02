/**
 * API Client
 * Centralized HTTP client for all API requests
 */

import axios, { AxiosInstance, AxiosError } from "axios";
import { API_CONFIG } from "@/config/site.config";
import type { ApiResponse, ApiError } from "./api.types";
import { getSession } from "next-auth/react"; // Import getSession

export type { ApiResponse, ApiError };

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_CONFIG.BASE_URL,
      timeout: API_CONFIG.TIMEOUT,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Add request interceptor to attach access token
    this.client.interceptors.request.use(
      async (config) => {
        const session = await getSession();
        if (session?.user?.accessToken) {
          config.headers.Authorization = `Bearer ${session.user.accessToken}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => this.handleError(error)
    );
  }

  /**
   * GET request
   */
  async get<T>(url: string, config?: any): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.get<ApiResponse<T>>(url, config);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * POST request
   */
  async post<T>(url: string, data?: any, config?: any): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.post<ApiResponse<T>>(url, data, config);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * PUT request
   */
  async put<T>(url: string, data?: any, config?: any): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.put<ApiResponse<T>>(url, data, config);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * PATCH request
   */
  async patch<T>(url: string, data?: any, config?: any): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.patch<ApiResponse<T>>(url, data, config);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * DELETE request
   */
  async delete<T>(url: string, config?: any): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.delete<ApiResponse<T>>(url, config);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Set authorization token
   */
  setAuthToken(token: string) {
    this.client.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  }

  /**
   * Remove authorization token
   */
  removeAuthToken() {
    delete this.client.defaults.headers.common["Authorization"];
  }

  /**
   * Handle API errors
   */
  private handleError(error: any): never {
    const apiError: ApiError = {
      code: "UNKNOWN_ERROR",
      message: "An unexpected error occurred",
    };

    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const data = error.response?.data as any;

      apiError.code = `HTTP_${status}`;
      apiError.message = data?.message || error.message;
      apiError.details = data?.details;

      // Handle specific status codes
      if (status === 401) {
        apiError.code = "UNAUTHORIZED";
        apiError.message = "Please log in to continue";
      } else if (status === 403) {
        apiError.code = "FORBIDDEN";
        apiError.message = "You don't have permission to access this resource";
      } else if (status === 404) {
        apiError.code = "NOT_FOUND";
        apiError.message = "Resource not found";
      }
    }

    const error_response: ApiResponse<null> = {
      success: false,
      error: apiError,
    };

    throw error_response;
  }
}

export const apiClient = new ApiClient();
