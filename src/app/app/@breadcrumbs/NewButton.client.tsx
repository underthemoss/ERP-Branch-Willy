"use client";
import { MenuItem } from "@mui/joy";
import { useRouter } from "next/navigation";

export const MenuItemLink = (props: {
  children: React.ReactNode;
  href: string;
}) => {
  const { push } = useRouter();
  return <MenuItem onClick={() => push(props.href)}>{props.children}</MenuItem>;
};
