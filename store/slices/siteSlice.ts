/**
 * Site Management Redux Slice
 * 
 * Manages user-created sites alongside static sites.
 * Supports CRUD operations with AsyncStorage persistence.
 */

import { createSlice, PayloadAction, createSelector } from '@reduxjs/toolkit';
import { Site } from '../../lib/types';

interface SiteState {
  userSites: Site[]; // User-created sites
  isLoading: boolean;
}

const initialState: SiteState = {
  userSites: [],
  isLoading: false,
};

const siteSlice = createSlice({
  name: 'site',
  initialState,
  reducers: {
    /**
     * Add a new user-created site
     */
    addSite: (state, action: PayloadAction<Omit<Site, 'id'>>) => {
      const newSite: Site = {
        ...action.payload,
        id: `site_user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      };
      state.userSites.push(newSite);
    },

    /**
     * Update an existing user-created site
     */
    updateSite: (state, action: PayloadAction<Site>) => {
      const index = state.userSites.findIndex((s) => s.id === action.payload.id);
      if (index !== -1) {
        state.userSites[index] = action.payload;
      }
    },

    /**
     * Delete a user-created site
     */
    deleteSite: (state, action: PayloadAction<string>) => {
      state.userSites = state.userSites.filter((s) => s.id !== action.payload);
    },

    /**
     * Load user sites from AsyncStorage
     */
    loadUserSites: (state, action: PayloadAction<Site[]>) => {
      state.userSites = action.payload;
    },

    /**
     * Clear all user-created sites
     */
    clearUserSites: (state) => {
      state.userSites = [];
    },

    /**
     * Set loading state
     */
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
  },
});

export const {
  addSite,
  updateSite,
  deleteSite,
  loadUserSites,
  clearUserSites,
  setLoading,
} = siteSlice.actions;

// Selectors
export const selectUserSites = (state: { site: SiteState }) => state.site.userSites;
export const selectIsLoading = (state: { site: SiteState }) => state.site.isLoading;

/**
 * Get a user site by ID
 */
export const selectUserSiteById = createSelector(
  [selectUserSites, (_state: { site: SiteState }, siteId: string) => siteId],
  (sites, siteId) => sites.find((s) => s.id === siteId)
);

/**
 * Get total count of user sites
 */
export const selectUserSiteCount = createSelector(
  [selectUserSites],
  (sites) => sites.length
);

export default siteSlice.reducer;
