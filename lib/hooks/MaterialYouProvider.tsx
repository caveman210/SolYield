import React, { createContext, useContext, ReactNode } from 'react';
import { useMaterialYou, MaterialYouColors } from './useMaterialYou';

interface MaterialYouContextType {
  colors: MaterialYouColors;
}

const MaterialYouContext = createContext<MaterialYouContextType | undefined>(undefined);

export function MaterialYouProvider({ children }: { children: ReactNode }) {
  const colors = useMaterialYou();

  return <MaterialYouContext.Provider value={{ colors }}>{children}</MaterialYouContext.Provider>;
}

export function useMaterialYouColors(): MaterialYouColors {
  const context = useContext(MaterialYouContext);

  if (!context) {
    throw new Error('useMaterialYouColors must be used within MaterialYouProvider');
  }

  return context.colors;
}
