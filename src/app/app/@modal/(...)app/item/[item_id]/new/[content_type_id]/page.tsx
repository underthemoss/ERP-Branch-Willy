import { CustomModal } from "../../../../../CustomModal";
import Child from "../../../../../../item/[item_id]/new/[content_type_id]/page";

export default async function Page(props: any) {
  return (
    <CustomModal>
      <>{<Child params={props.params} />}</>
    </CustomModal>
  );
}
