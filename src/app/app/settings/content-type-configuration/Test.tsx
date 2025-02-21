import {
  ContentTypesConfigDenormalised,
  denormaliseConfig,
} from "@/lib/content-types/ContentTypesConfigParser";

export const Test: React.FC<{ config: ContentTypesConfigDenormalised }> = ({
  config,
}) => {
  return <pre>{JSON.stringify(config, undefined, 2)}</pre>;
};
