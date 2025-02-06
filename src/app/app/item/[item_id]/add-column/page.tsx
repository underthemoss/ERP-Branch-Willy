import { Box, Button, Typography } from "@mui/joy";
import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";
import { getUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ColumnType } from "../../../../../../prisma/generated/mongo";
import { ColumnForm } from "./form";
import { NextLinkBack } from "@/ui/NextLink";
import ColumnTypes from "./ColumnTypeSelector";

export default async function Page(props: {
  params: Promise<{ item_id: string; content_type_id: string }>;
}) {
  const { item_id } = await props.params;
  return (
    <form
      action={async (formData) => {
        "use server";
        const { name, type, lookup, ...rest } = Object.fromEntries(
          formData.entries()
        );
        const display_column_ids = Object.keys(rest)
          .filter((o) => o.startsWith("lookup-display-col-"))
          .map((o) => o.replace("lookup-display-col-", ""));

        const { user } = await getUser();
        const columnId = randomUUID();
        await prisma.entity.update({
          where: { id: item_id, tenant_id: user.company_id },
          data: {
            column_config: {
              push: {
                hidden: false,
                key: columnId,
                label: name.toString(),
                readonly: false,
                type: type as ColumnType,
                lookup: lookup?.toString()
                  ? {
                      id: lookup.toString(),
                      display_column_ids: display_column_ids,
                    }
                  : null,
              },
            },
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
      </Box>
    </form>
  );
}
