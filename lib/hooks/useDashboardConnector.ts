import { useMemo } from 'react';
import { useMaterialYouColors } from './MaterialYouProvider';

/**
 * Connector Hook: Dashboard Data & Styling
 *
 * This hook acts as a connector between backend data and UI components.
 * It provides stable references to Material You colors and computed values
 * to prevent unnecessary re-renders of presentation components.
 *
 * Architecture:
 * - Backend (Redux/API) → Connector Hook → Presentation Components
 * - Stable color references via useMemo
 * - Data transformations isolated here
 * - UI components remain pure
 */
export const useDashboardConnector = () => {
  const colors = useMaterialYouColors();

  // Memoize stat card styling - colors are stable references
  // These won't change unless the Material You theme actually changes
  const statCardStyles = useMemo(
    () => ({
      activeSites: {
        containerColor: colors.secondaryContainer,
        iconBackgroundColor: colors.secondary,
        iconColor: colors.onSecondary,
        textColor: colors.onSecondaryContainer,
      },
      performance: {
        containerColor: colors.tertiaryContainer,
        iconBackgroundColor: colors.tertiary,
        iconColor: colors.onTertiary,
        textColor: colors.onTertiaryContainer,
      },
    }),
    [
      colors.secondaryContainer,
      colors.secondary,
      colors.onSecondary,
      colors.onSecondaryContainer,
      colors.tertiaryContainer,
      colors.tertiary,
      colors.onTertiary,
      colors.onTertiaryContainer,
    ]
  );

  // Memoize hero card styling
  const heroCardStyles = useMemo(
    () => ({
      containerColor: colors.primaryContainer,
      iconBackgroundColor: colors.primary,
      iconColor: colors.onPrimary,
      textColor: colors.onPrimaryContainer,
    }),
    [colors.primaryContainer, colors.primary, colors.onPrimary, colors.onPrimaryContainer]
  );

  // Other stable color references
  const headerStyles = useMemo(
    () => ({
      backgroundColor: colors.background,
      titleColor: colors.onBackground,
      subtitleColor: colors.onSurfaceVariant,
      bellButtonBg: colors.secondaryContainer,
      bellIconColor: colors.onSecondaryContainer,
    }),
    [
      colors.background,
      colors.onBackground,
      colors.onSurfaceVariant,
      colors.secondaryContainer,
      colors.onSecondaryContainer,
    ]
  );

  const sectionStyles = useMemo(
    () => ({
      titleColor: colors.onBackground,
      linkColor: colors.primary,
      emptyIconColor: colors.onSurfaceVariant,
      emptyTextColor: colors.onSurfaceVariant,
    }),
    [colors.onBackground, colors.primary, colors.onSurfaceVariant]
  );

  const quickActionStyles = useMemo(
    () => ({
      backgroundColor: colors.surfaceContainerHigh,
      iconColor: colors.primary,
      textColor: colors.onSurface,
    }),
    [colors.surfaceContainerHigh, colors.primary, colors.onSurface]
  );

  return {
    statCardStyles,
    heroCardStyles,
    headerStyles,
    sectionStyles,
    quickActionStyles,
    colors, // Original colors object for one-off uses
  };
};

/**
 * Connector Hook: Dashboard Data
 *
 * Provides computed data values for dashboard widgets
 * Isolates business logic from UI components
 */
export const useDashboardData = () => {
  // TODO: Replace with actual data from Redux/API
  const dashboardStats = useMemo(
    () => ({
      activeSitesCount: 12,
      performancePercentage: 92,
      scheduledVisitsToday: 3,
    }),
    []
  ); // Add dependencies when connected to real data

  return {
    activeSitesCount: dashboardStats.activeSitesCount,
    performancePercentage: `${dashboardStats.performancePercentage}%`,
    scheduledVisitsToday: dashboardStats.scheduledVisitsToday,
  };
};
