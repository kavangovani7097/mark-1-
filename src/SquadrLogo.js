import { useContext } from 'react';
import { ThemeContext } from './ThemeContext';

const THEMES = {
  dark: { text: '#F5F5F0', dot: '#F95738' },
  light: { text: '#1A3636', dot: '#F95738' },
};

function SquadrLogo({
  size = 'large',
  className = '',
  theme: themeProp,
}) {
  const themeCtx = useContext(ThemeContext);
  const themeKey = themeProp || (themeCtx?.isDark ? 'dark' : 'light');
  const currentTheme = THEMES[themeKey] || THEMES.light;

  const logoTextStyle = {
    color: currentTheme.text,
    WebkitTextFillColor: currentTheme.text,
    background: 'none',
    backgroundImage: 'none',
    mixBlendMode: 'normal',
    opacity: 1,
    textShadow: 'none',
  };

  return (
    <div
      className={`squadr-logo squadr-logo--${size}${className ? ` ${className}` : ''}`}
      role="img"
      aria-label="Squadr"
    >
      <span className="squadr-logo__mark-wrap squadr-logo__mark-wrap--breathe">
        <svg
          className="squadr-logo__mark"
          viewBox="0 0 26 24"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
          shapeRendering="geometricPrecision"
        >
          <circle cx="13" cy="6" r="5" fill={currentTheme.dot} />
          <circle cx="6" cy="17" r="5" fill={currentTheme.dot} />
          <circle cx="20" cy="17" r="5" fill={currentTheme.dot} />
        </svg>
      </span>
      <span className="squadr-logo__text" style={logoTextStyle}>
        SQUADR
      </span>
    </div>
  );
}

export default SquadrLogo;
