import { useMemo, useState } from 'react';
import { loadMeta, markHintSeen } from '../services/meta';

interface ContextualHintProps {
  hintId: string;
  message: string;
  visible: boolean;
}

export function ContextualHint({
  hintId,
  message,
  visible,
}: ContextualHintProps) {
  const [dismissedId, setDismissedId] = useState<string | null>(null);
  const shouldShow = useMemo(() => {
    if (!visible || dismissedId === hintId) return false;
    return !loadMeta().seenHints.includes(hintId);
  }, [visible, hintId, dismissedId]);

  if (!shouldShow) return null;

  const dismiss = () => {
    markHintSeen(hintId);
    setDismissedId(hintId);
  };

  return (
    <div className="contextual-hint pixel-panel" role="status">
      <p>{message}</p>
      <button type="button" className="contextual-hint__ok" onClick={dismiss}>
        OK
      </button>
    </div>
  );
}
