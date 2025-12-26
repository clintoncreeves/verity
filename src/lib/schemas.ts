/**
 * Zod schemas for API request validation
 */

import { z } from 'zod';

/**
 * Main verification request schema
 */
export const VerificationRequestSchema = z.object({
  type: z.enum(['text', 'image', 'url'], {
    message: 'Type must be text, image, or url',
  }),
  content: z.string().min(1, 'Content is required').max(10000, 'Content too long'),
});

export type VerificationRequest = z.infer<typeof VerificationRequestSchema>;

/**
 * Image upload validation schema
 */
export const ImageUploadSchema = z.object({
  file: z
    .instanceof(File)
    .refine((file) => file.size <= 10 * 1024 * 1024, 'File size must be less than 10MB')
    .refine(
      (file) => ['image/png', 'image/jpeg', 'image/webp', 'image/gif'].includes(file.type),
      'File must be PNG, JPG, WebP, or GIF'
    ),
});

export type ImageUpload = z.infer<typeof ImageUploadSchema>;

/**
 * Fact check query schema
 */
export const FactCheckQuerySchema = z.object({
  claim: z
    .string()
    .min(3, 'Claim must be at least 3 characters')
    .max(500, 'Claim must be less than 500 characters'),
  languageCode: z.string().optional().default('en'),
  pageSize: z.coerce.number().min(1).max(50).optional().default(10),
  pageToken: z.string().optional(),
});

export type FactCheckQuery = z.infer<typeof FactCheckQuerySchema>;

/**
 * Source evaluation schema
 */
export const SourceEvaluateSchema = z.object({
  url: z
    .string()
    .url('Must be a valid URL')
    .max(2048, 'URL too long')
    .refine(
      (url) => {
        try {
          const parsed = new URL(url);
          return ['http:', 'https:'].includes(parsed.protocol);
        } catch {
          return false;
        }
      },
      'URL must use HTTP or HTTPS protocol'
    ),
});

export type SourceEvaluate = z.infer<typeof SourceEvaluateSchema>;

/**
 * Common error response schema
 */
export const ErrorResponseSchema = z.object({
  error: z.string(),
  code: z.string(),
  details: z.any().optional(),
});

export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;

/**
 * Success response wrapper
 */
export function createSuccessResponse<T>(data: T) {
  return {
    success: true,
    data,
  };
}

/**
 * Error response wrapper
 */
export function createErrorResponse(
  error: string,
  code: string,
  details?: any
): ErrorResponse {
  return {
    error,
    code,
    ...(details && { details }),
  };
}
