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

  const validEntityTypes = entityTypes.filter(
    (et) =>
      parentEntity?.entityType.validChildEntityTypeIds.some(
        (a) => a === et.id
      ) ||
      (parentEntity === null && et.id === "workspace")
  );

  return (
    <Dropdown>
      <MenuButton startDecorator={<AddIcon />}>New</MenuButton>
      <Menu placement="bottom-end" sx={{ minWidth: 150 }}>
        {validEntityTypes
          .filter((et) => !et.abstract)
          .map((et) => {
            return (
              <MenuItemLink
                key={et.id}
                href={`/app/item/${parentEntity?.id || "null"}/new/${et.id}`}
              >
                New {et.name}
              </MenuItemLink>
            );
          })}
      </Menu>
    </Dropdown>
  );
}
