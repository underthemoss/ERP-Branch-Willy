import React from "react";
import CreateContentTypeForm from "../form/Form";
import { getUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getContentTypes } from "@/services/ContentTypeRepository";

const CreateContentTypePage: React.FC = async ({}) => {
  const contentTypes = await getContentTypes();
  return <CreateContentTypeForm contentTypes={contentTypes} />;
};

export default CreateContentTypePage;
