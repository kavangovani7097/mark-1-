import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";

const links = [
  { label: "How it works", href: "#how-it-works" },
  { label: "Features", href: "#features" },
  { label: "Pro", href: "#pro" },
];

export const Nav = () => {
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
        scrolled ? "backdrop-blur-xl bg-[#F5F5F0]/85 border-b-2 border-[#1A3636]" : "bg-transparent border-b-2 border-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-5 md:px-10 flex items-center justify-between h-16 md:h-20">
        <a href="#top" data-testid="nav-logo" className="font-display text-3xl md:text-4xl tracking-tighter text-[#1A3636] flex items-center gap-2">
          <span className="inline-block w-3 h-3 rounded-full bg-[#F95738] squadr-pulse" />
          SQUADR
        </a>

        <nav className="hidden md:flex items-center gap-10">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              data-testid={`nav-link-${l.label.toLowerCase().replace(/\s/g, "-")}`}
              className="text-sm font-bold uppercase tracking-widest text-[#1A3636] relative group"
            >
              {l.label}
              <span className="absolute left-0 -bottom-1 h-0.5 w-0 bg-[#F95738] transition-all group-hover:w-full" />
            </a>
          ))}
        </nav>

        <a
          href="#download"
          data-testid="nav-download-button"
          className="hidden md:inline-flex items-center bg-[#1A3636] text-[#F5F5F0] rounded-full px-6 py-3 text-sm font-bold uppercase tracking-widest hover:bg-[#F95738] transition-colors"
        >
          Get the app
        </a>

        <button
          data-testid="nav-mobile-toggle"
          onClick={() => setOpen((v) => !v)}
          className="md:hidden bg-[#1A3636] text-[#F5F5F0] p-2 rounded-full"
          aria-label="Toggle menu"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {open && (
        <div data-testid="nav-mobile-menu" className="md:hidden border-t-2 border-[#1A3636] bg-[#F5F5F0] px-5 py-6 flex flex-col gap-5">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="text-lg font-bold uppercase tracking-wider"
            >
              {l.label}
            </a>
          ))}
          <a
            href="#download"
            onClick={() => setOpen(false)}
            data-testid="nav-mobile-download"
            className="bg-[#F95738] text-[#F5F5F0] text-center rounded-full px-6 py-3 text-sm font-bold uppercase tracking-widest"
          >
            Get the app
          </a>
        </div>
      )}
    </header>
  );
};

export default Nav;
