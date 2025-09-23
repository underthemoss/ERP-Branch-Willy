"use client";

import { useNotification } from "@/providers/NotificationProvider";
import { Button, Stack, Typography } from "@mui/material";
import React from "react";

/**
 * Example component demonstrating how to use the notification system.
 * This component can be imported and used anywhere in the app to test notifications.
 */
export function NotificationExample() {
  const { notify, notifySuccess, notifyError, notifyWarning, notifyInfo, closeNotification } =
    useNotification();

  const handleDefaultNotification = () => {
    notify("This is a default notification");
  };

  const handleSuccessNotification = () => {
    notifySuccess("Operation completed successfully!");
  };

  const handleErrorNotification = () => {
    notifyError("An error occurred while processing your request");
  };

  const handleWarningNotification = () => {
    notifyWarning("Please review your input before proceeding");
  };

  const handleInfoNotification = () => {
    notifyInfo("New updates are available");
  };

  const handlePersistentNotification = () => {
    notify("This notification will stay until closed", {
      persist: true,
      variant: "info",
    });
  };

  const handleCustomPositionNotification = () => {
    notify("Top center notification", {
      variant: "success",
      anchorOrigin: {
        vertical: "top",
        horizontal: "center",
      },
    });
  };

  const handleLongDurationNotification = () => {
    notify("This notification will stay for 10 seconds", {
      variant: "warning",
      autoHideDuration: 10000,
    });
  };

  const handleMultipleNotifications = () => {
    notifyInfo("First notification");
    notifySuccess("Second notification");
    notifyWarning("Third notification");
  };

  const handleCloseAll = () => {
    closeNotification();
  };

  return (
    <Stack spacing={3} sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Notification System Examples
      </Typography>

      <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
        <Button variant="contained" onClick={handleDefaultNotification}>
          Default Notification
        </Button>
        <Button variant="contained" color="success" onClick={handleSuccessNotification}>
          Success Notification
        </Button>
        <Button variant="contained" color="error" onClick={handleErrorNotification}>
          Error Notification
        </Button>
        <Button variant="contained" color="warning" onClick={handleWarningNotification}>
          Warning Notification
        </Button>
        <Button variant="contained" color="info" onClick={handleInfoNotification}>
          Info Notification
        </Button>
      </Stack>

      <Typography variant="h6" gutterBottom>
        Advanced Examples
      </Typography>

      <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
        <Button variant="outlined" onClick={handlePersistentNotification}>
          Persistent Notification
        </Button>
        <Button variant="outlined" onClick={handleCustomPositionNotification}>
          Top Center Position
        </Button>
        <Button variant="outlined" onClick={handleLongDurationNotification}>
          10 Second Duration
        </Button>
        <Button variant="outlined" onClick={handleMultipleNotifications}>
          Multiple Notifications
        </Button>
        <Button variant="outlined" color="secondary" onClick={handleCloseAll}>
          Close All Notifications
        </Button>
      </Stack>

      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
        Note: The notification system prevents duplicate messages by default. Try clicking the same
        button multiple times to see this in action.
      </Typography>
    </Stack>
  );
}

/**
 * Usage example in other components:
 *
 * import { useNotification } from '@/providers/NotificationProvider';
 *
 * function MyComponent() {
 *   const { notifySuccess, notifyError } = useNotification();
 *
 *   const handleSave = async () => {
 *     try {
 *       await saveData();
 *       notifySuccess('Data saved successfully!');
 *     } catch (error) {
 *       notifyError('Failed to save data. Please try again.');
 *     }
 *   };
 *
 *   return <button onClick={handleSave}>Save</button>;
 * }
 */
