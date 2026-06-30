const SQUADR_WINE = '#7B2D42';
const SQUADR_WHITE = '#FFFFFF';

const logoTextStyle = {
  color: SQUADR_WHITE,
  WebkitTextFillColor: SQUADR_WHITE,
  background: 'none',
  backgroundImage: 'none',
  mixBlendMode: 'normal',
  opacity: 1,
  textShadow: 'none',
};

function SquadrLogo({ size = 'large', className = '', markAnimated = size === 'small' }) {
  return (
    <div
      className={`squadr-logo squadr-logo--${size}${className ? ` ${className}` : ''}`}
      role="img"
      aria-label="Squadr"
    >
      <span
        className={`squadr-logo__mark-wrap squadr-logo__mark-wrap--breathe${
          markAnimated ? ' squadr-logo__mark-wrap--orbit' : ''
        }`}
      >
        <svg
          className="squadr-logo__mark"
          viewBox="0 0 26 24"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
          shapeRendering="geometricPrecision"
        >
          <circle cx="13" cy="6" r="5" fill={SQUADR_WINE} />
          <circle cx="6" cy="17" r="5" fill={SQUADR_WINE} />
          <circle cx="20" cy="17" r="5" fill={SQUADR_WINE} />
        </svg>
      </span>
      <span className="squadr-logo__text" style={logoTextStyle}>
        SQUADR
      </span>
    </div>
  );
}

export default SquadrLogo;
