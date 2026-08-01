export const chartColors = {
  primary: "#6b78e6",
  success: "#2fb85e",
  warning: "#e0a83c",
  danger: "#e5484d",
  muted: "#6b7480",
  grid: "#262b33",
  tooltipBg: "#1b2026",
  tooltipBorder: "#343b46",
};

export const rsvpChartPalette: Record<string, string> = {
  accepted: chartColors.success,
  declined: chartColors.danger,
  pending: chartColors.warning,
  maybe: chartColors.primary,
};
