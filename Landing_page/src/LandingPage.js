import Nav from './components/squadr/Nav';
import Hero from './components/squadr/Hero';
import Marquee from './components/squadr/Marquee';
import HowItWorks from './components/squadr/HowItWorks';
import Features from './components/squadr/Features';

import FinalCTA from './components/squadr/FinalCTA';
import Footer from './components/squadr/Footer';

function LandingPage() {
  return (
    <main data-testid="squadr-landing" className="bg-[#F5F5F0] text-[#1A3636] font-body overflow-x-hidden">
      <Nav />
      <Hero />
      <Marquee />
      <HowItWorks />
      <Features />
      <FinalCTA />
      <Footer />
    </main>
  );
}

export default LandingPage;
