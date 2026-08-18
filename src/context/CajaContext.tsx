"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

export interface CajaNavigationState {
  estudianteId: string | null;
  facturaId: string | null;
  grado: string | null;
  mes: string | null;
  anio: string | null;
}

interface CajaContextType {
  navState: CajaNavigationState;
  setNavState: (state: CajaNavigationState) => void;
  clearNavState: () => void;
}

const defaultState: CajaNavigationState = {
  estudianteId: null,
  facturaId: null,
  grado: null,
  mes: null,
  anio: null,
};

const CajaContext = createContext<CajaContextType>({
  navState: defaultState,
  setNavState: () => {},
  clearNavState: () => {},
});

export const CajaProvider = ({ children }: { children: ReactNode }) => {
  const [navState, setNavState] = useState<CajaNavigationState>(defaultState);

  const clearNavState = () => setNavState(defaultState);

  return (
    <CajaContext.Provider value={{ navState, setNavState, clearNavState }}>
      {children}
    </CajaContext.Provider>
  );
};

export const useCajaContext = () => useContext(CajaContext);
