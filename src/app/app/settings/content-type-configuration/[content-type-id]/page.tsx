import React from "react";
import CreateContentTypeForm from "../form/Form";

const Page: React.FC<{
  params: Promise<{ "content-type-id": string }>;
}> = async ({ params }) => {
  return <CreateContentTypeForm id={(await params)["content-type-id"]} />;
};

export default Page;
