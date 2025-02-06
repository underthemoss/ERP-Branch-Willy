"use client";

import { Box, Modal, ModalClose, Sheet } from "@mui/joy";
import { useRouter } from "next/navigation";

export const CustomModal = (props: { children: React.ReactNode }) => {
  const router = useRouter();

  return (
    <Modal
      open
      onClose={() => router.back()}
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
      slotProps={{
        backdrop: {
          sx: {
            backdropFilter: "none", // Remove blur
          },
        },
      }}
    >
      <Sheet
        variant="outlined"
        sx={{
          maxWidth: 1000,
          minWidth: 600,
          borderRadius: "md",
          p: 3,
          boxShadow: "lg",
        }}
      >
        <ModalClose
          variant="plain"
          sx={{ m: 1 }}
          //   onClick={() => router.back()}
        />
        <Box
          sx={{
            maxHeight: document.body.getBoundingClientRect().height - 140,
            overflow: "scroll",
          }}
        >
          {props.children}
        </Box>
      </Sheet>
    </Modal>
  );
};
