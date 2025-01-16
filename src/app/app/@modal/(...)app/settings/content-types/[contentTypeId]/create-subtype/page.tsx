import { CustomModal } from "../../../../../CustomModal";
import Child from "../../../../../../settings/content-types/[contentTypeId]/create-subtype/page";

export default async function Page(props: any) {
  return (
    <CustomModal>
      <>{<Child params={props.params} />}</>
    </CustomModal>
  );
}
