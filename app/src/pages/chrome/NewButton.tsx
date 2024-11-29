import Menu from "@mui/joy/Menu";
import ListDivider from "@mui/joy/ListDivider";
import MenuButton from "@mui/joy/MenuButton";
import Dropdown from "@mui/joy/Dropdown";
import { NewFolderMenuItem } from "../context-menu-items/NewFolderMenuItem";
import { NewFulfilmentRequestMenuItem } from "../context-menu-items/NewFulfilmentRequestMenuItem";
import { NewOrderMenuItem } from "../context-menu-items/NewOrderMenuItem";
import { NewPaymentOrderMenuItem } from "../context-menu-items/NewPaymentOrderMenuItem";
import { useState } from "react";
export default function NewButton() {
  return (
    <Dropdown>
      <MenuButton variant="solid" color="primary">
        New
      </MenuButton>
      <Menu placement="bottom-end">
        <NewFolderMenuItem
          onComplete={() => {
            console.log("still here");
          }}
        />
        <ListDivider />
        <NewOrderMenuItem />
        <NewFulfilmentRequestMenuItem />
        <NewPaymentOrderMenuItem />
      </Menu>
    </Dropdown>
  );
}
