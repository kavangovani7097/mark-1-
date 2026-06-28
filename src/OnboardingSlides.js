import { useState, useRef } from 'react';

const SLIDES = [
  {
    emoji: '⚡',
    headline: 'Find Players Instantly',
    subtitle: 'Real-time matching. Like Uber, but for sports.',
  },
  {
    emoji: '📅',
    headline: 'Schedule Your Game',
    subtitle: 'Create sessions, invite friends, fill your slots.',
  },
  {
    emoji: '🏆',
    headline: 'Build Your Crew',
    subtitle: 'Rate players, earn badges, grow your squad.',
  },
];

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
            <span className="intro__emoji" aria-hidden="true">
              {item.emoji}
            </span>
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
