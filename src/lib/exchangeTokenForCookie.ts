/**
 * Exchanges a Bearer token for an HTTP-only cookie by calling the backend endpoint
 * @param token - The JWT access token to exchange
 * @param setCookieUrl - The set-cookie endpoint URL
 * @returns Promise that resolves when the cookie is set successfully
 */
export async function exchangeTokenForCookie(token: string, setCookieUrl: string): Promise<void> {
  try {
    const response = await fetch(setCookieUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      credentials: "include", // Important: ensures cookies are set
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `Failed to set cookie: ${response.status} ${response.statusText} ${JSON.stringify(errorData)}`,
      );
    }

    // Backend returns 204 No Content on success (no body to parse)
    // No need to check response body - response.ok already validates success
  } catch (error) {
    console.error("Error exchanging token for cookie:", error);
    // Don't throw - we want to continue even if cookie exchange fails
    // The app can still work with Bearer tokens in headers
  }
}
