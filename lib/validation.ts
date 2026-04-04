/**
 * Validation utilities for common patterns.
 */

const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Validate if a string is a valid UUID v4.
 */
export function isValidUUID(value: unknown): value is string {
    if (typeof value !== "string") return false;
    return UUID_V4_REGEX.test(value);
}

/**
 * Assert that a value is a valid UUID, throw if not.
 */
export function assertValidUUID(value: unknown, fieldName: string = "ID"): string {
    if (!isValidUUID(value)) {
        throw new Error(`Invalid ${fieldName}: must be a valid UUID v4`);
    }
    return value;
}

/**
 * Validate if a string is a non-empty alphanumeric slug.
 */
export function isValidSlug(value: unknown): value is string {
    if (typeof value !== "string") return false;
    return /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/i.test(value);
}

/**
 * Validate if a string is a valid email.
 */
export function isValidEmail(value: unknown): value is string {
    if (typeof value !== "string") return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
}

/**
 * Sanitize a string to prevent XSS by removing HTML tags.
 * Note: React escapes by default, this is an extra layer.
 */
export function sanitizeString(value: unknown): string {
    if (typeof value !== "string") return "";
    return value
        .replace(/[<>]/g, "") // Remove angle brackets
        .trim()
        .substring(0, 10000); // Limit length
}

/**
 * Validate pagination parameters.
 */
export function validatePaginationParams(limit?: string | number, offset?: string | number) {
    let parsedLimit = 20;
    let parsedOffset = 0;

    if (limit !== undefined) {
        const num = typeof limit === "string" ? parseInt(limit, 10) : limit;
        if (isNaN(num) || num < 1 || num > 1000) {
            parsedLimit = 20;
        } else {
            parsedLimit = num;
        }
    }

    if (offset !== undefined) {
        const num = typeof offset === "string" ? parseInt(offset, 10) : offset;
        if (isNaN(num) || num < 0) {
            parsedOffset = 0;
        } else {
            parsedOffset = num;
        }
    }

    return { limit: parsedLimit, offset: parsedOffset };
}

/**
 * Validate a number is within a range.
 */
export function isNumberInRange(
    value: unknown,
    min: number,
    max: number
): value is number {
    return typeof value === "number" && value >= min && value <= max;
}
