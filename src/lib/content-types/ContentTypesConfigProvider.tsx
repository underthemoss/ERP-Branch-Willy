"use client";

import { ContentTypesConfig } from "../../../prisma/generated/mongo";
import { createContext } from "react";

export const ContentTypesConfigProviderContext = createContext<{
  contentTypesConfig: ContentTypesConfig;
}>({
  contentTypesConfig: {} as ContentTypesConfig,
});

export const ContentTypesConfigProvider: React.FC<{
  children: React.ReactNode;
  contentTypesConfig: ContentTypesConfig;
}> = ({ children, contentTypesConfig }) => {
  return (
    <ContentTypesConfigProviderContext.Provider value={{ contentTypesConfig }}>
      {children}
    </ContentTypesConfigProviderContext.Provider>
  );
};
