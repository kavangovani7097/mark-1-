import { useEffect, useRef, useState } from 'react';
import SquadrLogo from './SquadrLogo';

const WINE = '#7B2D42';

const svgBase = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: WINE,
  strokeWidth: 1.75,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
};

function LandingIcon({ type, size = 32 }) {
  const props = { ...svgBase, width: size, height: size };

  switch (type) {
    case 'location':
      return (
        <svg {...props}>
          <path d="M12 21s7-4.35 7-11a7 7 0 1 0-14 0c0 6.65 7 11 7 11z" />
          <circle cx="12" cy="10" r="2.5" />
        </svg>
      );
    case 'lightning':
      return (
        <svg {...props}>
          <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z" />
        </svg>
      );
    case 'people':
      return (
        <svg {...props}>
          <circle cx="9" cy="7" r="3" />
          <path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
          <circle cx="17" cy="7" r="3" />
          <path d="M21 21v-2a4 4 0 0 0-3-3.87" />
        </svg>
      );
    case 'calendar':
      return (
        <svg {...props}>
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <path d="M16 2v4M8 2v4M3 10h18" />
          <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" />
        </svg>
      );
    case 'crew':
      return (
        <svg {...props}>
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1" />
        </svg>
      );
    case 'trophy':
      return (
        <svg {...props}>
          <path d="M8 21h8" />
          <path d="M12 17v4" />
          <path d="M7 4h10v5a5 5 0 0 1-10 0V4z" />
          <path d="M5 5H3v1a4 4 0 0 0 4 4" />
          <path d="M19 5h2v1a4 4 0 0 1-4 4" />
        </svg>
      );
    default:
      return null;
  }
}

function RevealSection({ children, className = '', id }) {
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
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      id={id}
      ref={ref}
      className={`landing__reveal${visible ? ' landing__reveal--visible' : ''}${className ? ` ${className}` : ''}`}
    >
      {children}
    </section>
  );
}

const HOW_IT_WORKS = [
  {
    icon: 'location',
    title: 'Set your sport and location',
  },
  {
    icon: 'lightning',
    title: 'SQUADR finds players near you instantly',
  },
  {
    icon: 'people',
    title: 'Chat, meet, and play',
  },
];

const FEATURES = [
  {
    icon: 'lightning',
    title: 'Instant Mode',
    text: 'Real-time matching. Like finding an Uber, but for sports.',
  },
  {
    icon: 'calendar',
    title: 'Scheduled Sessions',
    text: 'Plan ahead. Create sessions, set your venue, fill your slots.',
  },
  {
    icon: 'crew',
    title: 'Your Crew',
    text: 'Friends, ratings, badges. Build a squad you trust.',
  },
  {
    icon: 'trophy',
    title: 'SQUADR Pro',
    text: 'Priority matching, private sessions, and more for serious players.',
  },
];

function LandingPage({
  onGetStarted,
  termsUrl,
  privacyUrl,
  communityUrl,
}) {
  const scrollToFeatures = () => {
    document.getElementById('landing-features')?.scrollIntoView({
      behavior: 'smooth',
    });
  };

  return (
    <div className="landing">
      <section className="landing__hero">
        <div className="landing__hero-bg" aria-hidden="true" />
        <div className="landing__hero-content">
          <SquadrLogo size="large" />
          <h1 className="landing__headline">
            <span>Find your crew.</span>
            <span>Play your sport.</span>
          </h1>
          <p className="landing__subheadline">
            India&apos;s sports social app. Real-time player matching, scheduled
            sessions, and a crew that shows up.
          </p>
          <div className="landing__hero-actions">
            <button type="button" className="landing__btn landing__btn--primary" onClick={onGetStarted}>
              Get Started
            </button>
            <button
              type="button"
              className="landing__btn landing__btn--outline"
              onClick={scrollToFeatures}
            >
              See How It Works
            </button>
          </div>
        </div>
      </section>

      <RevealSection className="landing__problem">
        <blockquote className="landing__quote">
          You want to play. No one&apos;s free.
        </blockquote>
        <p className="landing__quote-sub">
          Finding players shouldn&apos;t take 47 WhatsApp messages. SQUADR fixes
          that.
        </p>
      </RevealSection>

      <RevealSection className="landing__steps">
        <h2 className="landing__section-title">Three steps to your next game</h2>
        <div className="landing__steps-grid">
          {HOW_IT_WORKS.map((step, index) => (
            <article key={step.title} className="landing__step-card">
              <span className="landing__step-num">{index + 1}</span>
              <div className="landing__step-icon">
                <LandingIcon type={step.icon} size={36} />
              </div>
              <p className="landing__step-text">{step.title}</p>
            </article>
          ))}
        </div>
      </RevealSection>

      <RevealSection className="landing__features" id="landing-features">
        <h2 className="landing__section-title">Everything you need to play more</h2>
        <div className="landing__features-grid">
          {FEATURES.map((feature) => (
            <article key={feature.title} className="landing__feature-card">
              <div className="landing__feature-icon">
                <LandingIcon type={feature.icon} size={28} />
              </div>
              <h3 className="landing__feature-title">{feature.title}</h3>
              <p className="landing__feature-text">{feature.text}</p>
            </article>
          ))}
        </div>
      </RevealSection>

      <RevealSection className="landing__cta">
        <h2 className="landing__cta-title">Ready to play?</h2>
        <p className="landing__cta-sub">Join players across India. Free to start.</p>
        <button type="button" className="landing__btn landing__btn--primary landing__btn--large" onClick={onGetStarted}>
          Get Started
        </button>
      </RevealSection>

      <footer className="landing__footer">
        <SquadrLogo size="small" />
        <div className="landing__footer-links legal-links legal-links--footer">
          <a href={termsUrl} target="_blank" rel="noopener noreferrer">
            Terms
          </a>
          {' · '}
          <a href={privacyUrl} target="_blank" rel="noopener noreferrer">
            Privacy
          </a>
          {' · '}
          <a href={communityUrl} target="_blank" rel="noopener noreferrer">
            Community
          </a>
          {' · '}
          <a
            href="https://www.instagram.com/squadr_app/"
            target="_blank"
            rel="noopener noreferrer"
          >
            @squadr_app
          </a>
        </div>
        <p className="landing__footer-copy">
          © 2026 SQUADR · Ahmedabad, India
        </p>
      </footer>
    </div>
  );
}

export default LandingPage;
