import { useUIStore } from '@/store/ui.store';

type PostType = 'text' | 'photo' | 'video' | 'poll';

export const useActionModal = () => {
  const { setOptionsOpen, setActiveModal } = useUIStore();
  
  const toggleOptions = () => setOptionsOpen(true); // Or use a toggle logic in store
  const openModal = (type: PostType = 'text') => {
    setActiveModal('create-post', type);
  };

  return { toggleOptions, openModal };
};

export const ActionModalProvider = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};
