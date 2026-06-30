import { useEffect, useRef, useState } from 'react';

export function useReveal(threshold = 0.12) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;

    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true);
      },
      { threshold, rootMargin: '0px 0px -6% 0px' }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, visible };
}

export function RevealList({ children, className = '', as: Tag = 'div' }) {
  const { ref, visible } = useReveal();

  return (
    <Tag
      ref={ref}
      className={`app-reveal${visible ? ' app-reveal--visible' : ''}${
        className ? ` ${className}` : ''
      }`}
    >
      {children}
    </Tag>
  );
}

export function RevealItem({ index, children, className = '' }) {
  return (
    <div
      className={`app-reveal-item${className ? ` ${className}` : ''}`}
      style={{ '--reveal-index': index }}
    >
      {children}
    </div>
  );
}

export function CountUpStat({ value, className = '', duration = 900 }) {
  const { ref, visible } = useReveal(0.15);
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!visible) return undefined;

    let frame = 0;
    const start = performance.now();

    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - (1 - progress) ** 3;
      setDisplay(Math.round(eased * value));
      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      }
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [visible, value, duration]);

  return (
    <span ref={ref} className={className}>
      {display}
    </span>
  );
}

export function LoadingPulse({ label, compact = false, className = '' }) {
  return (
    <div
      className={`app-loading${compact ? ' app-loading--compact' : ''}${
        className ? ` ${className}` : ''
      }`}
      role="status"
      aria-live="polite"
    >
      <div className="app-loading__pulse" aria-hidden="true">
        <span className="app-loading__dot" />
      </div>
      {label ? <p className="app-loading__label">{label}</p> : null}
    </div>
  );
}

export function StepIndicator({ step, total }) {
  return (
    <div className="app-step-indicator">
      <span className="app-step-tag">{String(step).padStart(2, '0')}</span>
      <span className="app-step-indicator__text">
        Step {step} of {total}
      </span>
    </div>
  );
}

export function SectionDivider({ tag }) {
  return (
    <div className="app-divider">
      {tag ? <span className="app-step-tag">{tag}</span> : null}
    </div>
  );
}
