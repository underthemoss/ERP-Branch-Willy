import { Drawer } from "@mui/joy";

export const CustomDrawer = (props: {
  open: boolean;
  setOpen: (val: boolean) => void;
  hideBackdrop?: boolean;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg";
}) => {
  const { open, setOpen, hideBackdrop, children, size } = props;
  return (
    <Drawer
      open={open}
      onClose={() => {
        setOpen(!open);
      }}
      size={size}
      slotProps={{
        backdrop: {
          sx: {
            backdropFilter: "none", // Remove blur
            backgroundColor: hideBackdrop
              ? "rgba(0, 0, 0, 0.0)"
              : "rgba(0, 0, 0, 0.3)",
          },
        },
      }}
      anchor="right"
    >
      {children}
    </Drawer>
  );
};
