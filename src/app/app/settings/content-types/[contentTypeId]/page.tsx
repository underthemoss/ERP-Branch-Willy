import React from "react";
import CreateContentTypeForm from "../form/Form";
import { getUser } from "@/lib/auth";

import { getContentTypes } from "@/services/ContentTypeRepository";

const Page: React.FC<{ params: Promise<{ contentTypeId: string }> }> = async ({
  params,
}) => {
  const contentTypes = await getContentTypes();

  return (
    <CreateContentTypeForm
      contentTypes={contentTypes}
      id={(await params).contentTypeId}
    />
  );
};

export default Page;
