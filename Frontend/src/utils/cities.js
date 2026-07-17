export const CITY_OPTIONS = [
  "Pune",
  "Mumbai",
  "Bangalore",
  "Kolkata",
  "Delhi",
  "Hyderabad",
];

export const normalizeCity = (value) => {
  if (!value) return "";
  return String(value).trim().toLowerCase();
};

export const formatCityLabel = (value) => {
  if (!value) return CITY_OPTIONS[0];
  return String(value)
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
};
