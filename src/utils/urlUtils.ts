export const getValidUrl = (url: string): string => {
  try {
    return new URL(url).toString();
  } catch (e) {
    // If URL is invalid, remove any trailing colons and clean it up
    return url.replace(/:\/?$/, '');
  }
};