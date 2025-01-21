import { Attributes } from "@/app/app/settings/content-types/[contentTypeId]/create-subtype/Attributes";
import { useAuth } from "@/lib/auth";
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
import {
  EntityAttributeValueType,
  EntityTypeColumn,
} from "../../prisma/generated/mongo";

export const NewEntityForm = async (props: {
  content_type_id: string;
  parent_id?: string | undefined;
}) => {
  const { content_type_id, parent_id } = props;
  const parentId = parent_id === "null" ? undefined : parent_id;
  const { user } = await useAuth();

  const entityType = await prisma.entityType.findFirstOrThrow({
    where: {
      tenantId: { in: [user.company_id, "SYSTEM"] },
      id: content_type_id,
    },
  });

  const attributes = await prisma.entityType.getAllAttributes([
    content_type_id,
  ]);

  return (
    <Box m={2}>
      <form
        action={async (formData) => {
          "use server";
          const { user } = await useAuth();
          const attributes = Object.fromEntries(formData.entries());
          const id = randomUUID();
          if (
            content_type_id.startsWith(
              "system_reference" satisfies SystemEntityTypes
            )
          ) {
            const ref_id = attributes.reference_id.toString().trim();
            const val = await prisma.entity.create({
              data: {
                id,
                metadata: {
                  created_by: user.user_id,
                  updated_by: user.user_id,
                  created_at: new Date(),
                  updated_at: new Date(),
                },
                ref_to_id: ref_id,
                parentId: parentId,
                tenantId: user.company_id,
                entityTypeId: content_type_id,
                attributes: {},
              },
            });

            redirect(`/app/item/${val.parentId || val.id}`);
          }
          if (
            content_type_id.startsWith(
              "system_list" satisfies SystemEntityTypes
            )
          ) {
            const newListTypeId = content_type_id + "_" + randomUUID();
            const newListItemTypeId =
              ("system_item" satisfies SystemEntityTypes) + "_" + randomUUID();
            const newListType = await prisma.entityType.create({
              data: {
                abstract: true,
                hidden: true,
                icon: "list",
                id: newListTypeId,
                name: attributes.name.toString(),
                tenantId: user.company_id,
                validChildEntityTypeIds: [newListItemTypeId],
                parentId: content_type_id,
              },
            });
            await prisma.entityType.create({
              data: {
                abstract: false,
                hidden: true,
                icon: "list_item",
                id: newListItemTypeId,
                name: "Record",
                tenantId: user.company_id,
                validChildEntityTypeIds: [],
                parentId: newListType.id,
                columnIds: ["name"],
              },
            });
            const val = await prisma.entity.create({
              data: {
                id,
                metadata: {
                  created_by: user.user_id,
                  updated_by: user.user_id,
                  created_at: new Date(),
                  updated_at: new Date(),
                },
                parentId: parentId,
                tenantId: user.company_id,
                entityTypeId: newListType.id,
                attributes: attributes as InputJsonValue,
              },
            });

            redirect(`/app/item/${val.parentId || val.id}`);
          } else {
            const val = await prisma.entity.create({
              data: {
                id,
                metadata: {
                  created_by: user.user_id,
                  updated_by: user.user_id,
                  created_at: new Date(),
                  updated_at: new Date(),
                },
                parentId: parentId,
                tenantId: user.company_id,
                entityTypeId: content_type_id,
                attributes: attributes as InputJsonValue,
              },
            });

            redirect(`/app/item/${val.parentId || val.id}`);
          }
        }}
      >
        <Box mb={2}>
          <Typography level="h1">New {entityType.name}</Typography>
        </Box>
        <Box mb={2}>
          <Typography level="body-md">{entityType.description}</Typography>
        </Box>
        <Box>
          <Box gap={1} display={"flex"} flexDirection={"column"}>
            {attributes.map((attr, i) => {
              return (
                <FormControl key={attr.id}>
                  <FormLabel required={attr.isRequired}>{attr.label}</FormLabel>
                  <Input
                    required={attr.isRequired}
                    autoComplete="off"
                    type={attr.type}
                    name={attr.id}
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
