"use client";

import { useContext, useState } from "react";
import { ContentTypesConfigProviderContext } from "./ContentTypesConfigProvider";
import { denormaliseConfig } from "./ContentTypesConfigParser";
import { ContentTypesConfig } from "../../../prisma/generated/mongo";
import { saveContentTypeConfig } from "@/services/ContentTypeRepository";

export const useContentTypes = () => {
  const { contentTypesConfig } = useContext(ContentTypesConfigProviderContext);
  const [rawConfig, setRawConfig] = useState(contentTypesConfig);

  return {
    config: denormaliseConfig(rawConfig),
    rawConfig: rawConfig,
    saveConfig: async (config: ContentTypesConfig) => {
      setRawConfig(config);
      const updated = await saveContentTypeConfig(config.types);
      setRawConfig(updated);
    },
  };
};
