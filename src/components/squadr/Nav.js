import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import ThemeToggle from "../ThemeToggle";

const links = [
  { label: "How it works", href: "#how-it-works" },
  { label: "Features", href: "#features" },
  { label: "Pro", href: "#pro" },
];

export const Nav = ({ onGetStarted }) => {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", on);
    return () => window.removeEventListener("scroll", on);
  }, []);

  return (
    <header
      data-testid="squadr-nav"
      className={`sticky top-0 z-50 transition-all ${
        scrolled
          ? "backdrop-blur-xl bg-squadr-nav border-b-2 border-squadr-border"
          : "bg-transparent border-b-2 border-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-5 md:px-10 flex items-center justify-between h-16 md:h-20">
        <a
          href="#top"
          data-testid="nav-logo"
          className="font-display text-3xl md:text-4xl tracking-tighter text-squadr-text flex items-center gap-2"
        >
          <span className="inline-block w-3 h-3 rounded-full bg-squadr-accent squadr-pulse" />
          SQUADR
        </a>

        <nav className="hidden md:flex items-center gap-10">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              data-testid={`nav-link-${l.label.toLowerCase().replace(/\s/g, "-")}`}
              className="text-sm font-bold uppercase tracking-widest text-squadr-text relative group"
            >
              {l.label}
              <span className="absolute left-0 -bottom-1 h-0.5 w-0 bg-squadr-accent transition-all group-hover:w-full" />
            </a>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-4">
          <ThemeToggle size="sm" />
          <a
            href="#download"
            onClick={(e) => {
              if (onGetStarted) {
                e.preventDefault();
                onGetStarted();
              }
            }}
            data-testid="nav-download-button"
            className="inline-flex items-center bg-squadr-ink text-squadr-on-accent rounded-full px-6 py-3 text-sm font-bold uppercase tracking-widest hover:bg-squadr-accent transition-colors"
          >
            Get the app
          </a>
        </div>

        <div className="md:hidden flex items-center gap-3">
          <ThemeToggle size="sm" />
          <button
            data-testid="nav-mobile-toggle"
            onClick={() => setOpen((v) => !v)}
            className="bg-squadr-ink text-squadr-on-accent p-2 rounded-full"
            aria-label="Toggle menu"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {open && (
        <div
          data-testid="nav-mobile-menu"
          className="md:hidden border-t-2 border-squadr-border bg-squadr-bg px-5 py-6 flex flex-col gap-5"
        >
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="text-lg font-bold uppercase tracking-wider text-squadr-text"
            >
              {l.label}
            </a>
          ))}
          <a
            href="#download"
            onClick={(e) => {
              setOpen(false);
              if (onGetStarted) {
                e.preventDefault();
                onGetStarted();
              }
            }}
            data-testid="nav-mobile-download"
            className="bg-squadr-accent text-squadr-on-accent text-center rounded-full px-6 py-3 text-sm font-bold uppercase tracking-widest"
          >
            Get the app
          </a>
        </div>
      )}
    </header>
  );
};

export default Nav;
