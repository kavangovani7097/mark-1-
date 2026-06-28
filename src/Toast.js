import { useEffect, useState } from 'react';

function ToastIcon({ type }) {
  const svgProps = {
    width: 20,
    height: 20,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
  };

  if (type === 'error') {
    return (
      <svg {...svgProps}>
        <circle cx="12" cy="12" r="9" />
        <path d="M15 9l-6 6M9 9l6 6" />
      </svg>
    );
  }

  if (type === 'info') {
    return (
      <svg {...svgProps}>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 11v5M12 8h.01" />
      </svg>
    );
  }

  return (
    <svg {...svgProps}>
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12.5l2.5 2.5L16 9.5" />
    </svg>
  );
}

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
        <ToastIcon type={type} />
      </span>
      <span className="toast-premium__message">{message}</span>
      <div className="toast-premium__progress" aria-hidden="true" />
    </div>
  );
}

export default Toast;
