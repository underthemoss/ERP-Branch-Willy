import _ from "lodash";
import { CustomAutoForm } from "./CustomAutoForm";
import { createEntity } from "@/db/mongoose";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export const NewEntityForm = (props: {
  content_type_id: string;
  parent_id?: string | undefined;
}) => {
  const { content_type_id, parent_id } = props;
  const parentId = parent_id === "null" ? undefined : parent_id;
  return null;
  // return (
  //   <CustomAutoForm
  //     type_id={content_type_id}
  //     onSubmitAction={async (model) => {
  //       "use server";
  //       const { _id } = await createEntity({
  //         type: content_type_id,
  //         parent_id: parentId || "",
  //         data: model,
  //       });
  //       revalidatePath("/", "page");
  //       redirect(`/app/item/${parentId || _id}`);
  //     }}
  //   />
  // );
};
