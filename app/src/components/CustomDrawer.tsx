import { Drawer } from "@mui/joy";

export const CustomDrawer = (props: {
  open: boolean;
  setOpen: (val: boolean) => void;
  children: React.ReactNode;
}) => {
  const { open, setOpen, children } = props;
  return (
    <Drawer
      open={open}
      onClose={() => {
        setOpen(!open);
      }}
      slotProps={{
        backdrop: {
          sx: {
            backdropFilter: "none", // Remove blur
            backgroundColor: "rgba(0, 0, 0, 0.3)", // Optional: Customize backdrop color
          },
        },
      }}
      anchor="right"
    >
      {children}
    </Drawer>
  );
};
