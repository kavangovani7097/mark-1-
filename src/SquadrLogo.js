function SquadrLogo({ size = 'large', className = '' }) {
  return (
    <div
      className={`squadr-logo squadr-logo--${size}${className ? ` ${className}` : ''}`}
      role="img"
      aria-label="Squadr"
    >
      <svg
        className="squadr-logo__mark"
        viewBox="0 0 26 24"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        shapeRendering="geometricPrecision"
      >
        <circle cx="13" cy="6" r="5" fill="#7B2D42" />
        <circle cx="6" cy="17" r="5" fill="#7B2D42" />
        <circle cx="20" cy="17" r="5" fill="#7B2D42" />
      </svg>
      <span className="squadr-logo__text">SQUADR</span>
    </div>
  );
}

export default SquadrLogo;
