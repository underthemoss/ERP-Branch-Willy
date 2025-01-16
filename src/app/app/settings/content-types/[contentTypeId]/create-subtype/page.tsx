import { useAuth } from "@/lib/auth";
import _ from "lodash";
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
import { EntityAttributeValueType } from "../../../../../../../prisma/generated/mongo";

export default async function Page(props: {
  params: Promise<{ contentTypeId: string }>;
}) {
  const { contentTypeId } = await props.params;
  const attributes = await prisma.entityType.getAllAttributes(contentTypeId);

  return (
    <Box pt={2}>
      <form
        action={async (formData) => {
          "use server";
          const { user } = await useAuth();
          const entries = [...formData.entries()];

          const name = formData.get("name")?.toString() || "";
          const description = formData.get("description")?.toString() || "";
          const contentTypeId =
            formData.get("parentContentTypeId")?.toString() || "";

          const { attributes } = entries
            .filter(([key]) => key.startsWith("attributes"))
            .reduce((acc, [key, value]) => {
              _.set(acc, key, value);
              return acc;
            }, {} as { attributes: { name: string; type: string; isRequired: string }[] });

          console.log(formData);
          console.log(attributes);
          await prisma.entityType.create({
            data: {
              id: randomUUID(),
              name: name,
              parentId: contentTypeId,
              tenantId: user.company_id,
              description: description,
              abstract: false,
              ...(attributes.length > 0
                ? {
                    attributes: {
                      createMany: {
                        data: attributes.map((attr) => ({
                          id: randomUUID(),
                          isRequired: attr.isRequired === "on",
                          name: attr.name.trim(),
                          tenantId: user.company_id,
                          type: attr.type as EntityAttributeValueType,
                        })),
                      },
                    },
                  }
                : undefined),
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
            <input
              type="hidden"
              name="parentContentTypeId"
              value={contentTypeId}
            />
            <FormControl>
              <FormLabel>Name</FormLabel>
              <Input
                required
                autoComplete="off"
                name="name"
                placeholder="Enter content type name"
              />
            </FormControl>
          </Grid>
          <Grid xs={12}>
            <FormControl>
              <FormLabel>Description</FormLabel>
              <Input
                required
                autoComplete="off"
                name="description"
                placeholder="Enter content type description"
              />
            </FormControl>
          </Grid>
          <Grid xs={12}>
            <FormLabel>Attributes</FormLabel>
            <Attributes inheritedAttributes={attributes} />
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
