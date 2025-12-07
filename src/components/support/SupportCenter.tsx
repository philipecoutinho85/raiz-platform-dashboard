import { useState } from 'react';
import SupportConversationList from './SupportConversationList';
import SupportChat from './SupportChat';
import NewConversationModal from './NewConversationModal';

interface SupportCenterProps {
  isAdminView?: boolean;
}

const SupportCenter = ({ isAdminView = false }: SupportCenterProps) => {
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);

  const handleConversationCreated = (id: string) => {
    setShowNewModal(false);
    setSelectedConversation(id);
  };

  if (selectedConversation) {
    return (
      <SupportChat
        conversationId={selectedConversation}
        onBack={() => setSelectedConversation(null)}
        isAdminView={isAdminView}
      />
    );
  }

  return (
    <>
      <SupportConversationList
        onSelectConversation={setSelectedConversation}
        onNewConversation={() => setShowNewModal(true)}
        selectedId={selectedConversation || undefined}
      />

      <NewConversationModal
        open={showNewModal}
        onClose={() => setShowNewModal(false)}
        onCreated={handleConversationCreated}
      />
    </>
  );
};

export default SupportCenter;
