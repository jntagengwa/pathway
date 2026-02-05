/**
 * Centralized utilities for safely displaying user names.
 * 
 * Rules:
 * - Prefer displayName if it exists and is NOT an email
 * - Fall back to name if displayName is missing or is an email
 * - Only use email as last resort if name is null/empty
 * - Never show raw email as the "display name" - use a generic label instead
 */

/**
 * Check if a string looks like an email address.
 */
export function isEmail(value: string | null | undefined): boolean {
  if (!value || typeof value !== "string") return false;
  // Simple email regex - matches most common email patterns
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(value.trim());
}

/**
 * Get a safe display name for a user, avoiding email addresses as display names.
 * 
 * @param user - User object with optional displayName, name, and email fields
 * @returns A safe display name (never an email unless no other option)
 */
export function getSafeDisplayName(user: {
  displayName?: string | null;
  name?: string | null;
  email?: string | null;
}): string {
  const displayName = user.displayName?.trim();
  const name = user.name?.trim();
  const email = user.email?.trim();

  // 1. Prefer displayName if it exists and is NOT an email
  if (displayName && !isEmail(displayName)) {
    return displayName;
  }

  // 2. Fall back to name if it exists and is not empty
  if (name && name.length > 0) {
    return name;
  }

  // 3. If we have an email but no good name, use local-part (e.g. "john" from "john@example.com")
  if (email) {
    const localPart = email.split("@")[0]?.trim();
    if (localPart && localPart.length > 0) {
      return localPart;
    }
  }

  // 4. Ultimate fallback
  return "User";
}

/**
 * Get initials from a display name (for avatars, etc.)
 */
export function getInitials(displayName: string): string {
  const parts = displayName.trim().split(/\s+/);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0]!.charAt(0).toUpperCase();
  return (parts[0]!.charAt(0) + parts[parts.length - 1]!.charAt(0)).toUpperCase();
}

