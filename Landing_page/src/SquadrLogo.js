const SQUADR_TEAL   = '#1A3636';
const SQUADR_ORANGE = '#F95738';

const logoTextStyle = {
  color: SQUADR_TEAL,
  WebkitTextFillColor: SQUADR_TEAL,
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
          <circle cx="13" cy="6"  r="5" fill={SQUADR_ORANGE} />
          <circle cx="6"  cy="17" r="5" fill={SQUADR_TEAL} />
          <circle cx="20" cy="17" r="5" fill={SQUADR_TEAL} />
        </svg>
      </span>
      <span className="squadr-logo__text" style={logoTextStyle}>
        SQUADR
      </span>
    </div>
  );
}

export default SquadrLogo;
