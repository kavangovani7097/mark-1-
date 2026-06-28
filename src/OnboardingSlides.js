import { useState, useRef } from 'react';

const WINE = '#7B2D42';

const SLIDES = [
  {
    icon: 'lightning',
    headline: 'Find Players Instantly',
    subtitle: 'Real-time matching for sports.',
  },
  {
    icon: 'calendar',
    headline: 'Schedule Your Game',
    subtitle: 'Create sessions, invite friends, fill your slots.',
  },
  {
    icon: 'group',
    headline: 'Build Your Crew',
    subtitle: 'Rate players, earn badges, grow your squad.',
  },
];

function IntroIcon({ type }) {
  const svgProps = {
    className: 'intro__icon',
    fill: 'none',
    stroke: WINE,
    strokeWidth: 1.75,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
  };

  if (type === 'lightning') {
    return (
      <div className="intro__icon-wrap">
        <svg {...svgProps} width={64} height={64} viewBox="0 0 24 24">
          <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z" />
        </svg>
      </div>
    );
  }

  if (type === 'calendar') {
    return (
      <div className="intro__icon-wrap">
        <svg {...svgProps} width={64} height={64} viewBox="0 0 24 24">
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <path d="M16 2v4M8 2v4M3 10h18" />
          <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" />
        </svg>
      </div>
    );
  }

  return (
    <div className="intro__icon-wrap">
      <svg
        {...svgProps}
        className="intro__icon intro__icon--group"
        width={64}
        height={72}
        viewBox="0 0 24 26"
      >
        <circle cx="9" cy="7" r="3.25" />
        <circle cx="17" cy="8" r="2.5" />
        <path d="M3.5 21.5c0-3.3 2.7-6 5.5-6s5.5 2.7 5.5 6" />
        <path d="M14 21.5c0-2.2 1.8-4 4-4" />
      </svg>
    </div>
  );
}

function OnboardingSlides({ onComplete, onSkip }) {
  const [index, setIndex] = useState(0);
  const touchStartX = useRef(null);

  const goNext = () => {
    if (index < SLIDES.length - 1) {
      setIndex((prev) => prev + 1);
      return;
    }
    onComplete();
  };

  const goPrev = () => {
    if (index > 0) setIndex((prev) => prev - 1);
  };

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    if (touchStartX.current == null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (delta < -50) goNext();
    else if (delta > 50) goPrev();
    touchStartX.current = null;
  };

  const isLast = index === SLIDES.length - 1;

  return (
    <div
      className="intro"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <button type="button" className="intro__skip" onClick={onSkip}>
        Skip
      </button>

      <div
        className="intro__track"
        style={{ transform: `translateX(-${index * 100}%)` }}
      >
        {SLIDES.map((item) => (
          <section key={item.headline} className="intro__slide">
            <IntroIcon type={item.icon} />
            <h1 className="intro__headline">{item.headline}</h1>
            <p className="intro__subtitle">{item.subtitle}</p>
          </section>
        ))}
      </div>

      <div className="intro__footer">
        <div className="intro__dots" role="tablist" aria-label="Onboarding progress">
          {SLIDES.map((item, dotIndex) => (
            <button
              key={item.headline}
              type="button"
              role="tab"
              aria-selected={dotIndex === index}
              aria-label={`Slide ${dotIndex + 1} of ${SLIDES.length}`}
              className={`intro__dot${dotIndex === index ? ' intro__dot--active' : ''}`}
              onClick={() => setIndex(dotIndex)}
            />
          ))}
        </div>

        {isLast ? (
          <button type="button" className="login__button intro__cta" onClick={onComplete}>
            Get Started
          </button>
        ) : (
          <button type="button" className="login__button intro__cta" onClick={goNext}>
            Next
          </button>
        )}
      </div>
    </div>
  );
}

export default OnboardingSlides;
