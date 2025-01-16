import { useAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Grid,
  Input,
  Option,
  Select,
  Stack,
  Typography,
} from "@mui/joy";
import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect, RedirectType } from "next/navigation";
import { Attributes } from "./Attributes";
import { NextLinkBack } from "@/ui/NextLink";
import { EntityAttributeValueType } from "../../../../../../prisma/generated/mongo";

export default async function Page() {
  const { user } = await useAuth();
  const contentTypes = await prisma.entityType.findMany({
    where: {
      tenantId: { in: ["SYSTEM", user.company_id] },
      parentId: { not: null },
    },
  });
  return (
    <Box pt={2}>
      <form
        action={async (formData) => {
          "use server";
          const { user } = await useAuth();
          const entries = [...formData.entries()];
          const parent_content_type_id =
            formData.get("parent_content_type_id")?.toString() || "";
          const name = formData.get("name")?.toString() || "";
          const description = formData.get("description")?.toString() || "";
          const attributes = Array.from({
            length: entries.filter((e) => e[0].startsWith("attribute_name_"))
              .length,
          }).map((_, i) => {
            return {
              id: randomUUID(),
              tenantId: user.company_id,
              name: formData.get(`attribute_name_${i}`)?.toString() || "",
              type: (formData.get(`attribute_type_${i}`)?.toString() ||
                "") as EntityAttributeValueType,
            };
          });

          console.log(formData);
          console.log(attributes);
          await prisma.entityType.create({
            data: {
              id: randomUUID(),
              name: name,
              parentId: parent_content_type_id,
              tenantId: user.company_id,
              description: description,
              abstract: false,
              attributes: {
                createMany: {
                  data: attributes,
                },
              },
            },
          });

          redirect("/app/settings/content-types");
        }}
      >
        <Grid container spacing={2}>
          <Grid xs={12}>
            <Typography level="h4">New Content Type</Typography>
          </Grid>
          <Grid xs={12}>
            <FormControl>
              <FormLabel>Parent Type</FormLabel>
              <Select name="parent_content_type_id" defaultValue={""}>
                {contentTypes.map((ct) => (
                  <Option key={ct.id} value={ct.id}>
                    {ct.name}
                  </Option>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid xs={12}>
            <FormControl>
              <FormLabel>Name</FormLabel>
              <Input name="name" placeholder="Enter content type name" />
            </FormControl>
          </Grid>
          <Grid xs={12}>
            <FormControl>
              <FormLabel>Description</FormLabel>
              <Input
                name="description"
                placeholder="Enter content type description"
              />
            </FormControl>
          </Grid>
          <Grid xs={12}>
            <FormLabel>Attributes</FormLabel>
            <Attributes />
          </Grid>
          <Grid xs={12}>
            <Box display={"flex"} gap={1}>
              <Box flex={1}></Box>
              <Box>
                <NextLinkBack>
                  <Button type="submit" variant="outlined" color="primary">
                    Cancel
                  </Button>
                </NextLinkBack>
              </Box>
              <Box>
                <Button type="submit" variant="solid" color="primary">
                  Create
                </Button>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </form>
    </Box>
  );
}
