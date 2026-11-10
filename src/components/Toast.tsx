import { useCallback, useEffect, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
export interface ToastMessage {
  message: string;
  action?: () => void;
}
export function useToast() {
  const [message, setMessage] = useState<ToastMessage | null>(null);
  const show = useCallback(
    (message: string, action?: () => void) => setMessage({ message, action }),
    [],
  );
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(null), message.action ? 8000 : 3500);
    return () => clearTimeout(timer);
  }, [message]);
  return { message, show, dismiss: () => setMessage(null) };
}
export function Toast({
  message,
  undoLabel,
  dismiss,
}: {
  message: ToastMessage | null;
  undoLabel: string;
  dismiss: () => void;
}) {
  return (
    <div
      className={`toast ${message ? 'is-visible' : ''}`}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      {message && (
        <>
          <CheckCircle2 size={18} />
          <span>{message.message}</span>
          {message.action && (
            <button
              onClick={() => {
                message.action?.();
                dismiss();
              }}
            >
              {undoLabel}
            </button>
          )}
        </>
      )}
    </div>
  );
}
