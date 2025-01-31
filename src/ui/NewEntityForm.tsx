import { Attributes } from "@/app/app/settings/content-types/[contentTypeId]/create-subtype/Attributes";
import { getUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SystemEntityTypes } from "@/lib/SystemTypes";

import { NextLink, NextLinkBack } from "@/ui/NextLink";
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Typography,
} from "@mui/joy";
import { InputJsonValue } from "@prisma/client/runtime/library";

import { randomUUID } from "crypto";
import _ from "lodash";
import { redirect } from "next/navigation";

export const NewEntityForm = async (props: {
  content_type_id: string;
  parent_id?: string | undefined;
}) => {
  const { content_type_id, parent_id } = props;
  const parentId = parent_id === "null" ? undefined : parent_id;
  const { user } = await getUser();
  const tenant_id = { in: [user.company_id, "SYSTEM"] };

  const entityType = await prisma.entityType.findFirstOrThrow({
    where: {
      tenant_id,
      id: content_type_id,
    },
    include: {
      entity_type_columns: {
        where: {
          tenant_id,
        },
        include: {
          column: true,
        },
      },
    },
  });

  return (
    <Box m={2}>
      <form
        action={async (formData) => {
          "use server";
          const { user } = await getUser();
          const attributes = Object.fromEntries(formData.entries());
          const id = randomUUID();

          const val = await prisma.entity.create({
            data: {
              id,
              parent_id: parentId,
              tenant_id: user.company_id,
              type_id: content_type_id,
              data: {
                ...(attributes as any),
                created_by: user.user_id,
                updated_by: user.user_id,
                created_at: new Date(),
                updated_at: new Date(),
              },
            },
          });

          redirect(`/app/item/${val.parent_id || val.id}`);
        }}
      >
        <Box mb={2}>
          <Typography level="h1">New {entityType.name}</Typography>
        </Box>
        <Box mb={2}>
          <Typography level="body-md">{entityType.name}</Typography>
        </Box>
        <Box>
          <Box gap={1} display={"flex"} flexDirection={"column"}>
            {entityType.entity_type_columns.map(({ required, column }, i) => {
              return (
                <FormControl key={column.id}>
                  <FormLabel required={required === true}>
                    {column.label}
                  </FormLabel>
                  <Input
                    required={required === true}
                    autoComplete="off"
                    type={column.type}
                    name={column.id}
                    defaultValue={""}
                    autoFocus={i === 0}
                  />
                </FormControl>
              );
            })}
          </Box>
          <Box mt={2} display={"flex"} gap={1}>
            <Box flex={1}></Box>
            <NextLinkBack>
              <Button variant="outlined">Cancel</Button>
            </NextLinkBack>
            <Button type="submit">Submit</Button>
          </Box>
          {/* <Box mt={2} display={"flex"} gap={1}>
            <Typography level="body-sm">
              Need more fields?{" "}
              <NextLink
                href={`/app/settings/content-types/${content_type_id}/create-subtype`}
              > 
                Create a subtype
              </NextLink>
            </Typography>
          </Box>{" "} */}
          <Box mt={2} display={"flex"} gap={1}>
            <Typography level="body-sm">
              <NextLink
                href={`/app/item/${parent_id}/add-column/${content_type_id}`}
              >
                Add new column
              </NextLink>
            </Typography>
          </Box>
        </Box>
      </form>
    </Box>
  );
};
