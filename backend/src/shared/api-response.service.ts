import { Injectable } from '@nestjs/common';
import {
  ApiResponse,
  PaginatedResponse,
} from './interfaces/api-response.interface';

@Injectable()
export class ApiResponseService {
  /**
   * Create a successful API response
   */
  success<T>(
    data: T,
    message: string = 'Operation successful',
    statusCode: number = 200,
    path?: string,
  ): ApiResponse<T> {
    return {
      success: true,
      message,
      data,
      statusCode,
      timestamp: new Date().toISOString(),
      path,
    };
  }

  /**
   * Create an error API response
   */
  error(
    message: string,
    statusCode: number = 500,
    error?: string,
    path?: string,
  ): ApiResponse {
    return {
      success: false,
      message,
      error,
      statusCode,
      timestamp: new Date().toISOString(),
      path,
    };
  }

  /**
   * Create a paginated response
   */
  paginated<T>(
    data: T[],
    page: number,
    limit: number,
    total: number,
    message: string = 'Data retrieved successfully',
    statusCode: number = 200,
  ): PaginatedResponse<T> {
    const totalPages = Math.ceil(total / limit);

    return {
      success: true,
      message,
      data,
      statusCode,
      timestamp: new Date().toISOString(),
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  /**
   * Create a response with no data
   */
  noData(
    message: string = 'No data found',
    statusCode: number = 204,
    path?: string,
  ): ApiResponse {
    return {
      success: true,
      message,
      statusCode,
      timestamp: new Date().toISOString(),
      path,
    };
  }

  /**
   * Create a validation error response
   */
  validationError(
    errors: string[] | string,
    statusCode: number = 400,
    path?: string,
  ): ApiResponse {
    const errorMessage = Array.isArray(errors) ? errors.join(', ') : errors;

    return {
      success: false,
      message: 'Validation failed',
      error: errorMessage,
      statusCode,
      timestamp: new Date().toISOString(),
      path,
    };
  }

  /**
   * Create an unauthorized response
   */
  unauthorized(
    message: string = 'Unauthorized access',
    path?: string,
  ): ApiResponse {
    return {
      success: false,
      message,
      error: 'Authentication required',
      statusCode: 401,
      timestamp: new Date().toISOString(),
      path,
    };
  }

  /**
   * Create a forbidden response
   */
  forbidden(message: string = 'Access forbidden', path?: string): ApiResponse {
    return {
      success: false,
      message,
      error: 'Insufficient permissions',
      statusCode: 403,
      timestamp: new Date().toISOString(),
      path,
    };
  }

  /**
   * Create a not found response
   */
  notFound(message: string = 'Resource not found', path?: string): ApiResponse {
    return {
      success: false,
      message,
      error: 'The requested resource was not found',
      statusCode: 404,
      timestamp: new Date().toISOString(),
      path,
    };
  }
}
