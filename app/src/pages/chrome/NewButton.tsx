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
  const [open, setOpen] = useState(false);
  return (
    <Dropdown
      open={open}
      onOpenChange={(_, val) => {
        setOpen(!val);
      }}
    >
      <MenuButton
        variant="solid"
        color="primary"
        onClick={() => setOpen(!open)}
      >
        New
      </MenuButton>
      <Menu placement="bottom-end">
        <NewFolderMenuItem onComplete={() => setOpen(false)} />
        <ListDivider />
        <NewOrderMenuItem />
        <NewFulfilmentRequestMenuItem />
        <NewPaymentOrderMenuItem />
      </Menu>
    </Dropdown>
  );
}
