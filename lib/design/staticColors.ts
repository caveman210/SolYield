/**
 * Static Widget Color Palette
 *
 * These colors are COMPLETELY STATIC and never change.
 * They provide a consistent, accessible color scheme for dashboard widgets
 * that won't flicker or re-render when other state changes.
 *
 * Design Philosophy:
 * - Pastel colors for easy viewing
 * - High contrast between container and text for accessibility
 * - Harmonious color palette that works in both light and dark modes
 * - Never affected by Material You theme changes
 */

export const WIDGET_COLORS = {
  // Active Sites Widget - Soft Green (Renewable Energy)
  activeSites: {
    container: '#E8F5E9', // Light pastel green
    iconBackground: '#66BB6A', // Medium green
    iconColor: '#FFFFFF', // White icon
    textColor: '#2E7D32', // Dark green text
  },

  // Performance Widget - Soft Orange (Energy/Power)
  performance: {
    container: '#FFF3E0', // Light pastel orange
    iconBackground: '#FFA726', // Medium orange
    iconColor: '#FFFFFF', // White icon
    textColor: '#E65100', // Dark orange text
  },

  // Hero Card - Soft Blue (Trust/Reliability)
  hero: {
    container: '#E3F2FD', // Light pastel blue
    iconBackground: '#42A5F5', // Medium blue
    iconColor: '#FFFFFF', // White icon
    textColor: '#1565C0', // Dark blue text
  },
} as const;

/**
 * Static PDF Color Palette
 *
 * Accessible pastel colors optimized for PDF printing and viewing
 * These colors ensure:
 * - Good contrast on white paper
 * - Easy on eyes for extended reading
 * - Professional appearance
 * - Printer-friendly (not too dark/saturated)
 */
export const PDF_COLORS = {
  // Performance Status Colors
  overPerforming: {
    container: '#E8F5E9', // Light green
    text: '#2E7D32', // Dark green
    icon: '#66BB6A', // Medium green
  },

  normal: {
    container: '#E3F2FD', // Light blue
    text: '#1565C0', // Dark blue
    icon: '#42A5F5', // Medium blue
  },

  underPerforming: {
    container: '#FFF3E0', // Light orange
    text: '#E65100', // Dark orange
    icon: '#FFA726', // Medium orange
  },

  zeroEnergy: {
    container: '#FFEBEE', // Light red
    text: '#C62828', // Dark red
    icon: '#EF5350', // Medium red
  },

  noData: {
    container: '#F5F5F5', // Light grey
    text: '#616161', // Dark grey
    icon: '#9E9E9E', // Medium grey
  },

  // Document Structure Colors
  header: {
    background: '#1565C0', // Professional blue
    text: '#FFFFFF', // White text
  },

  section: {
    background: '#F5F5F5', // Light grey background
    text: '#212121', // Dark text
    border: '#E0E0E0', // Light grey border
  },

  chart: {
    primary: '#42A5F5', // Blue for bars/lines
    secondary: '#66BB6A', // Green for comparison
    tertiary: '#FFA726', // Orange for highlights
    grid: '#E0E0E0', // Grey for grid lines
  },
} as const;

/**
 * Helper function to ensure color object immutability
 * TypeScript will enforce these colors never change
 */
export type WidgetColorScheme = typeof WIDGET_COLORS;
export type PDFColorScheme = typeof PDF_COLORS;
