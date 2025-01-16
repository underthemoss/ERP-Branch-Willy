import { CustomModal } from "../../../CustomModal";
import Child from "../../../../settings/content-types/new-content-type/page";

export default async function Page(...props: any) {
  return (
    <CustomModal>
      <>{<Child {...props} />}</>
    </CustomModal>
  );
}
