import { PreferencesContainer } from "../lib/db.config";

/**
 * Fetch user preferences safely.
 * Always returns null if not found or on error.
 */
export const getUserPreferences = async (userId: string) => {
  try {
    const { resource } = await PreferencesContainer
      .item(userId, userId)
      .read();

    if (!resource) {
      console.warn(`[Preferences] No preferences found for userId=${userId}`);
      return null;
    }

    return resource;
  } catch (error) {
    console.error(
      `[Preferences] Failed to fetch preferences for userId=${userId}`,
      error
    );
    return null;
  }
};
