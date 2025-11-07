import { useState } from 'react';

export const useReauthentication = () => {
  const [isReauthModalOpen, setIsReauthModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<{
    action: () => void;
    description: string;
  } | null>(null);

  const requireReauth = (action: () => void, description: string) => {
    setPendingAction({ action, description });
    setIsReauthModalOpen(true);
  };

  const handleReauthSuccess = () => {
    if (pendingAction) {
      pendingAction.action();
      setPendingAction(null);
    }
  };

  const handleReauthClose = () => {
    setIsReauthModalOpen(false);
    setPendingAction(null);
  };

  return {
    isReauthModalOpen,
    pendingAction,
    requireReauth,
    handleReauthSuccess,
    handleReauthClose,
  };
};
