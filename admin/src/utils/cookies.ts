/**
 * Retrieves the value of a specified cookie.
 */
export const getCookieValue = (name: string): string | null => {
  if (typeof document === 'undefined') return null;
  const cookieArray = document.cookie.split(';');
  for (const cookie of cookieArray) {
    const [key, value] = cookie.split('=').map((item) => item.trim());
    if (key === name) {
      return decodeURIComponent(value);
    }
  }
  return null;
};

/**
 * Sets a cookie.
 */
export const setCookie = (name: string, value: string, days?: number): void => {
  if (typeof document === 'undefined') return;
  let expires = '';
  if (days) {
    const date = new Date();
    date.setTime(date.getTime() + days * 864e5);
    expires = `; Expires=${date.toUTCString()}`;
  }
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/${expires}`;
};

/**
 * Deletes a cookie.
 */
export const deleteCookie = (name: string): void => {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;`;
};
