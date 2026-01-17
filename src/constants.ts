/**
 * BYOF Constants
 *
 * Centralized location for all magic numbers and configuration defaults.
 */

/** Timeout values in milliseconds */
export const TIMEOUTS = {
  /** Chat request timeout (5 minutes) - allows for complex UI generation */
  CHAT_REQUEST_MS: 300_000,
  /** Save/Load request timeout (30 seconds) */
  SAVE_REQUEST_MS: 30_000,
} as const
