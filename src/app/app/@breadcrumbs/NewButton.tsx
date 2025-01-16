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
export default async function NewButton(props: { itemId: string }) {
  const { user } = await useAuth();

  const parentEntity = props.itemId
    ? await prisma.entity.findFirstOrThrow({
        where: { id: props.itemId, tenantId: user.company_id },
        include: {
          entityType: true,
        },
      })
    : null;

  const entityTypes = await prisma.entityType.findMany({
    where: {
      tenantId: { in: ["SYSTEM", user.company_id] },
    },
    include: {
      parent: true,
    },
  });

  const lineage = (id: string | null): string[] => {
    const entityType = entityTypes.find((et) => et.id === id);
    if (!entityType) return [];
    return [...lineage(entityType.parentId), entityType.id];
  };

  const types = entityTypes.map((et) => {
    const parents = lineage(et.id);
    const isValid =
      parents.some((id) =>
        parentEntity?.entityType.validChildEntityTypeIds.includes(id)
      ) ||
      (parentEntity?.parentId === undefined && parents.includes("workspace"));
    return {
      label: et.name,
      id: et.id,
      hidden: !isValid,
      lineage: lineage(et.id),
    };
  });

  return (
    <Dropdown>
      <MenuButton startDecorator={<AddIcon />}>New</MenuButton>
      <Menu placement="bottom-end" sx={{ minWidth: 150 }}>
        {types
          .filter((t) => !t.hidden)
          .map((et) => {
            return (
              <MenuItemLink
                key={et.id}
                href={`/app/item/${parentEntity?.id || "null"}/new/${et.id}`}
              >
                <ListItemDecorator>
                  <EntityTypeIcon entityTypeId={et.id} />
                </ListItemDecorator>
                New {et.label}
              </MenuItemLink>
            );
          })}
      </Menu>
    </Dropdown>
  );
}
