import { useEffect, type FC } from 'react';
import { X } from 'lucide-react';

interface ToastProps {
  message: string;
  onDismiss: () => void;
  duration?: number;
}

export const Toast: FC<ToastProps> = ({ message, onDismiss, duration = 4000 }) => {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      onDismiss();
    }, duration);
    return () => clearTimeout(timer);
  }, [message, duration, onDismiss]);

  if (!message) return null;

  return (
    <div className="toast" role="status">
      <span>{message}</span>
      <button onClick={onDismiss} aria-label="Dismiss notice">
        <X size={15} />
      </button>
    </div>
  );
};
