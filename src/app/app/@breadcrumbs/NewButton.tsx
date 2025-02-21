import * as React from "react";
import Dropdown from "@mui/joy/Dropdown";
import Menu from "@mui/joy/Menu";
import MenuButton from "@mui/joy/MenuButton";
import AddIcon from "@mui/icons-material/Add";
import { getUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MenuItemLink } from "../../../ui/MenuItemLink";
import { ListItemDecorator } from "@mui/joy";
import { EntityTypeIcon } from "@/ui/EntityTypeIcons";
import _ from "lodash";
import {
  ContentTypeCategories,
  GlobalContentTypeId,
} from "@/config/ContentTypesConfig";
import { getContentTypes } from "@/services/ContentTypeRepository";
import { ContentTypeIcon } from "@/ui/Icons";
import { SystemContentTypeIds } from "@/services/SystemContentTypes";

export default async function NewButton(props: { itemId: string }) {
  const { user } = await getUser();
  const item = props.itemId
    ? await prisma.entity.findFirstOrThrow({
        where: { tenant_id: user.company_id, id: props.itemId },
      })
    : null;
  const contentTypes = await getContentTypes();
  const contentType = item
    ? contentTypes.find((ct) => ct.id === item?.type_id)
    : null;

  const validContentTypes = contentType
    ? contentTypes.filter(
        (ct) =>
          !ct.abstract &&
          ct.inheritageLineage.some((item) =>
            contentType.allowed_child_content_types?.includes(item)
          )
      )
    : contentTypes.filter((ct) =>
        ct.inheritageLineage.includes(SystemContentTypeIds.Workspace)
      );

  if (validContentTypes.length === 0) return null;
  return (
    <Dropdown>
      <MenuButton startDecorator={<AddIcon />}>New</MenuButton>
      <Menu placement="bottom-end" sx={{ minWidth: 150 }}>
        {validContentTypes.map((ct) => {
          return (
            <MenuItemLink
              key={ct.id}
              // disabled={!allowedTypeIds.includes(et.id)}
              href={`/app/item/${props.itemId || "null"}/new/${ct.id}`}
            >
              <ListItemDecorator>
                <ContentTypeIcon color={ct.color} icon={ct.icon} />
              </ListItemDecorator>
              {ct.label}
            </MenuItemLink>
          );
        })}
      </Menu>
    </Dropdown>
  );
}
