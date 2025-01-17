import * as React from "react";
import Dropdown from "@mui/joy/Dropdown";
import Menu from "@mui/joy/Menu";
import MenuButton from "@mui/joy/MenuButton";
import MenuItem from "@mui/joy/MenuItem";
import AddIcon from "@mui/icons-material/Add";
import { useAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SystemEntityTypes } from "@/lib/SystemTypes";
import { NextLink } from "@/ui/NextLink";
import { MenuItemLink } from "./NewButton.client";
import { ListItemDecorator } from "@mui/joy";
import { EntityTypeIcon } from "@/ui/EntityTypeIcons";
import _ from "lodash";

const getAllowedChildContentTypes = async (
  entityTypeId: string | undefined
) => {
  if (!entityTypeId) {
    return ["system_workspace" satisfies SystemEntityTypes];
  }
  const { user } = await useAuth();
  const contentTypes = await prisma.entityType.findMany({
    where: { tenantId: { in: [user.company_id, "SYSTEM"] } },
    select: {
      validChildEntityTypeIds: true,
      id: true,
      parentId: true,
    },
  });

  const contentTypesKeyedById = _.keyBy(contentTypes, (ct) => ct.id);
  const contentTypesGroupedByParentId = _.groupBy(
    contentTypes,
    (ct) => ct.parentId
  );

  const getClosestParentWithTypeRestrictions = (
    contentTypeId: string | null
  ): string[] => {
    if (!contentTypeId) return [];

    const { validChildEntityTypeIds, parentId } =
      contentTypesKeyedById[contentTypeId];

    return validChildEntityTypeIds.length > 0
      ? validChildEntityTypeIds
      : getClosestParentWithTypeRestrictions(parentId);
  };

  // return getClosestParentWithTypeRestrictions(entityTypeId);
  return getClosestParentWithTypeRestrictions(entityTypeId).flatMap((a) =>
    contentTypes.filter((ct) => ct.id.startsWith(a)).map((c) => c.id)
  );
};

export default async function NewButton(props: { itemId: string }) {
  const { user } = await useAuth();

  const parentEntity = await prisma.entity.findFirst({
    where: { id: props.itemId, tenantId: user.company_id },
    include: {
      entityType: true,
    },
  });

  const entityTypes = await prisma.entityType.findMany({
    where: {
      tenantId: { in: ["SYSTEM", user.company_id] },
    },
  });

  const allowedTypeIds = await getAllowedChildContentTypes(
    parentEntity?.entityTypeId
  );
  return (
    <Dropdown>
      <MenuButton startDecorator={<AddIcon />}>New</MenuButton>
      <Menu placement="bottom-end" sx={{ minWidth: 150 }}>
        {entityTypes
          .filter((t) => !t.abstract)
          .map((et) => {
            return (
              <MenuItemLink
                key={et.id}
                disabled={!allowedTypeIds.includes(et.id)}
                href={`/app/item/${parentEntity?.id || "null"}/new/${et.id}`}
              >
                <ListItemDecorator>
                  <EntityTypeIcon entityTypeIcon={et.icon} />
                </ListItemDecorator>
                New {et.name}
              </MenuItemLink>
            );
          })}
      </Menu>
    </Dropdown>
  );
}
