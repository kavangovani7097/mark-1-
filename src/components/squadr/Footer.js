const InstagramIcon = (props) => (
  <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
  </svg>
);
const TwitterIcon = (props) => (
  <svg {...props} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);
const YoutubeIcon = (props) => (
  <svg {...props} viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.53 3.5 12 3.5 12 3.5s-7.53 0-9.38.55a3.02 3.02 0 0 0-2.12 2.14C0 8.04 0 12 0 12s0 3.96.5 5.81a3.02 3.02 0 0 0 2.12 2.14C4.47 20.5 12 20.5 12 20.5s7.53 0 9.38-.55a3.02 3.02 0 0 0 2.12-2.14C24 15.96 24 12 24 12s0-3.96-.5-5.81zM9.75 15.5V8.5l6.5 3.5-6.5 3.5z" />
  </svg>
);

export const Footer = ({ termsUrl, privacyUrl, communityUrl }) => (
  <footer
    data-testid="footer"
    className="relative bg-squadr-bg text-squadr-text pt-20 pb-6 overflow-hidden border-t-2 border-squadr-border"
  >
    <div className="max-w-7xl mx-auto px-5 md:px-10">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-10 mb-16">
        <div className="col-span-2 md:col-span-2 max-w-sm">
          <div className="font-display text-4xl mb-4 tracking-tighter flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-squadr-accent" /> SQUADR
          </div>
          <p className="text-squadr-secondary text-sm mb-6">
            Find players nearby for any sport, instantly. Built in India, for the players who show up.
          </p>
          <div className="flex gap-3">
            {[InstagramIcon, TwitterIcon, YoutubeIcon].map((Icon, i) => (
              <a
                key={i}
                href="#top"
                data-testid={`footer-social-${i}`}
                className="w-10 h-10 rounded-full border-2 border-squadr-border flex items-center justify-center hover:bg-squadr-accent hover:text-squadr-on-accent hover:border-squadr-accent transition-colors"
                aria-label="social"
              >
                <Icon width={16} height={16} />
              </a>
            ))}
          </div>
        </div>

        <FooterCol
          title="Product"
          items={[
            { label: "Matchmaking", href: "#features" },
            { label: "Sessions", href: "#features" },
            { label: "Pro", href: "#pro" },
            { label: "Install", href: "#download" },
          ]}
        />
        <FooterCol
          title="Company"
          items={[
            { label: "About", href: "#top" },
            { label: "Careers", href: "#top" },
            { label: "Press", href: "#top" },
            { label: "Contact", href: "#top" },
          ]}
        />
        <FooterCol
          title="Legal"
          items={[
            { label: "Privacy", href: privacyUrl, external: true },
            { label: "Terms", href: termsUrl, external: true },
            { label: "Refunds", href: "#top" },
            { label: "Community", href: communityUrl, external: true },
          ]}
        />
      </div>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-t-2 border-squadr-border pt-6 text-xs font-bold tracking-[0.24em] uppercase text-squadr-muted">
        <div>© {new Date().getFullYear()} SQUADR India Pvt. Ltd.</div>
        <div />
      </div>
    </div>

    <div aria-hidden="true" className="mt-14 md:mt-20 overflow-hidden select-none">
      <div
        className="font-display uppercase leading-none tracking-tighter text-squadr-text text-center"
        style={{ fontSize: "clamp(4rem, 24vw, 24rem)" }}
      >
        SQUADR<span className="text-squadr-accent">.</span>
      </div>
    </div>
  </footer>
);

const FooterCol = ({ title, items }) => (
  <div>
    <div className="text-xs font-bold tracking-[0.28em] uppercase text-squadr-muted mb-4">{title}</div>
    <ul className="flex flex-col gap-3">
      {items.map((item) => {
        const label = typeof item === "string" ? item : item.label;
        const href = typeof item === "string" ? "#" : item.href;
        const external = typeof item === "string" ? false : item.external;
        return (
          <li key={label}>
            <a
              href={href}
              target={external ? "_blank" : undefined}
              rel={external ? "noopener noreferrer" : undefined}
              className="text-sm text-squadr-text hover:text-squadr-accent transition-colors"
            >
              {label}
            </a>
          </li>
        );
      })}
    </ul>
  </div>
);

export default Footer;
