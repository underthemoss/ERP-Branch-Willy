import {
  Box,
  Button,
  Checkbox,
  Input,
  Option,
  Select,
  Table,
  Typography,
} from "@mui/joy";

import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";
import { getUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ColumnType } from "../../../../../../prisma/generated/mongo";
import { ColumnForm } from "./form";
import { NextLink, NextLinkBack } from "@/ui/NextLink";
import { SystemEntityTypes } from "@/lib/SystemTypes";
import {
  ContentTypeData,
  GlobalContentTypeId,
} from "@/config/ContentTypesConfig";

export default async function Page(props: {
  params: Promise<{ item_id: string; content_type_id: string }>;
}) {
  const { item_id } = await props.params;
  return (
    <form
      action={async (formData) => {
        "use server";
        const { name, type, lookup } = Object.fromEntries(formData.entries());
        const { user } = await getUser();
        const columnId = randomUUID();
        await prisma.column.create({
          data: {
            id: columnId,
            label: name.toString(),
            tenant_id: user.company_id,
            type: type.toString() as ColumnType,
            data: {
              lookup: lookup?.toString(),
            },
          },
        });
        await prisma.entity.create({
          data: {
            data: {
              parent_column_config__column_id: columnId,
              parent_column_config__column_width: 300,
              name: name.toString(),
            } satisfies ContentTypeData<"parent_column_config">,
            tenant_id: user.company_id,
            parent_id: item_id,
            hidden: true,
            type_id: "parent_column_config" satisfies GlobalContentTypeId,
          },
        });
        redirect(`/app/item/${item_id}`);
      }}
    >
      <Box>
        <Box>
          <Typography level="h1">Add column</Typography>
        </Box>
        <Box mt={2}>
          <ColumnForm />
        </Box>
        <Box display={"flex"} gap={1}>
          <Box flex={1}></Box>
          <NextLinkBack>
            <Button variant="outlined">Cancel</Button>
          </NextLinkBack>
          <Button type="submit">Submit</Button>
        </Box>
      </Box>
    </form>
  );
}
