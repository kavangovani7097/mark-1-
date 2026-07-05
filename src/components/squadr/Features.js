import { Radar, Calendar, IdCard, Smartphone, Crown, Users2 } from "lucide-react";

const featureBase =
  "relative border-2 border-squadr-border rounded-2xl p-6 md:p-8 overflow-hidden group transition-all brutal-shadow bg-squadr-bg";

const InstantCard = () => (
  <article data-testid="feature-instant" className={`${featureBase} md:col-span-2 md:row-span-2 min-h-[380px]`}>
    <div className="flex items-center gap-2 mb-5">
      <Radar size={18} className="text-squadr-accent" />
      <span className="text-xs font-bold tracking-[0.28em] uppercase text-squadr-muted">01 · Matchmaking</span>
    </div>
    <h3 className="font-display uppercase text-3xl md:text-5xl leading-[0.95] tracking-tighter text-squadr-text mb-4">
      Instant <br />match, <br /><span className="text-squadr-accent">nearby.</span>
    </h3>
    <p className="text-squadr-secondary max-w-sm mb-8">
      Geofenced radius from 5 to 40 km. Skill-tiered. Sport-specific. You&apos;re not swiping you&apos;re
      playing.
    </p>

    <div className="relative mx-auto mt-4 w-full max-w-sm aspect-square">
      <div className="absolute inset-0 rounded-full border-2 border-squadr-border/30" />
      <div className="absolute inset-6 rounded-full border-2 border-squadr-border/30" />
      <div className="absolute inset-12 rounded-full border-2 border-squadr-border/30" />
      <div className="absolute inset-20 rounded-full border-2 border-squadr-accent" />
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-squadr-accent squadr-pulse" />
      <span className="absolute top-8 left-16 w-3 h-3 rounded-full bg-squadr-ink" />
      <span className="absolute top-1/3 right-8 w-3 h-3 rounded-full bg-squadr-ink" />
      <span className="absolute bottom-10 left-1/3 w-3 h-3 rounded-full bg-squadr-ink" />
      <span className="absolute bottom-6 right-14 w-3 h-3 rounded-full bg-squadr-accent" />
      <div className="absolute inset-0 overflow-hidden rounded-full">
        <div className="absolute top-1/2 left-0 h-[2px] w-full bg-gradient-to-r from-transparent via-[var(--squadr-accent)] to-transparent squadr-sweep" />
      </div>
    </div>
  </article>
);

const ScheduledCard = () => (
  <article data-testid="feature-scheduled" className={`${featureBase} md:col-span-2 min-h-[240px]`}>
    <div className="flex items-center gap-2 mb-4">
      <Calendar size={18} className="text-squadr-accent" />
      <span className="text-xs font-bold tracking-[0.28em] uppercase text-squadr-muted">02 · Sessions</span>
    </div>
    <h3 className="font-display uppercase text-2xl md:text-4xl leading-tight tracking-tighter text-squadr-text mb-3">
      Scheduled sessions.
    </h3>
    <p className="text-squadr-secondary mb-6 max-w-lg">
      Create a game, invite your friends, and open the empty slots to nearby players.
    </p>
    <div className="grid grid-cols-5 gap-2">
      {["MON", "TUE", "WED", "THU", "FRI"].map((d, i) => (
        <div
          key={d}
          className={`text-center py-3 rounded-lg border-2 ${
            i === 2
              ? "bg-squadr-accent text-squadr-on-accent border-squadr-accent"
              : "border-squadr-border/20 text-squadr-text"
          }`}
        >
          <div className="text-[10px] font-bold tracking-widest">{d}</div>
          <div className="font-display text-lg leading-none mt-1">{18 + i}</div>
        </div>
      ))}
    </div>
  </article>
);

const IdCardBox = () => (
  <article data-testid="feature-id" className={`${featureBase} min-h-[240px]`}>
    <div className="flex items-center gap-2 mb-4">
      <IdCard size={18} className="text-squadr-accent" />
      <span className="text-xs font-bold tracking-[0.28em] uppercase text-squadr-muted">03 · Identity</span>
    </div>
    <h3 className="font-display uppercase text-2xl leading-tight tracking-tighter text-squadr-text mb-3">
      Your SQUADR ID.
    </h3>
    <p className="text-squadr-secondary mb-5 text-sm">One tag. Share it. Build your circle.</p>
    <div className="inline-flex items-center gap-2 bg-squadr-ink text-squadr-on-accent rounded-full px-4 py-2 font-mono text-sm">
      <span className="text-squadr-accent">@</span>arjun.smash.09
    </div>
  </article>
);

const PWACard = () => (
  <article data-testid="feature-pwa" className={`${featureBase} min-h-[240px]`}>
    <div className="flex items-center gap-2 mb-4">
      <Smartphone size={18} className="text-squadr-accent" />
      <span className="text-xs font-bold tracking-[0.28em] uppercase text-squadr-muted">04 · PWA</span>
    </div>
    <h3 className="font-display uppercase text-2xl leading-tight tracking-tighter text-squadr-text mb-3">
      Install &amp; play.
    </h3>
    <p className="text-squadr-secondary text-sm mb-4">
      Works as a PWA. Add to home screen on iOS &amp; Android — no store gatekeepers.
    </p>
    <div className="flex gap-2">
      <span className="text-[10px] font-bold tracking-widest bg-squadr-accent/10 text-squadr-accent px-3 py-1.5 rounded-full">
        iOS
      </span>
      <span className="text-[10px] font-bold tracking-widest bg-squadr-ink/10 text-squadr-text px-3 py-1.5 rounded-full">
        ANDROID
      </span>
      <span className="text-[10px] font-bold tracking-widest bg-squadr-ink/10 text-squadr-text px-3 py-1.5 rounded-full">
        WEB
      </span>
    </div>
  </article>
);

const AVATAR_STYLES = [
  { bg: "var(--squadr-accent)", fg: "var(--squadr-on-accent)" },
  { bg: "var(--squadr-ink)", fg: "var(--squadr-on-accent)" },
  { bg: "var(--squadr-bg)", fg: "var(--squadr-text)" },
  { bg: "var(--squadr-accent)", fg: "var(--squadr-on-accent)" },
  { bg: "var(--squadr-ink)", fg: "var(--squadr-on-accent)" },
];

const FriendsCard = () => (
  <article data-testid="feature-friends" className={`${featureBase} min-h-[240px]`}>
    <div className="flex items-center gap-2 mb-4">
      <Users2 size={18} className="text-squadr-accent" />
      <span className="text-xs font-bold tracking-[0.28em] uppercase text-squadr-muted">05 · Friends</span>
    </div>
    <h3 className="font-display uppercase text-2xl leading-tight tracking-tighter text-squadr-text mb-3">
      Squads &amp; friends.
    </h3>
    <p className="text-squadr-secondary text-sm mb-5">
      Add friends by ID. Roll into games together. Build your regular crew.
    </p>
    <div className="flex -space-x-3">
      {AVATAR_STYLES.map((style, i) => (
        <div
          key={i}
          className="w-9 h-9 rounded-full border-2 border-squadr-border flex items-center justify-center font-display text-xs"
          style={{ background: style.bg, color: style.fg }}
        >
          {["A", "R", "K", "S", "V"][i]}
        </div>
      ))}
      <div className="w-9 h-9 rounded-full border-2 border-dashed border-squadr-border flex items-center justify-center text-xs font-bold text-squadr-text">
        +
      </div>
    </div>
  </article>
);

const ProCard = ({ onGetStarted }) => (
  <article
    id="pro"
    data-testid="feature-pro"
    className="relative bg-squadr-ink border-2 border-squadr-border text-squadr-on-accent rounded-2xl p-6 md:p-8 overflow-hidden md:col-span-2 min-h-[240px] brutal-shadow-inverse"
  >
    <div className="absolute inset-0 squadr-noise opacity-40" />
    <div className="relative z-10 flex flex-col md:flex-row md:items-end md:justify-between gap-6 h-full">
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Crown size={18} className="text-squadr-accent" />
          <span className="text-xs font-bold tracking-[0.28em] uppercase text-squadr-accent">06 · Pro</span>
        </div>
        <h3 className="font-display uppercase text-3xl md:text-5xl leading-[0.95] tracking-tighter mb-3">
          SQUADR <span className="text-squadr-accent">Pro.</span>
        </h3>
        <p className="opacity-75 max-w-md">
          Priority matching. Unlimited sessions. Player insights. All for less than a coffee.
        </p>
      </div>
      <div className="flex flex-col items-start md:items-end gap-3">
        <div className="font-display text-5xl md:text-6xl leading-none">
          ₹149<span className="text-lg md:text-xl opacity-60">/mo</span>
        </div>
        <a
          href="#download"
          onClick={(e) => {
            if (onGetStarted) {
              e.preventDefault();
              onGetStarted();
            }
          }}
          data-testid="feature-pro-cta"
          className="inline-flex items-center gap-2 bg-squadr-accent text-squadr-on-accent rounded-full px-6 py-3 font-bold uppercase tracking-widest text-xs md:text-sm border-2 border-squadr-accent hover:bg-squadr-on-accent hover:text-squadr-ink hover:border-squadr-on-accent transition-colors"
        >
          Go Pro
        </a>
      </div>
    </div>
  </article>
);

export const Features = ({ onGetStarted }) => (
  <section id="features" data-testid="features-section" className="relative py-24 md:py-36 bg-squadr-band">
    <div className="max-w-7xl mx-auto px-5 md:px-10">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-14 md:mb-20">
        <div>
          <div className="text-xs md:text-sm font-bold tracking-[0.28em] uppercase text-squadr-accent mb-4">
            Built to play
          </div>
          <h2 className="font-display uppercase text-squadr-text text-5xl md:text-7xl lg:text-8xl leading-[0.9] tracking-tighter">
            Everything <br />
            you need. <span className="text-squadr-accent">Nothing you don&apos;t.</span>
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-5 md:gap-6 auto-rows-min">
        <InstantCard />
        <ScheduledCard />
        <IdCardBox />
        <PWACard />
        <FriendsCard />
        <ProCard onGetStarted={onGetStarted} />
      </div>
    </div>
  </section>
);

export default Features;
