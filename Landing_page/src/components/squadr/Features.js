import { Radar, Calendar, IdCard, Smartphone, Crown, Users2 } from "lucide-react";

const featureBase = "relative border-2 border-[#1A3636] rounded-2xl p-6 md:p-8 overflow-hidden group transition-all brutal-shadow bg-[#F5F5F0]";

const InstantCard = () => (
  <article data-testid="feature-instant" className={`${featureBase} md:col-span-2 md:row-span-2 min-h-[380px]`}>
    <div className="flex items-center gap-2 mb-5">
      <Radar size={18} className="text-[#F95738]" />
      <span className="text-xs font-bold tracking-[0.28em] uppercase text-[#1A3636]/60">01 · Matchmaking</span>
    </div>
    <h3 className="font-display uppercase text-3xl md:text-5xl leading-[0.95] tracking-tighter text-[#1A3636] mb-4">
      Instant <br />match, <br /><span className="text-[#F95738]">nearby.</span>
    </h3>
    <p className="text-[#1A3636]/70 max-w-sm mb-8">
      Geofenced radius from 5 to 40 km. Skill-tiered. Sport-specific. You&apos;re not swiping you&apos;re
      playing.
    </p>

    {/* Radar / map graphic */}
    <div className="relative mx-auto mt-4 w-full max-w-sm aspect-square">
      <div className="absolute inset-0 rounded-full border-2 border-[#1A3636]/30" />
      <div className="absolute inset-6 rounded-full border-2 border-[#1A3636]/30" />
      <div className="absolute inset-12 rounded-full border-2 border-[#1A3636]/30" />
      <div className="absolute inset-20 rounded-full border-2 border-[#F95738]" />
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-[#F95738] squadr-pulse" />
      {/* dots */}
      <span className="absolute top-8 left-16 w-3 h-3 rounded-full bg-[#1A3636]" />
      <span className="absolute top-1/3 right-8 w-3 h-3 rounded-full bg-[#1A3636]" />
      <span className="absolute bottom-10 left-1/3 w-3 h-3 rounded-full bg-[#1A3636]" />
      <span className="absolute bottom-6 right-14 w-3 h-3 rounded-full bg-[#F95738]" />
      {/* sweep line */}
      <div className="absolute inset-0 overflow-hidden rounded-full">
        <div className="absolute top-1/2 left-0 h-[2px] w-full bg-gradient-to-r from-transparent via-[#F95738] to-transparent squadr-sweep" />
      </div>
    </div>
  </article>
);

const ScheduledCard = () => (
  <article data-testid="feature-scheduled" className={`${featureBase} md:col-span-2 min-h-[240px]`}>
    <div className="flex items-center gap-2 mb-4">
      <Calendar size={18} className="text-[#F95738]" />
      <span className="text-xs font-bold tracking-[0.28em] uppercase text-[#1A3636]/60">02 · Sessions</span>
    </div>
    <h3 className="font-display uppercase text-2xl md:text-4xl leading-tight tracking-tighter text-[#1A3636] mb-3">
      Scheduled sessions.
    </h3>
    <p className="text-[#1A3636]/70 mb-6 max-w-lg">Create a game, invite your friends, and open the empty slots to nearby players.</p>
    <div className="grid grid-cols-5 gap-2">
      {["MON", "TUE", "WED", "THU", "FRI"].map((d, i) => (
        <div key={d} className={`text-center py-3 rounded-lg border-2 ${i === 2 ? "bg-[#F95738] text-[#F5F5F0] border-[#F95738]" : "border-[#1A3636]/20 text-[#1A3636]"}`}>
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
      <IdCard size={18} className="text-[#F95738]" />
      <span className="text-xs font-bold tracking-[0.28em] uppercase text-[#1A3636]/60">03 · Identity</span>
    </div>
    <h3 className="font-display uppercase text-2xl leading-tight tracking-tighter text-[#1A3636] mb-3">
      Your SQUADR ID.
    </h3>
    <p className="text-[#1A3636]/70 mb-5 text-sm">One tag. Share it. Build your circle.</p>
    <div className="inline-flex items-center gap-2 bg-[#1A3636] text-[#F5F5F0] rounded-full px-4 py-2 font-mono text-sm">
      <span className="text-[#F95738]">@</span>arjun.smash.09
    </div>
  </article>
);

const PWACard = () => (
  <article data-testid="feature-pwa" className={`${featureBase} min-h-[240px]`}>
    <div className="flex items-center gap-2 mb-4">
      <Smartphone size={18} className="text-[#F95738]" />
      <span className="text-xs font-bold tracking-[0.28em] uppercase text-[#1A3636]/60">04 · PWA</span>
    </div>
    <h3 className="font-display uppercase text-2xl leading-tight tracking-tighter text-[#1A3636] mb-3">
      Install &amp; play.
    </h3>
    <p className="text-[#1A3636]/70 text-sm mb-4">Works as a PWA. Add to home screen on iOS &amp; Android — no store gatekeepers.</p>
    <div className="flex gap-2">
      <span className="text-[10px] font-bold tracking-widest bg-[#F95738]/10 text-[#F95738] px-3 py-1.5 rounded-full">iOS</span>
      <span className="text-[10px] font-bold tracking-widest bg-[#1A3636]/10 text-[#1A3636] px-3 py-1.5 rounded-full">ANDROID</span>
      <span className="text-[10px] font-bold tracking-widest bg-[#1A3636]/10 text-[#1A3636] px-3 py-1.5 rounded-full">WEB</span>
    </div>
  </article>
);

const FriendsCard = () => (
  <article data-testid="feature-friends" className={`${featureBase} min-h-[240px]`}>
    <div className="flex items-center gap-2 mb-4">
      <Users2 size={18} className="text-[#F95738]" />
      <span className="text-xs font-bold tracking-[0.28em] uppercase text-[#1A3636]/60">05 · Friends</span>
    </div>
    <h3 className="font-display uppercase text-2xl leading-tight tracking-tighter text-[#1A3636] mb-3">
      Squads &amp; friends.
    </h3>
    <p className="text-[#1A3636]/70 text-sm mb-5">Add friends by ID. Roll into games together. Build your regular crew.</p>
    <div className="flex -space-x-3">
      {["#F95738", "#1A3636", "#F5F5F0", "#F95738", "#1A3636"].map((c, i) => (
        <div
          key={i}
          className="w-9 h-9 rounded-full border-2 border-[#1A3636] flex items-center justify-center font-display text-xs"
          style={{ background: c, color: c === "#F5F5F0" ? "#1A3636" : "#F5F5F0" }}
        >
          {["A", "R", "K", "S", "V"][i]}
        </div>
      ))}
      <div className="w-9 h-9 rounded-full border-2 border-dashed border-[#1A3636] flex items-center justify-center text-xs font-bold text-[#1A3636]">
        +
      </div>
    </div>
  </article>
);

const ProCard = () => (
  <article
    id="pro"
    data-testid="feature-pro"
    className="relative bg-[#1A3636] border-2 border-[#1A3636] text-[#F5F5F0] rounded-2xl p-6 md:p-8 overflow-hidden md:col-span-2 min-h-[240px] brutal-shadow-inverse"
  >
    <div className="absolute inset-0 squadr-noise opacity-40" />
    <div className="relative z-10 flex flex-col md:flex-row md:items-end md:justify-between gap-6 h-full">
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Crown size={18} className="text-[#F95738]" />
          <span className="text-xs font-bold tracking-[0.28em] uppercase text-[#F95738]">06 · Pro</span>
        </div>
        <h3 className="font-display uppercase text-3xl md:text-5xl leading-[0.95] tracking-tighter mb-3">
          SQUADR <span className="text-[#F95738]">Pro.</span>
        </h3>
        <p className="text-[#F5F5F0]/75 max-w-md">Priority matching. Unlimited sessions. Player insights. All for less than a coffee.</p>
      </div>
      <div className="flex flex-col items-start md:items-end gap-3">
        <div className="font-display text-5xl md:text-6xl leading-none">
          ₹149<span className="text-lg md:text-xl text-[#F5F5F0]/60">/mo</span>
        </div>
        <a
          href="#download"
          data-testid="feature-pro-cta"
          className="inline-flex items-center gap-2 bg-[#F95738] text-[#F5F5F0] rounded-full px-6 py-3 font-bold uppercase tracking-widest text-xs md:text-sm border-2 border-[#F95738] hover:bg-[#F5F5F0] hover:text-[#1A3636] hover:border-[#F5F5F0] transition-colors"
        >
          Go Pro
        </a>
      </div>
    </div>
  </article>
);

export const Features = () => (
  <section id="features" data-testid="features-section" className="relative py-24 md:py-36 bg-[#EBEBE6]">
    <div className="max-w-7xl mx-auto px-5 md:px-10">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-14 md:mb-20">
        <div>
          <div className="text-xs md:text-sm font-bold tracking-[0.28em] uppercase text-[#F95738] mb-4">
            Built to play
          </div>
          <h2 className="font-display uppercase text-[#1A3636] text-5xl md:text-7xl lg:text-8xl leading-[0.9] tracking-tighter">
            Everything <br />
            you need. <span className="text-[#F95738]">Nothing you don&apos;t.</span>
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-5 md:gap-6 auto-rows-min">
        <InstantCard />
        <ScheduledCard />
        <IdCardBox />
        <PWACard />
        <FriendsCard />
        <ProCard />
      </div>
    </div>
  </section>
);

export default Features;
