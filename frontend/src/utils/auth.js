export const getOAuthUrl = (provider) => {
  const base = import.meta.env.VITE_API_BASE_URL || '';
  return `${base}/oauth2/authorization/${provider}`;
};
