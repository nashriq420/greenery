export const getBaseUrl = () => {
  const url = process.env.NEXT_PUBLIC_API_URL;
  if (url === "/api") return "http://localhost:4000";
  return url || "http://localhost:4000";
};

export const getApiUrl = () => {
  return process.env.NEXT_PUBLIC_API_URL || "/api";
};
