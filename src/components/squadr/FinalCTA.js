import { ArrowUpRight } from "lucide-react";

export const FinalCTA = ({ onGetStarted }) => (
  <section id="download" data-testid="final-cta-section" className="relative bg-[#F95738] text-[#F5F5F0] py-28 md:py-40 overflow-hidden">
    <div className="absolute inset-0 squadr-noise opacity-30" />

    {/* Geometric X marks */}
    <svg className="absolute top-16 left-6 md:left-24 w-16 md:w-24" viewBox="0 0 100 100" fill="none">
      <path d="M10 10 L90 90 M90 10 L10 90" stroke="#1A3636" strokeWidth="6" strokeLinecap="round" />
    </svg>
    <svg className="absolute bottom-14 right-8 md:right-32 w-20 md:w-32" viewBox="0 0 100 100" fill="none">
      <path d="M10 10 L90 90 M90 10 L10 90" stroke="#1A3636" strokeWidth="6" strokeLinecap="round" />
    </svg>
    <div className="absolute top-20 right-16 w-24 h-24 md:w-40 md:h-40 rounded-full border-2 border-[#1A3636]" />

    <div className="relative max-w-6xl mx-auto px-5 md:px-10 text-center">
      <div className="inline-flex items-center gap-2 mb-6 bg-[#1A3636] text-[#F5F5F0] px-4 py-2 rounded-full text-xs font-bold tracking-[0.24em] uppercase">
        <span className="w-2 h-2 rounded-full bg-[#F95738] squadr-pulse" />
        Kickoff in 90 seconds
      </div>

      <h2 className="font-display uppercase text-[#1A3636] text-[15vw] md:text-[9vw] lg:text-[10rem] leading-[0.9] tracking-tighter mb-8">
        Ready to <br />
        <span className="text-outline-bone" style={{ WebkitTextStroke: "3px #1A3636" }}>play?</span>
      </h2>

      <p className="max-w-xl mx-auto text-lg text-[#F5F5F0]/90 mb-10">
        Install SQUADR. Set your radius. Meet your next teammate before the group chat replies.
      </p>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <a
          href="#download"
          onClick={(e) => {
            if (onGetStarted) {
              e.preventDefault();
              onGetStarted();
            }
          }}
          data-testid="final-cta-download"
          className="brutal-shadow-inverse inline-flex items-center gap-3 bg-[#1A3636] text-[#F5F5F0] rounded-full pl-8 pr-3 py-4 font-bold uppercase tracking-widest text-sm md:text-base border-2 border-[#1A3636]"
        >
          Install as PWA
          <span className="bg-[#F95738] text-[#1A3636] rounded-full p-2 border-2 border-[#1A3636]">
            <ArrowUpRight size={18} />
          </span>
        </a>
      </div>

      <div className="mt-14 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs font-bold tracking-[0.24em] uppercase text-[#1A3636]/80">
        <span>iOS</span><span className="opacity-40">/</span>
        <span>Android</span><span className="opacity-40">/</span>
        <span>Web</span>
      </div>
    </div>
  </section>
);

export default FinalCTA;
