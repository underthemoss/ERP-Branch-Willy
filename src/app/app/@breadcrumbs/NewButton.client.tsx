"use client";
import { MenuItem } from "@mui/joy";
import { useRouter } from "next/navigation";

export const MenuItemLink = (props: {
  children: React.ReactNode;
  href: string;
  disabled?: boolean;
}) => {
  const { push } = useRouter();
  return (
    <MenuItem disabled={props.disabled} onClick={() => push(props.href)}>
      {props.children}
    </MenuItem>
  );
};
