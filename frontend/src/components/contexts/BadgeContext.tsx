import React, { createContext, useContext, useEffect, useState } from "react";
import { useApi } from "../../modules/apiAxios";
import { HandleAllErrorsContext } from "./HandleAllErrors";
import { AuthContext } from "./AuthContext";

export interface BadgeProps {
  path: string;
  active: boolean;
}

interface BadgesContextType {
  badges: {
    processing: BadgeProps;
    feedback: BadgeProps;
  };
  setBadgeActive: (
    key: keyof BadgesContextType["badges"],
    active: boolean
  ) => void;
}

// Initialize the context
const BadgesContext = createContext<BadgesContextType | undefined>(undefined);

// Provider component
export const BadgesProvider = ({ children }: { children: React.ReactNode }) => {
  const [badges, setBadges] = useState<BadgesContextType["badges"]>({
    processing: {
      path: "/home",
      active: false,
    },
    feedback: {
      path: "/home/feedback",
      active: false,
    },
  });
  const api = useApi();
  const { handleAllErrors } = useContext(HandleAllErrorsContext);
  const { hasAccess } = useContext(AuthContext);

  const initialLoad = async () => {
    try {
      // Parallel API requests to fetch badge statuses
      const [feedbackResponse, processingResponse] = await Promise.all([
        api.get("/predictions/feedback_status/"),
        api.get("/phaero_note/process_state/"),
      ]);

      // Determine badge states based on API responses
      const feedbackBadgeActive =
        feedbackResponse.data.progress >=
        feedbackResponse.data.feedbackRequirement;
      const processingBadgeActive = !processingResponse.data.has_been_processed;

      // Update badges state once both responses are processed
      setBadges({
        processing: {
          path: "/home",
          active: processingBadgeActive,
        },
        feedback: {
          path: "/home/feedback",
          active: feedbackBadgeActive,
        },
      });
    } catch (error) {
      handleAllErrors(error);
    }
  };

  useEffect(() => {
    if (hasAccess) initialLoad();
  }, [hasAccess]);

  const setBadgeActive = (
    key: keyof BadgesContextType["badges"],
    active: boolean
  ) => {
    setBadges((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        active: active,
      },
    }));
  };

  return (
    <BadgesContext.Provider value={{ badges, setBadgeActive }}>
      {children}
    </BadgesContext.Provider>
  );
};

// Custom hook to use the context
export const useBadges = (): BadgesContextType => {
  const context = useContext(BadgesContext);
  if (context === undefined) {
    throw new Error("useBadges must be used within a BadgesProvider");
  }
  return context;
};
