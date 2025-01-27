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
import { MenuItemLink } from "../../../ui/MenuItemLink";
import { ListItemDecorator } from "@mui/joy";
import { EntityTypeIcon } from "@/ui/EntityTypeIcons";
import _ from "lodash";

export default async function NewButton(props: { itemId: string }) {
  const { user } = await useAuth();

  const parentEntity = await prisma.entity.findFirst({
    where: { id: props.itemId, tenant_id: { in: ["SYSTEM", user.company_id] } },
    include: { type: true },
  });

  const entityTypes = await prisma.entityType.findMany({
    where: {
      tenant_id: { in: ["SYSTEM", user.company_id] },
    },
  });
  return (
    <Dropdown>
      <MenuButton startDecorator={<AddIcon />}>New</MenuButton>
      <Menu placement="bottom-end" sx={{ minWidth: 150 }}>
        {entityTypes
          .filter((et) =>
            parentEntity
              ? parentEntity.type.valid_child_type_ids.includes(et.id)
              : et.id === ("system_workspace" satisfies SystemEntityTypes)
          )
          .map((et) => {
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
