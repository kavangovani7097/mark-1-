import { useEffect, useState } from 'react';

const ICONS = {
  success: '✅',
  error: '❌',
  info: 'ℹ️',
};

function Toast({ message, type = 'success', onDismiss }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const enterTimer = requestAnimationFrame(() => setVisible(true));
    const dismissTimer = setTimeout(() => {
      setVisible(false);
      setTimeout(onDismiss, 280);
    }, 3000);

    return () => {
      cancelAnimationFrame(enterTimer);
      clearTimeout(dismissTimer);
    };
  }, [onDismiss]);

  return (
    <div
      className={`toast-premium toast-premium--${type}${visible ? ' toast-premium--visible' : ''}`}
      role="status"
      aria-live="polite"
    >
      <span className="toast-premium__icon" aria-hidden="true">
        {ICONS[type] || ICONS.info}
      </span>
      <span className="toast-premium__message">{message}</span>
      <div className="toast-premium__progress" aria-hidden="true" />
    </div>
  );
}

export default Toast;
