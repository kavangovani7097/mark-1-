import { useCallback, useEffect, useRef, useState } from 'react';

const WINE = '#7B2D42';

const ORBIT = { cx: 210, cy: 210, r: 168, dotR: 8 };
const ORBIT_ANGLES = [90, 210, 330];

function orbitPoint(degrees) {
  const rad = (degrees * Math.PI) / 180;
  return {
    x: ORBIT.cx + ORBIT.r * Math.cos(rad),
    y: ORBIT.cy - ORBIT.r * Math.sin(rad),
  };
}

const STEPS = [
  {
    target: 1,
    title: 'Set your sport and location',
    description:
      'Tell SQUADR what you play and where you are — current GPS or a venue you choose.',
  },
  {
    target: 2,
    title: 'Players appear near you',
    description:
      'Instant matching scans your radius in real time. No group chats, no waiting.',
  },
  {
    target: 3,
    title: 'Chat, meet, and play',
    description:
      'Lock in your crew, coordinate in the app, and get on court together.',
  },
];

const FEATURES = [
  {
    id: 'instant',
    tag: '01',
    title: 'Instant Mode',
    description:
      'Real-time matching. Players near you, ready to play right now.',
    icon: 'lightning',
  },
  {
    id: 'sessions',
    tag: '02',
    title: 'Scheduled Sessions',
    description: 'Plan ahead. Create sessions, set your venue, fill your slots.',
    icon: 'calendar',
  },
  {
    id: 'crew',
    tag: '03',
    title: 'Your Crew',
    description: 'Friends, ratings, badges. Build a squad you trust.',
    icon: 'crew',
  },
  {
    id: 'pro',
    tag: '04',
    title: 'SQUADR Pro',
    description: 'Priority matching, private sessions, and more for serious players.',
    icon: 'trophy',
  },
];

const iconProps = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: WINE,
  strokeWidth: 1,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
};

function FeatureIcon({ type, size = 28 }) {
  const props = { ...iconProps, width: size, height: size };

  switch (type) {
    case 'lightning':
      return (
        <svg {...props}>
          <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z" />
        </svg>
      );
    case 'calendar':
      return (
        <svg {...props}>
          <rect x="3" y="4" width="18" height="18" rx="1" />
          <path d="M16 2v4M8 2v4M3 10h18" />
        </svg>
      );
    case 'crew':
      return (
        <svg {...props}>
          <circle cx="9" cy="7" r="3" />
          <path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
          <circle cx="17" cy="7" r="3" />
          <path d="M21 21v-2a4 4 0 0 0-3-3.87" />
        </svg>
      );
    case 'trophy':
      return (
        <svg {...props}>
          <path d="M8 21h8M12 17v4" />
          <path d="M7 4h10v5a5 5 0 0 1-10 0V4z" />
          <path d="M5 5H3v1a4 4 0 0 0 4 4M19 5h2v1a4 4 0 0 1-4 4" />
        </svg>
      );
    default:
      return null;
  }
}

function SquadrDots({ size = 26 }) {
  return (
    <svg
      width={size}
      height={size * (24 / 26)}
      viewBox="0 0 26 24"
      aria-hidden="true"
    >
      <circle cx="13" cy="6" r="5" fill={WINE} />
      <circle cx="6" cy="17" r="5" fill={WINE} />
      <circle cx="20" cy="17" r="5" fill={WINE} />
    </svg>
  );
}

function HeroOrbit() {
  const points = ORBIT_ANGLES.map(orbitPoint);
  const connectors = [
    `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`,
    `M ${points[1].x} ${points[1].y} L ${points[2].x} ${points[2].y}`,
    `M ${points[2].x} ${points[2].y} L ${points[0].x} ${points[0].y}`,
  ];

  return (
    <div className="landing-orbit" aria-hidden="true">
      <svg className="landing-orbit__svg" viewBox="0 0 420 420">
        <g className="landing-orbit__spin">
          <circle
            className="landing-orbit__ring"
            cx={ORBIT.cx}
            cy={ORBIT.cy}
            r={ORBIT.r}
            fill="none"
            stroke="rgba(255,255,255,0.12)"
            strokeWidth="1"
          />
          {connectors.map((d, index) => (
            <path
              key={d}
              className={`landing-orbit__connector landing-orbit__connector--${String.fromCharCode(97 + index)}`}
              d={d}
              fill="none"
              stroke={WINE}
              strokeWidth="1"
              strokeDasharray="4 6"
              opacity="0.55"
            />
          ))}
          {points.map((point, index) => (
            <circle
              key={ORBIT_ANGLES[index]}
              cx={point.x}
              cy={point.y}
              r={ORBIT.dotR}
              fill={WINE}
            />
          ))}
        </g>
      </svg>
    </div>
  );
}

function HeroWordmark() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setReady(true), 80);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <h1 className="landing-hero__wordmark" aria-label="SQUADR">
      {'SQUADR'.split('').map((letter, index) => (
        <span
          key={`${letter}-${index}`}
          className={`landing-hero__letter${ready ? ' landing-hero__letter--in' : ''}`}
          style={{ transitionDelay: `${index * 30}ms` }}
        >
          {letter}
        </span>
      ))}
    </h1>
  );
}

function useReveal(threshold = 0.12) {
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
      { threshold, rootMargin: '0px 0px -8% 0px' }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, visible };
}

function RevealSection({ children, className = '', id, as: Tag = 'section' }) {
  const { ref, visible } = useReveal();

  return (
    <Tag
      id={id}
      ref={ref}
      className={`landing-section${visible ? ' landing-section--visible' : ''}${className ? ` ${className}` : ''}`}
    >
      {children}
    </Tag>
  );
}

function RevealItem({ index, children, className = '' }) {
  return (
    <div
      className={`landing-reveal-item${className ? ` ${className}` : ''}`}
      style={{ '--reveal-index': index }}
    >
      {children}
    </div>
  );
}

function SectionHeader({ eyebrow, title, lead, align = 'left', id }) {
  return (
    <header
      id={id}
      className={`landing-section-header landing-section-header--${align}`}
    >
      {eyebrow ? <p className="landing-section-eyebrow">{eyebrow}</p> : null}
      {title ? <h2 className="landing-section-title">{title}</h2> : null}
      {lead ? <p className="landing-section-lead">{lead}</p> : null}
    </header>
  );
}

function CountUpNumber({ target, active }) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!active) return undefined;

    let frame = 0;
    const duration = 900;
    const start = performance.now();

    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - (1 - progress) ** 3;
      setValue(Math.round(eased * target));
      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      }
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [active, target]);

  return (
    <span className="landing-process__number" aria-hidden="true">
      {String(value).padStart(2, '0')}
    </span>
  );
}

function LandingPage({
  onGetStarted,
  termsUrl,
  privacyUrl,
  communityUrl,
}) {
  const heroRef = useRef(null);
  const [parallax, setParallax] = useState({ eyebrow: 0, wordmark: 0 });
  const processReveal = useReveal(0.2);

  const scrollToProcess = useCallback(() => {
    document.getElementById('landing-process')?.scrollIntoView({
      behavior: 'smooth',
    });
  }, []);

  useEffect(() => {
    let raf = 0;

    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const hero = heroRef.current;
        if (!hero) return;

        const rect = hero.getBoundingClientRect();
        const progress = Math.min(1, Math.max(0, -rect.top / Math.max(rect.height, 1)));

        setParallax({
          eyebrow: progress * 48,
          wordmark: progress * 24,
        });
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className="landing">
      <header className="landing-nav">
        <div className="landing__inner landing-nav__inner">
          <div className="landing-nav__brand">
            <SquadrDots size={20} />
            <span className="landing-nav__name">SQUADR</span>
          </div>
          <button type="button" className="landing-btn landing-btn--primary landing-btn--sm" onClick={onGetStarted}>
            Get Started
          </button>
        </div>
      </header>

      <section className="landing-hero" ref={heroRef}>
        <div className="landing__inner landing-hero__grid">
          <div className="landing-hero__copy">
            <div className="landing-hero__copy-stack">
              <p
                className="landing-section-eyebrow landing-hero__eyebrow"
                style={{ transform: `translateY(${parallax.eyebrow}px)` }}
              >
                PLAY · CONNECT · REPEAT
              </p>
              <div
                className="landing-hero__wordmark-wrap"
                style={{ transform: `translateY(${parallax.wordmark}px)` }}
              >
                <HeroWordmark />
              </div>
              <p className="landing-hero__sub">
                Find your crew. Play your sport.
              </p>
              <div className="landing-hero__actions">
                <button type="button" className="landing-btn landing-btn--primary" onClick={onGetStarted}>
                  Get Started
                </button>
                <button type="button" className="landing-btn landing-btn--ghost" onClick={scrollToProcess}>
                  How it works
                </button>
              </div>
            </div>
          </div>

          <div className="landing-hero__visual">
            <HeroOrbit />
          </div>
        </div>
      </section>

      <RevealSection className="landing-problem">
        <div className="landing__inner">
          <SectionHeader
            eyebrow="The challenge"
            title="Ready to play. No one's around."
            lead="Finding players shouldn't be harder than playing the game. SQUADR makes it effortless."
          />
        </div>
      </RevealSection>

      <section
        id="landing-process"
        ref={processReveal.ref}
        className={`landing-section landing-process${processReveal.visible ? ' landing-section--visible' : ''}`}
      >
        <div className="landing__inner">
          <SectionHeader
            eyebrow="How it works"
            title="Three steps to your next game"
            lead="From open app to on-court — built for players who actually show up."
          />

          <ol className="landing-process__list">
            {STEPS.map((step, index) => (
              <li key={step.title} className="landing-process__item">
                <CountUpNumber target={step.target} active={processReveal.visible} />
                <RevealItem index={index} className="landing-process__content">
                  <h3 className="landing-process__title">{step.title}</h3>
                  <p className="landing-process__desc">{step.description}</p>
                </RevealItem>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <RevealSection className="landing-features" id="landing-features">
        <div className="landing__inner">
          <SectionHeader
            eyebrow="Capabilities"
            title="Everything you need to play"
            lead="Instant matching, scheduled sessions, your crew, and Pro — one app, one squad."
          />

          <div className="landing-features__grid">
            {FEATURES.map((feature, index) => (
              <RevealItem
                key={feature.id}
                index={index}
                className="landing-features__card"
              >
                <span className="landing-features__tag">{feature.tag}</span>
                <div className="landing-features__icon">
                  <FeatureIcon type={feature.icon} size={24} />
                </div>
                <h3 className="landing-features__title">{feature.title}</h3>
                <p className="landing-features__desc">{feature.description}</p>
              </RevealItem>
            ))}
          </div>
        </div>
      </RevealSection>

      <RevealSection className="landing-cta" as="section">
        <div className="landing__inner landing-cta__inner">
          <SectionHeader
            eyebrow="Join SQUADR"
            title="Ready to play?"
            lead="Your next game is one tap away."
            align="center"
          />
          <RevealItem index={1}>
            <button type="button" className="landing-btn landing-btn--primary landing-btn--cta" onClick={onGetStarted}>
              Get Started
            </button>
          </RevealItem>
        </div>
      </RevealSection>

      <footer className="landing-footer">
        <div className="landing__inner landing-footer__inner">
          <SquadrDots size={22} />
          <nav className="landing-footer__links legal-links legal-links--footer" aria-label="Legal">
            <a href={termsUrl} target="_blank" rel="noopener noreferrer">
              Terms
            </a>
            <span aria-hidden="true"> · </span>
            <a href={privacyUrl} target="_blank" rel="noopener noreferrer">
              Privacy
            </a>
            <span aria-hidden="true"> · </span>
            <a href={communityUrl} target="_blank" rel="noopener noreferrer">
              Community
            </a>
            <span aria-hidden="true"> · </span>
            <a
              href="https://www.instagram.com/squadr_app/"
              target="_blank"
              rel="noopener noreferrer"
            >
              @squadr_app
            </a>
          </nav>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
