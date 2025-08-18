"use client";

import { datadogRum } from "@datadog/browser-rum";
import { reactPlugin } from "@datadog/browser-rum-react";

export function initializeDatadogRum() {
  if (typeof window !== "undefined" && !datadogRum.getInternalContext()) {
    // Only enable DD RUM for staging and production environments
    const hostname = window.location.hostname;
    const isStaging = hostname === "staging-erp.estrack.com";
    const isProduction = hostname === "erp.estrack.com";

    // Skip initialization for local/dev environments
    if (!isStaging && !isProduction) {
      console.log("Datadog RUM disabled for development environment");
      return;
    }

    // Determine environment based on hostname
    const env = isProduction ? "production" : "staging";

    datadogRum.init({
      applicationId: "b387fe64-707d-4dbe-9217-a9a199e9a027",
      clientToken: "pubb0ef2b479f2d24bc7de00ed69f10c621",
      site: "datadoghq.com",
      service: "es-erp",
      env: env,

      // Specify a version number to identify the deployed version of your application in Datadog
      // version: '1.0.0',
      sessionSampleRate: 100,
      sessionReplaySampleRate: 100,
      defaultPrivacyLevel: "allow",
      plugins: [reactPlugin({ router: false })],

      // Enable tracking of user interactions
      trackUserInteractions: true,
      trackResources: true,
      trackLongTasks: true,

      // Custom configuration for better user tracking
      beforeSend: (event, context) => {
        // Add custom context to all events
        if (event.type === "error") {
          // Add additional error context if needed
          event.context = {
            ...event.context,
            error_source: "client",
          };
        }
        return true;
      },
    });

    // Start session recording
    datadogRum.startSessionReplayRecording();
  }
}

// Helper function to track custom user actions
export function trackUserAction(name: string, context?: Record<string, any>) {
  if (typeof window !== "undefined" && datadogRum.getInternalContext()) {
    datadogRum.addAction(name, context);
  }
}

// Helper function to track custom errors
export function trackError(error: Error, context?: Record<string, any>) {
  if (typeof window !== "undefined" && datadogRum.getInternalContext()) {
    datadogRum.addError(error, context);
  }
}

// Helper function to add custom timing
export function trackTiming(name: string, duration: number) {
  if (typeof window !== "undefined" && datadogRum.getInternalContext()) {
    datadogRum.addTiming(name, duration);
  }
}
