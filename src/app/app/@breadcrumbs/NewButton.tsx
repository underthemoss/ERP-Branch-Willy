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
import { EntityIcon, EntityTypeIcon } from "@/ui/EntityTypeIcons";
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

  console.log(entityTypeId);

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

  console.log("asd", getClosestParentWithTypeRestrictions(entityTypeId));
  // return getClosestParentWithTypeRestrictions(entityTypeId);
  return getClosestParentWithTypeRestrictions(entityTypeId).flatMap((a) =>
    contentTypes
      .filter((ct) => ct.id.startsWith(a))
      .map((c) => c.id)
  );

  // const validContentTypes = getAncestors(entityTypeId).reduce(
  //   (acc, contentTypeId) => {
  //     const contentType = contentTypesKeyedById[contentTypeId];
  //     return [
  //       ...acc,
  //       ...contentType.validChildEntityTypeIds,
  //       ...contentType.validChildEntityTypeIds.flatMap(
  //         getContentTypeDescendents
  //       ),
  //     ];
  //   },
  //   [] as string[]
  // );

  // return validContentTypes;
  // const traverseTree = (
  //   entityTypeId: string,
  //   visited = new Set<string>()
  // ): string[] => {
  //   // If the current ID is already visited, stop recursion
  //   if (visited.has(entityTypeId)) {
  //     return [];
  //   }

  //   // Mark the current ID as visited
  //   visited.add(entityTypeId);

  //   // Retrieve valid child entity type IDs
  //   const validEntityTypeIds =
  //     result[entityTypeId]?.validChildEntityTypeIds || [];

  //   // Recursively traverse the children
  //   return [
  //     ...new Set([
  //       ...validEntityTypeIds,
  //       ...validEntityTypeIds.flatMap((childId) =>
  //         traverseTree(childId, visited)
  //       ),
  //     ]),
  //   ];
  // };

  // return traverseTree(entityTypeId);
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

  // const allowedTypeIds =

  const allowedTypeIds = await getAllowedChildContentTypes(
    parentEntity?.entityTypeId
  );
  // console.log(await getAllowedChildContentTypes(parentEntity?.entityTypeId));
  // console.log(
  //   await prisma.entityType.getAllowedChildContentTypes(
  //     parentEntity?.entityTypeId
  //   )
  // );
  return (
    <Dropdown>
      <MenuButton startDecorator={<AddIcon />}>New</MenuButton>
      <Menu placement="bottom-end" sx={{ minWidth: 150 }}>
        {entityTypes
          // .filter((t) => !t.hidden)
          .map((et) => {
            return (
              <MenuItemLink
                key={et.id}
                disabled={!allowedTypeIds.includes(et.id)}
                href={`/app/item/${parentEntity?.id || "null"}/new/${et.id}`}
              >
                <ListItemDecorator>
                  <EntityTypeIcon entityTypeId={et.id} />
                </ListItemDecorator>
                New {et.name}
              </MenuItemLink>
            );
          })}
      </Menu>
    </Dropdown>
  );
}
