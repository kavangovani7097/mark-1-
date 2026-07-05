import Nav from './components/squadr/Nav';
import Hero from './components/squadr/Hero';
import Marquee from './components/squadr/Marquee';
import HowItWorks from './components/squadr/HowItWorks';
import Features from './components/squadr/Features';
import Stats from './components/squadr/Stats';
import FinalCTA from './components/squadr/FinalCTA';
import Footer from './components/squadr/Footer';

function LandingPage({ onGetStarted, termsUrl, privacyUrl, communityUrl }) {
  return (
    <main
      data-testid="squadr-landing"
      className="bg-squadr-bg text-squadr-text font-body overflow-x-hidden"
    >
      <Nav onGetStarted={onGetStarted} />
      <Hero onGetStarted={onGetStarted} />
      <Marquee />
      <HowItWorks />
      <Features onGetStarted={onGetStarted} />
      <Stats />
      <FinalCTA onGetStarted={onGetStarted} />
      <Footer termsUrl={termsUrl} privacyUrl={privacyUrl} communityUrl={communityUrl} />
    </main>
  );
}

export default LandingPage;
