import * as React from "react";
import Dropdown from "@mui/joy/Dropdown";
import Menu from "@mui/joy/Menu";
import MenuButton from "@mui/joy/MenuButton";
import AddIcon from "@mui/icons-material/Add";
import { getUser } from "@/lib/auth";
import { MenuItemLink } from "../../../ui/MenuItemLink";
import { ListItemDecorator } from "@mui/joy";
import _ from "lodash";

import { UIConfig } from "@/types/UIModelConfig";

export default async function NewButton(props: { itemId: string }) {
  const { user } = await getUser();
  return "asd";
  // return (
  //   <Dropdown>
  //     <MenuButton startDecorator={<AddIcon />}>New</MenuButton>
  //     <Menu placement="bottom-end" sx={{ minWidth: 150 }}>
  //       {Object.entries(UIConfig).map(([ct, config]) => {
  //         return (
  //           <MenuItemLink
  //             key={ct}
  //             // disabled={!allowedTypeIds.includes(et.id)}
  //             href={`/app/item/${props.itemId || "null"}/new/${ct}`}
  //           >
  //             <ListItemDecorator>
  //               {/* <ContentTypeIcon color={'red'} icon={ct.icon} /> */}
  //             </ListItemDecorator>
  //             {config.create_form.title}
  //           </MenuItemLink>
  //         );
  //       })}
  //     </Menu>
  //   </Dropdown>
  // );
}
