const SQUADR_WINE = '#7B2D42';
const SQUADR_WHITE = '#FFFFFF';

function SplashScreen({ exiting = false }) {
  return (
    <div
      className={`splash${exiting ? ' splash--exit' : ''}`}
      role="presentation"
      aria-hidden="true"
    >
      <div className="splash__content">
        <svg
          className="splash__mark"
          viewBox="0 0 26 24"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
          shapeRendering="geometricPrecision"
        >
          <circle className="splash__dot splash__dot--1" cx="13" cy="6" r="5" fill={SQUADR_WINE} />
          <circle className="splash__dot splash__dot--2" cx="6" cy="17" r="5" fill={SQUADR_WINE} />
          <circle className="splash__dot splash__dot--3" cx="20" cy="17" r="5" fill={SQUADR_WINE} />
        </svg>
        <span className="splash__text" style={{ color: SQUADR_WHITE }}>
          SQUADR
        </span>
      </div>
    </div>
  );
}

export default SplashScreen;
