// import { getUser } from "@/lib/auth";
// import _ from "lodash";
// import { prisma } from "@/lib/prisma";
// import {
//   Box,
//   Button,
//   Checkbox,
//   FormControl,
//   FormLabel,
//   Grid,
//   Input,
//   Option,
//   Select,
//   Stack,
//   Typography,
// } from "@mui/joy";
// import { randomUUID } from "crypto";
// import { revalidatePath } from "next/cache";
// import { redirect } from "next/navigation";
// import { Attributes } from "./Attributes";
// import { NextLinkBack } from "@/ui/NextLink";
// import { EntityAttributeValueType } from "../../../../../../../prisma/generated/mongo";

export default async function Page(props: {
  params: Promise<{ contentTypeId: string }>;
}) {
  return null;
  // const { contentTypeId } = await props.params;
  // const attributes = await prisma.entityType.getAllAttributes([contentTypeId]);

  // const { user } = await getUser();
  // const baseType = await prisma.entityType.findFirstOrThrow({
  //   where: { tenantId: { in: ["SYSTEM", user.company_id] }, id: contentTypeId },
  //   select: {
  //     name: true,
  //     validChildEntityTypeIds: true,
  //   },
  // });

  // const validContents = await prisma.entityType.findMany({
  //   where: { id: { in: baseType.validChildEntityTypeIds } },
  // });

  // // await prisma.entityType.getChildEntityTypes(validContents);

  // return (
  //   <Box pt={2}>
  //     <form
  //       action={async (formData) => {
  //         "use server";
  //         const { user } = await getUser();
  //         const entries = [...formData.entries()];

  //         const name = formData.get("name")?.toString() || "";
  //         const description = formData.get("description")?.toString() || "";
  //         const contentTypeId =
  //           formData.get("parentContentTypeId")?.toString() || "";

  //         const { attributes } = entries
  //           .filter(([key]) => key.startsWith("attributes"))
  //           .reduce((acc, [key, value]) => {
  //             _.set(acc, key, value);
  //             return acc;
  //           }, {} as { attributes?: { name: string; type: string; isRequired: string }[] });

  //         const parent = await prisma.entityType.findFirstOrThrow({
  //           where: { id: contentTypeId },
  //           select: {
  //             icon: true,
  //           },
  //         });
  //         const data =
  //           attributes?.map((attr) => {
  //             return {
  //               id: randomUUID(),
  //               tenantId: user.company_id,
  //               isRequired: attr.isRequired === "on",
  //               label: attr.name.trim(),
  //               type: attr.type as EntityAttributeValueType,
  //             };
  //           }) || [];
  //         await prisma.entityTypeColumn.createMany({
  //           data,
  //         });

  //         const result = await prisma.entityType.create({
  //           data: {
  //             id: `${contentTypeId}_${randomUUID()}`,
  //             name: name,
  //             parentId: contentTypeId,
  //             icon: parent.icon || "document",
  //             tenantId: user.company_id,
  //             description: description,
  //             abstract: false,
  //             columnIds: data.map((d) => d.id),
  //             hidden: false,
  //           },
  //         });

  //         redirect(`/app/settings/content-types/${result.id}`);
  //       }}
  //     >
  //       <Grid container spacing={2}>
  //         <Grid xs={12}>
  //           <Typography level="h4">Create {baseType.name} Subtype</Typography>
  //         </Grid>

  //         <Grid xs={12}>
  //           <input
  //             type="hidden"
  //             name="parentContentTypeId"
  //             value={contentTypeId}
  //           />
  //           <FormControl>
  //             <FormLabel>Name</FormLabel>
  //             <Input
  //               required
  //               autoComplete="off"
  //               name="name"
  //               placeholder="Enter content type name"
  //             />
  //           </FormControl>
  //         </Grid>
  //         <Grid xs={12}>
  //           <FormControl>
  //             <FormLabel>Description</FormLabel>
  //             <Input
  //               required
  //               autoComplete="off"
  //               name="description"
  //               placeholder="Enter content type description"
  //             />
  //           </FormControl>
  //         </Grid>
  //         <Grid xs={12}>
  //           <FormLabel>Attributes</FormLabel>
  //           <Attributes inheritedAttributes={attributes} />
  //         </Grid>
  //         <Grid xs={12}>
  //           <Box display={"flex"} gap={1}>
  //             <Box flex={1}></Box>
  //             <Box>
  //               <NextLinkBack>
  //                 <Button type="submit" variant="outlined" color="primary">
  //                   Cancel
  //                 </Button>
  //               </NextLinkBack>
  //             </Box>
  //             <Box>
  //               <Button type="submit" variant="solid" color="primary">
  //                 Create
  //               </Button>
  //             </Box>
  //           </Box>
  //         </Grid>
  //       </Grid>
  //     </form>
  //   </Box>
  // );
}
