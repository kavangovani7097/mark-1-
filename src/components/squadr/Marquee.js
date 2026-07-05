const items = [
  "INSTANT MATCHMAKING",
  "PLAYERS NEARBY",
  "ANY SPORT",
  "NO EXCUSES",
  "SCHEDULED SESSIONS",
  "OWN THE GAME",
];

const Row = ({ variant }) => (
  <div className={`flex whitespace-nowrap ${variant === "reverse" ? "squadr-marquee-track-slow" : "squadr-marquee-track"}`}>
    {[0, 1].map((k) => (
      <div key={k} className="flex items-center shrink-0">
        {items.map((t, i) => (
          <span key={i} className="flex items-center">
            <span
              className={`font-display uppercase tracking-tighter text-[14vw] md:text-[10vw] leading-none px-6 md:px-10 ${
                variant === "reverse" ? "text-outline" : "text-squadr-text"
              }`}
            >
              {t}
            </span>
            <span className="inline-block w-4 h-4 md:w-5 md:h-5 rounded-full bg-squadr-accent mx-2" />
          </span>
        ))}
      </div>
    ))}
  </div>
);

export const Marquee = () => (
  <section
    data-testid="marquee-section"
    className="bg-squadr-bg py-8 md:py-14 border-y-2 border-squadr-border overflow-hidden"
  >
    <Row />
    <div className="h-3 md:h-4" />
    <Row variant="reverse" />
  </section>
);

export default Marquee;
