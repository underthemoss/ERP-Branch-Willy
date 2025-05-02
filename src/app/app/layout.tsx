"use client";

import { Account } from "@toolpad/core";
import { DashboardLayout } from "@toolpad/core/DashboardLayout";
import ToolbarActions from "./ToolbarActions";
import WorkspaceSwitcher from "./WorkspaceSwitcher";

const Nothing = () => <></>;
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardLayout
      disableCollapsibleSidebar
      slots={{
        appTitle: () => (
          <>
            <Account
              slots={{
                popoverContent: WorkspaceSwitcher,
              }}
              slotProps={{
                preview: {
                  variant: "expanded",
                  slotProps: {
                    avatarIconButton: {
                      sx: {
                        width: "fit-content",
                        margin: "auto",
                      },
                    },
                    avatar: {
                      variant: "rounded",
                    },
                    moreIconButton: {
                      children: <></>,
                    },
                  },
                },
              }}
            />
          </>
        ),
        toolbarActions: ToolbarActions,
      }}
      slotProps={{ toolbarAccount: { slots: { preview: Nothing } } }}
    >
      {children}
    </DashboardLayout>
  );
}
