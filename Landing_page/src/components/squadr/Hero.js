import { useEffect, useState } from "react";
import { ArrowUpRight, MapPin, Zap } from "lucide-react";

const SPORTS = ["BADMINTON.", "TENNIS.", "PICKLEBALL.", "FOOTBALL.", "VOLLEYBALL.", "BASKETBALL.", "CRICKET.", "SWIMMING.", "SQUASH.", "GYM.", "CYCLING."];

export const Hero = () => {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % SPORTS.length), 1800);
    return () => clearInterval(t);
  }, []);

  return (
    <section
      id="top"
      data-testid="hero-section"
      className="relative min-h-[92vh] flex items-end pt-12 pb-16 md:pt-20 md:pb-24 squadr-grid-bg overflow-hidden"
    >
      {/* Geometric abstract shapes */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Spinning triangular-dot logo mark */}
        <div className="absolute top-8 right-8 md:top-20 md:right-16 w-36 h-36 md:w-64 md:h-64" style={{ animation: "squadr-spin 12s linear infinite" }}>
          <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            {/* Outer ring */}
            <circle cx="100" cy="100" r="92" stroke="#1A3636" strokeWidth="2" opacity="0.4" />
            {/* Triangle connecting lines — animated draw */}
            <line x1="100" y1="38" x2="46.3" y2="131" stroke="#F95738" strokeWidth="2"
              strokeDasharray="110" strokeDashoffset="0"
              style={{ animation: "tri-draw 2s ease-in-out infinite alternate" }} />
            <line x1="46.3" y1="131" x2="153.7" y2="131" stroke="#1A3636" strokeWidth="2"
              strokeDasharray="107" strokeDashoffset="0"
              style={{ animation: "tri-draw 2s ease-in-out 0.3s infinite alternate" }} />
            <line x1="153.7" y1="131" x2="100" y2="38" stroke="#F95738" strokeWidth="2"
              strokeDasharray="110" strokeDashoffset="0"
              style={{ animation: "tri-draw 2s ease-in-out 0.6s infinite alternate" }} />
            {/* Three dots at equilateral triangle vertices */}
            <circle cx="100" cy="38" r="16" fill="#F95738" />
            <circle cx="46.3" cy="131" r="16" fill="#1A3636" />
            <circle cx="153.7" cy="131" r="16" fill="#1A3636" />
          </svg>
        </div>
        <svg className="hidden md:block absolute bottom-20 left-4 md:left-16 w-40 md:w-64" viewBox="0 0 200 120" fill="none">
          <path d="M0 100 Q 60 20, 140 60 T 200 20" stroke="#1A3636" strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M180 10 L200 20 L188 32" stroke="#1A3636" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {/* Motion lines */}
        <div className="hidden md:block absolute top-1/2 left-0 w-40 md:w-72 h-[3px] bg-[#1A3636]/70" />
        <div className="hidden md:block absolute top-[calc(50%+16px)] left-0 w-24 md:w-48 h-[3px] bg-[#1A3636]/40" />
        <div className="hidden md:block absolute top-[calc(50%-16px)] left-0 w-16 md:w-32 h-[3px] bg-[#F95738]" />
      </div>

      <div className="relative max-w-7xl mx-auto px-5 md:px-10 w-full">

        {/* Massive headline */}
        <h1
          data-testid="hero-headline"
          className="font-display uppercase text-[#1A3636] text-[12vw] md:text-[9.5vw] lg:text-[9rem] leading-[0.88] tracking-tighter squadr-rise"
          style={{ animationDelay: "0.15s" }}
        >
          Find your <br />
          squad.<span className="text-[#F95738]">.</span> <br />
          <span className="flex items-baseline gap-3 md:gap-6">
            <span className="shrink-0">Play</span>
            {/* Sport word slot — clips vertically, never clips horizontally */}
            <span
              className="relative inline-block align-baseline"
              style={{ height: "0.9em", minWidth: "13ch", overflow: "hidden" }}
            >
              {SPORTS.map((s, i) => (
                <span
                  key={s}
                  className="absolute left-0 top-0 w-full transition-all duration-500"
                  style={{
                    transform: `translateY(${(i - idx) * 100}%)`,
                    opacity: i === idx ? 1 : 0,
                    color: "#F95738",
                  }}
                >
                  {s}
                </span>
              ))}
            </span>
          </span>
        </h1>

        {/* Subhead + CTAs */}
        <div className="mt-10 md:mt-14 flex flex-col md:flex-row md:items-end md:justify-between gap-8 squadr-rise" style={{ animationDelay: "0.35s" }}>
          <p className="max-w-xl text-base md:text-xl text-[#1A3636]/75 leading-relaxed">
            The moment before the whistle blows, that&apos;s us. SQUADR matches you with
            players within <span className="font-bold text-[#1A3636]">5–40&nbsp;km</span> for any
            sport, any time. No group chats. No excuses.
          </p>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <a
              href="#download"
              data-testid="hero-cta-primary"
              className="brutal-shadow inline-flex items-center gap-3 bg-[#F95738] text-[#F5F5F0] rounded-full pl-7 pr-3 py-3 font-bold uppercase tracking-widest text-sm md:text-base border-2 border-[#1A3636]"
            >
              Find a game
              <span className="bg-[#1A3636] text-[#F5F5F0] rounded-full p-2">
                <ArrowUpRight size={18} />
              </span>
            </a>
            <a
              href="#how-it-works"
              data-testid="hero-cta-secondary"
              className="inline-flex items-center gap-2 text-sm md:text-base font-bold uppercase tracking-widest text-[#1A3636] border-b-2 border-[#1A3636] pb-1 hover:text-[#F95738] hover:border-[#F95738] transition-colors"
            >
              How it works
            </a>
          </div>
        </div>

        {/* Bottom info strip */}
        <div className="mt-12 md:mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-10 border-t-2 border-[#1A3636] pt-6 squadr-rise" style={{ animationDelay: "0.55s" }}>
          <InfoBit icon={<Zap size={16} />} label="Match time" value="< 90s" testid="hero-info-match" />
          <InfoBit icon={<MapPin size={16} />} label="Radius" value="5–40 km" testid="hero-info-radius" />
          <InfoBit label="Pro" value="₹149/mo" testid="hero-info-pro" />
          <InfoBit label="Install as" value="PWA · iOS · Android" testid="hero-info-pwa" />
        </div>
      </div>
    </section>
  );
};

const InfoBit = ({ icon, label, value, testid }) => (
  <div data-testid={testid} className="flex flex-col gap-1">
    <div className="flex items-center gap-2 text-[10px] md:text-xs font-bold tracking-[0.2em] uppercase text-[#1A3636]/60">
      {icon}
      {label}
    </div>
    <div className="font-display text-base md:text-2xl leading-tight tracking-tight">{value}</div>
  </div>
);

export default Hero;
