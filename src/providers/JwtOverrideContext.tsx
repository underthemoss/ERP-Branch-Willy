"use client";

import React, { createContext, useContext } from "react";

/**
 * The JwtOverrideContext allows a JWT to be provided via the URL hash (e.g. #jwt=...).
 * This enables server-side page loading with the user's context, which is useful for
 * scenarios like PDF generation where authentication is required without an interactive login.
 */
export const JwtOverrideContext = createContext<string | null>(null);

export const useJwtOverride = () => useContext(JwtOverrideContext);

export const JwtOverrideProvider: React.FC<{
  children: React.ReactNode;
  jwt: string | null;
}> = ({ children, jwt }) => (
  <JwtOverrideContext.Provider value={jwt}>{children}</JwtOverrideContext.Provider>
);
