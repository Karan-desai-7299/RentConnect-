export const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const formatMoney = (value) => {
  const amount = toNumber(value, 0);
  return amount.toLocaleString("en-IN");
};

export const formatCity = (value, fallback = "Unknown") => {
  const city = String(value || "").trim();
  if (!city) return fallback;
  return city.replace(/\b\w/g, (char) => char.toUpperCase());
};

export const formatLowerCity = (value, fallback = "") => {
  const city = String(value || "").trim().toLowerCase();
  return city || fallback;
};
