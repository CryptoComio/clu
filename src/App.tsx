/* RESPONSIVE: Mobile-first, fluid clamp(), auto-fit grid, card-transform tables */
import { useState, useEffect, FormEvent } from "react";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import ClubHeader from "./components/ClubHeader";
import Overview from "./components/Overview";
import MembersList from "./components/MembersList";
import MatchHistory from "./components/MatchHistory";
import LastMatch from "./components/LastMatch";
import TwitchLive from "./components/TwitchLive";
import { Recruitment } from "./components/Recruitment";
import { useClubData } from "./hooks/useClubData";
import LoadingScreen from "./components/LoadingScreen";
import { Users, Trophy, Shield, MessageSquare, ArrowUpRight, CheckCircle, Star, Calendar, ArrowRight, Disc, Crosshair, ChevronUp } from "lucide-react";
import { motion, AnimatePresence, useScroll, useSpring } from "motion/react";
import { useLanguage } from "./contexts/LanguageContext";

export default function App() {
  const { clubData, loading, isRefetching, refetch } = useClubData();
  const [activeNavSection, setActiveNavSection] = useState<string>("overview");
  const { t, language } = useLanguage();

  const showLoading = loading && !clubData;

  // Scroll Progress Bar Setup
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  // Coordinate-based scroll-spy for smooth progressive navigation line transition
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    const handleScrollSpy = () => {
      setShowBackToTop(window.scrollY > 400);
      const sectionIds = ["overview", "club-overview", "matches", "members", "twitch", "community"];
      const scrollPosition = window.scrollY + window.innerHeight / 3;

      // Check if user has scrolled near the bottom of the page
      const isAtBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 60;

      if (isAtBottom) {
        setActiveNavSection("community");
        return;
      }

      let activeSection = "overview";

      for (const id of sectionIds) {
        const el = document.getElementById(id);
        if (el) {
          const rect = el.getBoundingClientRect();
          const top = rect.top + window.scrollY;
          if (scrollPosition >= top - 20) {
            activeSection = id;
          }
        }
      }

      // Map "club-overview" to "overview"
      const mappedSection = activeSection === "club-overview" ? "overview" : activeSection;
      setActiveNavSection(mappedSection);
    };

    window.addEventListener("scroll", handleScrollSpy, { passive: true });
    // Run once initially to set correct active section
    handleScrollSpy();

    return () => window.removeEventListener("scroll", handleScrollSpy);
  }, []);

  const handleNavScroll = (targetId: string) => {
    const targetElement = document.getElementById(targetId);
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Definitively removed the initial full-screen loading and error screens as requested to show the page instantly.

  return (
    <div className="bg-black text-white min-h-screen font-sans selection:bg-gold/30 selection:text-gold overflow-x-hidden">
      {/* Scroll Progress Bar at very top of screen */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
      >
        <motion.div 
          className="fixed top-0 left-0 right-0 h-[3px] bg-gold origin-[0%] z-[100] shadow-[0_0_8px_rgba(215,174,106,0.8)]" 
          style={{ scaleX }} 
        />

        {/* 1. Navbar */}
        <Navbar onNavClick={handleNavScroll} activeSection={activeNavSection} />

        {/* 2. Hero Section */}
        <Hero 
          onExploreClick={() => handleNavScroll("club-overview")} 
          stats={clubData ? {
            gamesPlayed: clubData.totalMatches,
            wins: clubData.wins,
            goals: clubData.goalsScored,
          } : undefined}
        />

          {/* ========================================================= */}
          {/* SECTION: EA SPORTS FC Pro Club Portal */}
          {/* ========================================================= */}
          <section id="club-portal" className="relative pt-8 pb-0 sm:pt-12 sm:pb-0 bg-black">
            
            {/* Background Ambient Glow */}
            <div className="absolute top-12 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gold/3 blur-[140px] pointer-events-none rounded-full" />

            {/* 1. Header Club Section */}
            {clubData && <ClubHeader clubData={clubData} isRefetching={isRefetching} onRefresh={refetch} />}

            {/* 2. Continuous Scroll Sections */}
            <div className="w-full flex flex-col gap-12 sm:gap-16 lg:gap-20 mt-8 sm:mt-12">
              
              {/* Overview Section */}
              <motion.div
                id="club-overview"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-120px" }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="scroll-mt-24 sm:scroll-mt-32"
              >
                {clubData && <Overview clubData={clubData} onTabChange={handleNavScroll} />}
              </motion.div>

              {/* Match History Section */}
              <motion.div
                id="matches"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-120px" }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="scroll-mt-24 sm:scroll-mt-32 max-w-7xl mx-auto px-4 sm:px-8 lg:px-16 w-full flex flex-col gap-10 sm:gap-12"
              >
                {clubData && <LastMatch clubData={clubData} />}
                {clubData && <MatchHistory clubData={clubData} />}
              </motion.div>

              {/* Members List Section */}
              <motion.div
                id="members"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-120px" }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="scroll-mt-24 sm:scroll-mt-32 max-w-7xl mx-auto px-4 sm:px-8 lg:px-16 w-full"
              >
                {clubData && <MembersList clubData={clubData} />}
              </motion.div>

              {/* Twitch Live Section */}
              <motion.div
                id="twitch"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-120px" }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="scroll-mt-24 sm:scroll-mt-32 w-full"
              >
                <TwitchLive />
              </motion.div>

            </div>

          </section>

          {/* 5. Community Section (Join/Apply) */}
          <Recruitment />

          {/* Floating Back To Top Button (Professional Ultra-Glass Semi-Transparent Disc) */}
          <AnimatePresence>
            {showBackToTop && (
              <motion.button
                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.9 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="fixed bottom-6 right-6 z-40 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black/20 hover:bg-black/80 border border-white/10 hover:border-gold/60 text-white/50 hover:text-gold opacity-40 hover:opacity-100 backdrop-blur-md shadow-sm hover:shadow-[0_0_20px_rgba(215,174,106,0.35)] flex items-center justify-center transition-all duration-300 group cursor-pointer active:scale-95"
                aria-label="Torna su"
                title={language === 'it' ? 'Torna all\'inizio' : 'Back to top'}
              >
                <ChevronUp className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform duration-200" />
              </motion.button>
            )}
          </AnimatePresence>

          {/* 6. Il Footer (Chiusura Elegante) */}
          <footer className="w-full border-t border-white/10 bg-black py-10 sm:py-16 flex flex-col items-center">
            <div className="mb-8">
              <h2 className="text-3xl font-serif tracking-widest text-white uppercase drop-shadow-md">
                FC White<span className="text-[#d7ae6a]">Angel</span>XI
              </h2>
            </div>
            
            <div className="grid grid-cols-2 gap-y-4 gap-x-8 sm:flex sm:flex-wrap justify-center sm:gap-12 mb-10 px-4 text-center">
              {[
                { label: language === 'it' ? 'Panoramica' : 'Overview', id: 'overview' },
                { label: language === 'it' ? 'Partite' : 'Matches', id: 'matches' },
                { label: language === 'it' ? 'Membri' : 'Members', id: 'members' },
                { label: 'Community', id: 'community' }
              ].map((item) => (
                <a 
                  key={item.id} 
                  href={`#${item.id}`} 
                  onClick={(e) => { e.preventDefault(); handleNavScroll(item.id); }}
                  className="text-[10px] sm:text-xs font-sans uppercase tracking-[0.2em] font-semibold text-[#a89b8a] hover:text-[#d7ae6a] transition-colors duration-300"
                >
                  {item.label}
                </a>
              ))}
            </div>

            <p className="text-[8px] sm:text-[9px] font-sans tracking-[0.2em] text-gray-600 uppercase text-center leading-relaxed px-4">
              &copy; 2026 {clubData?.name?.toUpperCase() || "CLUB"}.<br className="block sm:hidden" /> {t('footer.rights') || (language === 'it' ? 'Tutti i diritti riservati.' : 'All rights reserved.')}
            </p>
          </footer>
        </motion.div>
    </div>
  );
}
