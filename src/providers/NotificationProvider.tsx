"use client";

import CloseIcon from "@mui/icons-material/Close";
import { IconButton } from "@mui/material";
import {
  closeSnackbar,
  SnackbarProvider,
  SnackbarProviderProps,
  useSnackbar as useNotistackSnackbar,
  VariantType,
} from "notistack";
import React, { createContext, useCallback, useContext } from "react";

// Define notification options interface
interface NotificationOptions {
  variant?: VariantType;
  persist?: boolean;
  preventDuplicate?: boolean;
  autoHideDuration?: number;
  anchorOrigin?: {
    vertical: "top" | "bottom";
    horizontal: "left" | "center" | "right";
  };
  action?: (key: string | number) => React.ReactNode;
}

// Define the notification context interface
interface NotificationContextValue {
  notify: (message: string, options?: NotificationOptions) => void;
  notifySuccess: (message: string, options?: Omit<NotificationOptions, "variant">) => void;
  notifyError: (message: string, options?: Omit<NotificationOptions, "variant">) => void;
  notifyWarning: (message: string, options?: Omit<NotificationOptions, "variant">) => void;
  notifyInfo: (message: string, options?: Omit<NotificationOptions, "variant">) => void;
  closeNotification: (key?: string | number) => void;
}

// Create the context
const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

// Provider component props
interface NotificationProviderProps {
  children: React.ReactNode;
  maxSnack?: number;
  dense?: boolean;
  iconVariant?: SnackbarProviderProps["iconVariant"];
  preventDuplicate?: boolean;
  autoHideDuration?: number;
  anchorOrigin?: {
    vertical: "top" | "bottom";
    horizontal: "left" | "center" | "right";
  };
}

// Internal component that uses the notistack hook
function NotificationProviderInner({ children }: { children: React.ReactNode }) {
  const { enqueueSnackbar, closeSnackbar: closeNotistackSnackbar } = useNotistackSnackbar();

  // Generic notify function
  const notify = useCallback(
    (message: string, options?: NotificationOptions) => {
      const {
        variant = "default",
        persist = false,
        preventDuplicate = true,
        autoHideDuration,
        anchorOrigin,
        action,
      } = options || {};

      enqueueSnackbar(message, {
        variant,
        persist,
        preventDuplicate,
        autoHideDuration,
        anchorOrigin,
        action: action ? (key) => action(key) : undefined,
      });
    },
    [enqueueSnackbar],
  );

  // Convenience methods for different variants
  const notifySuccess = useCallback(
    (message: string, options?: Omit<NotificationOptions, "variant">) => {
      notify(message, { ...options, variant: "success" });
    },
    [notify],
  );

  const notifyError = useCallback(
    (message: string, options?: Omit<NotificationOptions, "variant">) => {
      notify(message, { ...options, variant: "error" });
    },
    [notify],
  );

  const notifyWarning = useCallback(
    (message: string, options?: Omit<NotificationOptions, "variant">) => {
      notify(message, { ...options, variant: "warning" });
    },
    [notify],
  );

  const notifyInfo = useCallback(
    (message: string, options?: Omit<NotificationOptions, "variant">) => {
      notify(message, { ...options, variant: "info" });
    },
    [notify],
  );

  // Close notification
  const closeNotification = useCallback(
    (key?: string | number) => {
      if (key) {
        closeNotistackSnackbar(key);
      } else {
        closeNotistackSnackbar();
      }
    },
    [closeNotistackSnackbar],
  );

  const contextValue: NotificationContextValue = {
    notify,
    notifySuccess,
    notifyError,
    notifyWarning,
    notifyInfo,
    closeNotification,
  };

  return (
    <NotificationContext.Provider value={contextValue}>{children}</NotificationContext.Provider>
  );
}

// Main provider component
export function NotificationProvider({
  children,
  maxSnack = 3,
  dense = false,
  iconVariant,
  preventDuplicate = true,
  autoHideDuration = 5000,
  anchorOrigin = {
    vertical: "bottom",
    horizontal: "left",
  },
}: NotificationProviderProps) {
  // Default action with close button
  const defaultAction = (snackbarId: string | number) => (
    <IconButton
      size="small"
      aria-label="close"
      color="inherit"
      onClick={() => closeSnackbar(snackbarId)}
    >
      <CloseIcon fontSize="small" />
    </IconButton>
  );

  return (
    <SnackbarProvider
      maxSnack={maxSnack}
      dense={dense}
      iconVariant={iconVariant}
      preventDuplicate={preventDuplicate}
      autoHideDuration={autoHideDuration}
      anchorOrigin={anchorOrigin}
      action={defaultAction}
      style={{
        fontFamily: "Roboto, sans-serif",
      }}
    >
      <NotificationProviderInner>{children}</NotificationProviderInner>
    </SnackbarProvider>
  );
}

// Custom hook to use notifications
export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotification must be used within a NotificationProvider");
  }
  return context;
}

// Re-export types for convenience
export type { NotificationOptions, VariantType };
