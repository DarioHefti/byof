import { z } from 'zod'

// ============================================================================
// Shared Schemas
// ============================================================================

/** Valid message roles */
export const messageRoleSchema = z.enum(['user', 'assistant', 'system'])

export type MessageRole = z.infer<typeof messageRoleSchema>

// ============================================================================
// Chat Response Validation
// ============================================================================

export const chatResponseSchema = z.object({
  html: z.string().min(1),
  // Use .nullish() to accept undefined (field absent) or null (JSON standard)
  title: z.string().nullish(),
  // Optional message from AI with explanations, suggestions, or clarifications
  message: z.string().nullish(),
  // Normalize null/undefined warnings to empty array for backend flexibility
  // (.nullable() for null, .optional() for undefined, client normalizes to [])
  warnings: z.array(z.string()).nullable().optional(),
})

export type ChatResponseParsed = z.infer<typeof chatResponseSchema>

// ============================================================================
// Default HTML Response Validation
// ============================================================================

export const defaultHtmlResponseSchema = z.object({
  html: z.string().min(1),
  // Use .nullish() to accept undefined (field absent) or null (JSON standard)
  title: z.string().nullish(),
})

export type DefaultHtmlResponseParsed = z.infer<typeof defaultHtmlResponseSchema>

// ============================================================================
// Save Response Validation
// ============================================================================

export const saveResponseSchema = z.object({
  id: z.string().min(1),
  // Use .nullish() to accept undefined (field absent) or null (JSON standard)
  name: z.string().nullish(),
  updatedAt: z.string().nullish(),
})

export type SaveResponseParsed = z.infer<typeof saveResponseSchema>

// ============================================================================
// Load Response Validation
// ============================================================================

export const loadResponseSchema = z.object({
  id: z.string().min(1),
  // Use .nullish() to accept undefined (field absent) or null (JSON standard)
  name: z.string().nullish(),
  html: z.string().min(1),
  messages: z
    .array(
      z.object({
        role: messageRoleSchema,
        content: z.string(),
        ts: z.number(),
      })
    )
    .nullish(),
  apiSpec: z.string().nullish(),
  updatedAt: z.string().nullish(),
})

export type LoadResponseParsed = z.infer<typeof loadResponseSchema>

// ============================================================================
// List Response Validation
// ============================================================================

export const listResponseSchema = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      // Use .nullish() to accept undefined (field absent) or null (JSON standard)
      name: z.string().nullish(),
      updatedAt: z.string().nullish(),
    })
  ),
})

export type ListResponseParsed = z.infer<typeof listResponseSchema>

// ============================================================================
// OpenAPI Spec Validation (minimal)
// ============================================================================

export const openApiSpecSchema = z
  .object({
    openapi: z.string().optional(),
    swagger: z.string().optional(),
    paths: z.record(z.unknown()),
  })
  .refine((data) => data.openapi !== undefined || data.swagger !== undefined, {
    message: 'API spec must have "openapi" or "swagger" version field',
  })

export type OpenApiSpecParsed = z.infer<typeof openApiSpecSchema>
