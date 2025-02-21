import { CustomModal } from "../../../../../CustomModal";
import Child from "../../../../../../settings/content-type-configuration/page";

export default async function Page(props: any) {
  return (
    <CustomModal>
      <>{<Child params={props.params} />}</>
    </CustomModal>
  );
}
