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

export default async function NewButton(props: { itemId: string }) {
  const { user } = await useAuth();

  const parentEntity = await prisma.entity.findFirst({
    where: { id: props.itemId, tenantId: { in: ["SYSTEM", user.company_id] } },
    include: { entityType: true },
  });
  const prefixes =
    parentEntity?.entityType.validChildEntityTypeIds ||
    (["system_workspace", "system_list"] satisfies SystemEntityTypes[]);

  const entityTypes = await prisma.entityType.findMany({
    where: {
      tenantId: { in: ["SYSTEM", user.company_id] },
      abstract: false,
      OR: prefixes.map((prefix) => ({
        id: {
          startsWith: prefix,
        },
      })),
    },
  });
  return (
    <Dropdown>
      <MenuButton startDecorator={<AddIcon />}>New</MenuButton>
      <Menu placement="bottom-end" sx={{ minWidth: 150 }}>
        {entityTypes.map((et) => {
          return (
            <MenuItemLink
              key={et.id}
              // disabled={!allowedTypeIds.includes(et.id)}
              href={`/app/item/${props.itemId || "null"}/new/${et.id}`}
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
