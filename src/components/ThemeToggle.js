import { useTheme } from '../ThemeContext';

function ThemeToggle({ className = '', showLabel = false, size = 'md' }) {
  const { isDark, toggleTheme } = useTheme();
  const sizeClass = size === 'sm' ? 'theme-toggle--sm' : '';

  return (
    <label
      className={`theme-toggle ${sizeClass}${className ? ` ${className}` : ''}`}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {showLabel ? (
        <span className="theme-toggle__label">{isDark ? 'Dark' : 'Light'}</span>
      ) : null}
      <input
        type="checkbox"
        className="theme-toggle__input"
        checked={isDark}
        onChange={toggleTheme}
        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      />
      <span className="theme-toggle__track" aria-hidden="true">
        <span className="theme-toggle__thumb" />
      </span>
    </label>
  );
}

export default ThemeToggle;
