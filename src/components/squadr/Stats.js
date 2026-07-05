import { useEffect, useRef, useState } from "react";

const stats = [
  { value: 50000, suffix: "+", label: "Matches Played", testid: "stat-matches" },
  { value: 120, suffix: "", label: "Indian Cities", testid: "stat-cities" },
  { value: 1000000, suffix: "+", label: "Players Squadded", short: "1M", testid: "stat-players" },
  { value: 90, suffix: "s", label: "Avg. match time", testid: "stat-time" },
];

const format = (n) => {
  if (n >= 999500) {
    const v = Math.round(n / 100000) / 10;
    return `${v % 1 === 0 ? v.toFixed(0) : v}M`;
  }
  if (n >= 1000) return `${Math.round(n / 1000)}K`;
  return `${n}`;
};

const Counter = ({ to, suffix }) => {
  const [v, setV] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        const start = performance.now();
        const dur = 1600;
        const step = (t) => {
          const p = Math.min(1, (t - start) / dur);
          const eased = 1 - Math.pow(1 - p, 3);
          setV(Math.round(to * eased));
          if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
        io.disconnect();
      },
      { threshold: 0.4 }
    );
    if (ref.current) io.observe(ref.current);
    return () => io.disconnect();
  }, [to]);
  return (
    <span ref={ref} className="font-display text-5xl md:text-6xl lg:text-7xl leading-none tracking-tighter text-[#F95738]">
      {format(v)}
      <span className="text-[#F5F5F0]">{suffix}</span>
    </span>
  );
};

const TESTIMONIALS = [
  { q: "Found a badminton doubles pair in Koramangala within 4 minutes. Court booked. Sweaty. Repeat.", n: "Priya M.", a: "P", city: "Bengaluru", sport: "Badminton" },
  { q: "Turned my Sunday cricket group from a WhatsApp mess into an actual roster. Slots fill themselves.", n: "Rohan S.", a: "R", city: "Mumbai", sport: "Cricket" },
  { q: "Moved to Pune. Zero contacts. SQUADR gave me a tennis crew in three matches.", n: "Karan V.", a: "K", city: "Pune", sport: "Tennis" },
];

export const Stats = () => (
  <section
    data-testid="stats-section"
    className="relative bg-[#1A3636] text-[#F5F5F0] py-24 md:py-36 overflow-hidden border-y-2 border-[#1A3636]"
  >
    <div className="absolute inset-0 squadr-noise opacity-30" />
    <div className="absolute top-10 right-10 w-40 h-40 md:w-64 md:h-64 rounded-full border-2 border-[#F95738]/30" />
    <div className="absolute bottom-16 left-10 w-24 h-24 rounded-full bg-[#F95738]/20" />

    <div className="relative max-w-7xl mx-auto px-5 md:px-10">
      <div className="mb-16 md:mb-20 max-w-3xl">
        <div className="text-xs md:text-sm font-bold tracking-[0.28em] uppercase text-[#F95738] mb-4">
          Numbers don&apos;t lie
        </div>
        <h2 className="font-display uppercase text-5xl md:text-7xl leading-[0.9] tracking-tighter">
          A movement, <br />not an app.
        </h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-10 md:gap-8">
        {stats.map((s) => (
          <div key={s.label} data-testid={s.testid} className="flex flex-col gap-3 border-t-2 border-[#F5F5F0]/20 pt-6">
            <Counter to={s.value} suffix={s.suffix} />
            <div className="text-xs md:text-sm font-bold tracking-[0.24em] uppercase text-[#F5F5F0]/60">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Testimonial strip */}
      <div className="mt-20 md:mt-28 grid grid-cols-1 md:grid-cols-3 gap-6">
        {TESTIMONIALS.map((t, i) => (
          <figure key={i} data-testid={`testimonial-${i}`} className="border-2 border-[#F5F5F0]/20 rounded-2xl p-6 md:p-7 bg-[#1A3636]">
            <blockquote className="text-[#F5F5F0]/90 text-base md:text-lg leading-relaxed mb-6">&ldquo;{t.q}&rdquo;</blockquote>
            <figcaption className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#F95738] text-[#F5F5F0] flex items-center justify-center font-display text-sm">{t.a}</div>
              <div>
                <div className="font-bold text-sm text-[#F5F5F0]">{t.n}</div>
                <div className="text-xs text-[#F5F5F0]/50">{t.city} · {t.sport}</div>
              </div>
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  </section>
);

export default Stats;
