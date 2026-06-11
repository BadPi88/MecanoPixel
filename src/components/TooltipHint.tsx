import { useState, type ReactNode } from 'react';
import { loadMeta, markHintSeen } from '../services/meta';

interface TooltipHintProps {
  hintId: string;
  message: string;
  children: ReactNode;
}

export function TooltipHint({ hintId, message, children }: TooltipHintProps) {
  const [firstTime] = useState(
    () => !loadMeta().seenHints.includes(hintId),
  );
  const [show, setShow] = useState(firstTime);

  const dismiss = () => {
    setShow(false);
    if (firstTime) markHintSeen(hintId);
  };

  return (
    <span
      className="tooltip-hint"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => !firstTime && setShow(false)}
    >
      {children}
      {show && (
        <span className="tooltip-hint__bubble" role="tooltip">
          {message}
          {firstTime && (
            <button
              type="button"
              className="tooltip-hint__dismiss"
              onClick={(e) => {
                e.stopPropagation();
                dismiss();
              }}
            >
              OK
            </button>
          )}
        </span>
      )}
    </span>
  );
}
