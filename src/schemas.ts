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
  title: z.string().optional(),
  warnings: z
    .array(z.string())
    .nullable()
    .optional()
    .transform((v) => v ?? []),
})

export type ChatResponseParsed = z.infer<typeof chatResponseSchema>

// ============================================================================
// Save Response Validation
// ============================================================================

export const saveResponseSchema = z.object({
  id: z.string().min(1),
  name: z.string().optional(),
  updatedAt: z.string().optional(),
})

export type SaveResponseParsed = z.infer<typeof saveResponseSchema>

// ============================================================================
// Load Response Validation
// ============================================================================

export const loadResponseSchema = z.object({
  id: z.string().min(1),
  name: z.string().optional(),
  html: z.string().min(1),
  messages: z
    .array(
      z.object({
        role: messageRoleSchema,
        content: z.string(),
        ts: z.number(),
      })
    )
    .optional(),
  apiSpec: z.string().optional(),
  updatedAt: z.string().optional(),
})

export type LoadResponseParsed = z.infer<typeof loadResponseSchema>

// ============================================================================
// List Response Validation
// ============================================================================

export const listResponseSchema = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      name: z.string().optional(),
      updatedAt: z.string().optional(),
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
