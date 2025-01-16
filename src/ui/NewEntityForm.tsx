import { useAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SystemEntityTypes } from "@/lib/SystemTypes";
import { NextLinkBack } from "@/ui/NextLink";
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
import { redirect } from "next/navigation";
import { EntityAttributeValueType } from "../../prisma/generated/mongo";

const traverseUp = async (
  id: string | null
): Promise<
  {
    name: string;
    id: string;
    entityTypeId: string;
    tenantId: string;
    type: EntityAttributeValueType;
  }[]
> => {
  const { user } = await useAuth();
  if (!id) return [];
  const entityType = await prisma.entityType.findFirstOrThrow({
    where: {
      id,
      tenantId: { in: ["SYSTEM", user.company_id] },
    },
    include: {
      attributes: true,
    },
  });
  return [...(await traverseUp(entityType.parentId)), ...entityType.attributes];
};

export const NewEntityForm = async (props: {
  content_type_id: string;
  parent_id?: string | undefined;
}) => {
  const { content_type_id, parent_id } = props;
  const parentId = parent_id === "null" ? undefined : parent_id;
  const { user } = await useAuth();

  const entityType = await prisma.entityType.findFirstOrThrow({
    where: {
      id: content_type_id,
      tenantId: { in: ["SYSTEM", user.company_id] },
    },
    include: {
      attributes: true,
    },
  });

  const attributes = await prisma.entityType.getAllAttributes(content_type_id);

  return (
    <Box m={2}>
      <form
        action={async (formData) => {
          "use server";
          const { user } = await useAuth();
          const attributes = Object.fromEntries(formData.entries());
          const id = randomUUID();
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
              entityTypeId: entityType.id,
              attributes: attributes as InputJsonValue,
            },
          });
          redirect(`/app/item/${val.parentId || val.id}`);
        }}
      >
        <Box mb={2}>
          <Typography level="h1">New {entityType.name}</Typography>
        </Box>
        <Box mb={2}>
          <Typography level="body-md">{entityType.description}</Typography>
        </Box>
        <Box width={500}>
          <Box gap={1} display={"flex"} flexDirection={"column"}>
            {attributes.map((attr, i) => {
              return (
                <FormControl key={attr.id}>
                  <FormLabel required={attr.isRequired}>{attr.name}</FormLabel>
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
        </Box>
      </form>
    </Box>
  );
};
