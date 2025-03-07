"use client";

import { UIConfig } from "@/types/UIModelConfig";
import { useState } from "react";
import { AutoForm } from "uniforms-mui";

export const CustomAutoForm: React.FC<{
  type_id: string;
  onSubmitAction: (model: any) => Promise<void>;
}> = ({ type_id, onSubmitAction }) => {
  const [loading, setLoading] = useState(false);
  return null;
  // const s = UIConfig[type_id] as (typeof UIConfig)[string];
  // return (
  //   <AutoForm
  //     schema={ContentTypeForms[type_id]}
  //     disabled={loading}
  //     onSubmit={async (model) => {
  //       setLoading(true);
  //       await onSubmitAction(model);
  //       setLoading(false);
  //     }}
  //     showInlineError={true}
  //   >
  //     {/* <AutoFields /> */}
  //   </AutoForm>
  // );
};
