import { CustomModal } from "../../../../CustomModal";
import Child from "../../../../../item/[item_id]/add-column/page";

export default async function Page(props: any) {
  return (
    <CustomModal>
      <>{<Child params={props.params} />}</>
    </CustomModal>
  );
}
