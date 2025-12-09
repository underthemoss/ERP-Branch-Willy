"use client";

import { useAuth0 } from "@auth0/auth0-react";
import { ArrowRight, Sparkles, UserPlus } from "lucide-react";

interface IntakeFormAuthBannerProps {
  email?: string | null;
  formId: string;
}

export function IntakeFormAuthBanner({ email, formId }: IntakeFormAuthBannerProps) {
  const { isAuthenticated, isLoading, loginWithRedirect } = useAuth0();

  if (isLoading || isAuthenticated) {
    return null;
  }

  const handleSignIn = () => {
    loginWithRedirect({
      appState: {
        returnTo: `/intake-form/${formId}/orders`,
      },
    });
  };

  const handleSignUp = () => {
    loginWithRedirect({
      authorizationParams: {
        screen_hint: "signup",
        ...(email && { login_hint: email }),
      },
      appState: {
        returnTo: `/intake-form/${formId}/orders`,
      },
    });
  };

  return (
    <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-700/50">
      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-white text-sm font-medium">
                Create an account to track your order
              </p>
              <p className="text-slate-400 text-xs">
                View order status, see past orders, and manage your quotes
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSignUp}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm font-medium rounded-xl transition-all duration-200 border border-white/10 hover:border-white/20 backdrop-blur-sm group"
            >
              <UserPlus className="w-4 h-4" />
              Sign Up
            </button>
            <button
              onClick={handleSignIn}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-xl transition-all duration-200 shadow-lg shadow-emerald-500/20 group"
            >
              Sign In
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
