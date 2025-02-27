import { SystemIconTypes } from "@/ui/Icons";

type ContentTypeFieldType = {
  type: "text";
  required: boolean;
  label: string;
};

export type ContentTypeConfig = {
  label: string;
  type: string;
  icon: SystemIconTypes;
  color: string;
  allowed_children: string[];
  abstract: boolean;
  fields: {
    [key: string]: ContentTypeFieldType;
  };
  sub_types: ContentTypeConfig[];
};
