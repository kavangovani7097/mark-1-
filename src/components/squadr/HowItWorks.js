import { MapPin, Users, Zap } from "lucide-react";

const steps = [
  {
    n: "01",
    icon: <MapPin size={22} />,
    title: "Set your court",
    body: "Drop a pin. Pick your radius from 5 to 40 km. SQUADR reads the ground you can actually reach.",
    testid: "step-1",
  },
  {
    n: "02",
    icon: <Users size={22} />,
    title: "Match your squad",
    body: "Skill level, sport, time slot — we pair you with real players in under 90 seconds. No dead group chats.",
    testid: "step-2",
  },
  {
    n: "03",
    icon: <Zap size={22} />,
    title: "Turn up. Play.",
    body: "Confirm the slot, get the venue drop-pin, and show up. That&#39;s it. The game runs itself.",
    testid: "step-3",
  },
];

export const HowItWorks = () => (
  <section
    id="how-it-works"
    data-testid="how-it-works-section"
    className="relative py-24 md:py-36 bg-squadr-bg overflow-hidden"
  >
    <div className="max-w-7xl mx-auto px-5 md:px-10">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-16 md:mb-24">
        <div>
          <div className="text-xs md:text-sm font-bold tracking-[0.28em] uppercase text-squadr-accent mb-4">
            The Playbook
          </div>
          <h2 className="font-display uppercase text-squadr-text text-5xl md:text-7xl lg:text-8xl leading-[0.9] tracking-tighter">
            3 steps to <br />
            <span className="text-squadr-accent">glory.</span>
          </h2>
        </div>
        <p className="max-w-md text-base md:text-lg text-squadr-secondary">
          Built for players, not planners. From pin-drop to first serve in three moves.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
        {steps.map((s, i) => (
          <article
            key={s.n}
            data-testid={s.testid}
            className={`relative bg-squadr-bg border-2 border-squadr-border rounded-2xl p-7 md:p-9 overflow-hidden group brutal-shadow ${
              i === 1 ? "md:translate-y-8" : ""
            } ${i === 2 ? "md:translate-y-16" : ""}`}
          >
            <div className="absolute -top-4 -right-2 font-display text-[10rem] md:text-[12rem] leading-none text-squadr-accent opacity-[0.08] select-none pointer-events-none">
              {s.n}
            </div>
            <div className="relative z-10 flex flex-col gap-6 min-h-[280px] justify-between">
              <div>
                <div className="inline-flex items-center justify-center w-11 h-11 rounded-full bg-squadr-ink text-squadr-on-accent mb-5">
                  {s.icon}
                </div>
                <h3 className="font-display text-2xl md:text-3xl uppercase leading-tight tracking-tight text-squadr-text mb-3">
                  {s.title}
                </h3>
                <p
                  className="text-squadr-secondary leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: s.body }}
                />
              </div>
              <div className="text-xs font-bold tracking-[0.28em] uppercase text-squadr-muted">
                Step / {s.n}
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  </section>
);

export default HowItWorks;
