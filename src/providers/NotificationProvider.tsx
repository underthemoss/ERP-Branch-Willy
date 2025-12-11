"use client";

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

// Define notification options interface
interface NotificationOptions {
  variant?: "default" | "success" | "error" | "warning" | "info";
  persist?: boolean;
  preventDuplicate?: boolean;
  autoHideDuration?: number;
  anchorOrigin?: {
    vertical: "top" | "bottom";
    horizontal: "left" | "center" | "right";
  };
}

interface Notification {
  id: string;
  message: string;
  variant: "default" | "success" | "error" | "warning" | "info";
  persist: boolean;
}

// Define the notification context interface
interface NotificationContextValue {
  notify: (message: string, options?: NotificationOptions) => void;
  notifySuccess: (message: string, options?: Omit<NotificationOptions, "variant">) => void;
  notifyError: (message: string, options?: Omit<NotificationOptions, "variant">) => void;
  notifyWarning: (message: string, options?: Omit<NotificationOptions, "variant">) => void;
  notifyInfo: (message: string, options?: Omit<NotificationOptions, "variant">) => void;
  closeNotification: (key?: string) => void;
}

// Create the context
const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

// Provider component props
interface NotificationProviderProps {
  children: React.ReactNode;
  maxSnack?: number;
  preventDuplicate?: boolean;
  autoHideDuration?: number;
  anchorOrigin?: {
    vertical: "top" | "bottom";
    horizontal: "left" | "center" | "right";
  };
}

// Notification component
function NotificationItem({
  notification,
  onClose,
  position,
}: {
  notification: Notification;
  onClose: (id: string) => void;
  position: {
    vertical: "top" | "bottom";
    horizontal: "left" | "center" | "right";
  };
}) {
  const [isExiting, setIsExiting] = useState(false);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => onClose(notification.id), 400); // Match animation duration
  };

  // Variant styles - sharp and clean
  const variantStyles = {
    default: "bg-gradient-to-br from-gray-900 to-gray-800 text-white border-gray-700 shadow-lg",
    success: "bg-white text-green-800 border-green-300 shadow-lg shadow-green-500/15",
    error: "bg-white text-red-800 border-red-300 shadow-lg shadow-red-500/15",
    warning: "bg-white text-amber-800 border-amber-300 shadow-lg shadow-amber-500/15",
    info: "bg-white text-blue-800 border-blue-300 shadow-lg shadow-blue-500/15",
  };

  // Icon styles
  const iconStyles = {
    default: "text-gray-300",
    success: "text-green-600",
    error: "text-red-600",
    warning: "text-amber-600",
    info: "text-blue-600",
  };

  // Icons for each variant
  const renderIcon = () => {
    const iconClass = `w-5 h-5 flex-shrink-0 ${iconStyles[notification.variant]}`;
    switch (notification.variant) {
      case "success":
        return (
          <svg className={iconClass} fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
        );
      case "error":
        return (
          <svg className={iconClass} fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
        );
      case "warning":
        return (
          <svg className={iconClass} fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
        );
      case "info":
        return (
          <svg className={iconClass} fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
        );
      default:
        return (
          <svg className={iconClass} fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
        );
    }
  };

  // Animation classes based on position
  const getAnimationClasses = () => {
    if (isExiting) {
      return "animate-fade-out opacity-0 scale-95";
    }
    return "animate-fade-in";
  };

  return (
    <div
      className={`
        flex items-center gap-2.5 px-3 py-2.5 rounded-lg border shadow-lg
        ${variantStyles[notification.variant]}
        ${getAnimationClasses()}
        transition-all duration-300
      `}
      role="alert"
    >
      {renderIcon()}
      <div className="flex-1 font-medium text-sm leading-tight">{notification.message}</div>
      <button
        onClick={handleClose}
        className="flex-shrink-0 inline-flex rounded-md p-1 hover:bg-black/10 focus:outline-none focus:ring-2 focus:ring-offset-1 transition-colors"
        aria-label="Close notification"
      >
        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>
    </div>
  );
}

// Notifications container
function NotificationsContainer({
  notifications,
  onClose,
  anchorOrigin,
}: {
  notifications: Notification[];
  onClose: (id: string) => void;
  anchorOrigin: {
    vertical: "top" | "bottom";
    horizontal: "left" | "center" | "right";
  };
}) {
  // Position classes
  const positionClasses = {
    vertical: {
      top: "top-4",
      bottom: "bottom-4",
    },
    horizontal: {
      left: "left-4",
      center: "left-1/2 -translate-x-1/2",
      right: "right-4",
    },
  };

  return (
    <div
      className={`
        fixed z-50 pointer-events-none
        ${positionClasses.vertical[anchorOrigin.vertical]}
        ${positionClasses.horizontal[anchorOrigin.horizontal]}
      `}
    >
      <div className="flex flex-col gap-2 pointer-events-auto">
        {notifications.map((notification) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onClose={onClose}
            position={anchorOrigin}
          />
        ))}
      </div>
    </div>
  );
}

// Main provider component
export function NotificationProvider({
  children,
  maxSnack = 3,
  preventDuplicate = true,
  autoHideDuration = 5000,
  anchorOrigin = {
    vertical: "bottom",
    horizontal: "center",
  },
}: NotificationProviderProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const timeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Clean up timeouts on unmount
  useEffect(() => {
    const timeouts = timeoutsRef.current;
    return () => {
      timeouts.forEach((timeout) => clearTimeout(timeout));
      timeouts.clear();
    };
  }, []);

  // Close notification
  const closeNotification = useCallback((key?: string) => {
    if (key) {
      setNotifications((prev) => prev.filter((n) => n.id !== key));
      const timeout = timeoutsRef.current.get(key);
      if (timeout) {
        clearTimeout(timeout);
        timeoutsRef.current.delete(key);
      }
    } else {
      setNotifications([]);
      timeoutsRef.current.forEach((timeout) => clearTimeout(timeout));
      timeoutsRef.current.clear();
    }
  }, []);

  // Generic notify function
  const notify = useCallback(
    (message: string, options?: NotificationOptions) => {
      const {
        variant = "default",
        persist = false,
        preventDuplicate: preventDupe = preventDuplicate,
        autoHideDuration: duration = autoHideDuration,
      } = options || {};

      // Check for duplicates
      if (preventDupe) {
        const isDuplicate = notifications.some((n) => n.message === message);
        if (isDuplicate) return;
      }

      const id = `notification-${Date.now()}-${Math.random()}`;
      const newNotification: Notification = {
        id,
        message,
        variant,
        persist,
      };

      setNotifications((prev) => {
        const updated = [...prev, newNotification];
        // Keep only the most recent maxSnack notifications
        return updated.slice(-maxSnack);
      });

      // Auto-dismiss if not persistent
      if (!persist) {
        const timeout = setTimeout(() => {
          closeNotification(id);
        }, duration);
        timeoutsRef.current.set(id, timeout);
      }
    },
    [notifications, preventDuplicate, autoHideDuration, maxSnack, closeNotification],
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

  const contextValue: NotificationContextValue = {
    notify,
    notifySuccess,
    notifyError,
    notifyWarning,
    notifyInfo,
    closeNotification,
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
      <NotificationsContainer
        notifications={notifications}
        onClose={closeNotification}
        anchorOrigin={anchorOrigin}
      />
    </NotificationContext.Provider>
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
export type { NotificationOptions };
