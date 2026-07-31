/* RESPONSIVE: Mobile-first, fluid clamp(), auto-fit grid, card-transform tables */
import { useRef } from "react";
import { Crown, Trophy, ArrowUpRight, ChevronDown, Activity, Flame } from "lucide-react";
import { motion, useScroll, useTransform } from "motion/react";
import { useLanguage } from "../contexts/LanguageContext";

interface HeroProps {
  onExploreClick?: () => void;
  stats?: {
    gamesPlayed?: number;
    wins?: number;
    ties?: number;
    losses?: number;
    goals?: number;
  };
}

export default function Hero({ onExploreClick, stats }: HeroProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();

  // Setup useScroll for scroll-driven parallax effects
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  // Transform outputs based on scroll progression:
  const contentY = useTransform(scrollYProgress, [0, 1], [0, -150]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const bgScale = useTransform(scrollYProgress, [0, 1], [1.02, 1.15]);

  const handleScrollDown = () => {
    if (onExploreClick) {
      onExploreClick();
    } else {
      const nextSection = document.getElementById("club-portal");
      if (nextSection) {
        nextSection.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  const gamesPlayed = stats?.gamesPlayed || 200;
  const wins = stats?.wins || 71;
  const winRate = Math.round((wins / gamesPlayed) * 100);
  const goals = stats?.goals || 512;

  return (
    <section
      ref={containerRef}
      id="overview"
      className="relative w-full min-h-[85vh] lg:h-[56.25vw] lg:max-h-[850px] overflow-hidden flex flex-col justify-between pt-24 md:pt-28 lg:pt-32"
    >
      {/* 1. BACKGROUND AND BLENDING ARTWORK (Z-INDEX 0) */}
      <motion.div
        style={{ scale: bgScale }}
        className="absolute inset-0 w-full h-full pointer-events-none select-none z-0 overflow-hidden bg-gradient-to-b from-zinc-950 via-[#030303] to-black"
      >
        {/* Sleek, responsive grid background pattern that shows instantly while video is loading */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(215,174,106,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(215,174,106,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(215,174,106,0.05)_0%,transparent_60%)]" />

        {/* Ambient Gold Glows */}
        <div className="ambient-glow-gold top-1/4 left-1/4 opacity-70" />
        <div className="ambient-glow-gold bottom-1/4 right-1/4 opacity-60" />

        {/* Video Element with hardware acceleration for a perfect native loop */}
        <video
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          poster="/uploads/logo.jpg"
          className="absolute inset-0 w-full h-full object-cover object-[72%_center] lg:object-top transition-none scale-100 opacity-80"
          style={{
            transform: "translate3d(0, 0, 0)",
            willChange: "transform",
            backfaceVisibility: "hidden"
          }}
        >
          <source src="https://res.cloudinary.com/kwwyxgal/video/upload/v1784370818/download_2_ey5xjr.mp4" type="video/mp4" />
        </video>
        
        {/* Left-to-right dark gradient overlay for superior text contrast on mobile/tablet */}
        <div className="absolute inset-y-0 left-0 w-full md:w-1/2 bg-gradient-to-r from-black/80 via-black/30 to-transparent pointer-events-none" />
        
        {/* Smooth transition gradient to body background */}
        <div className="absolute bottom-0 left-0 w-full h-32 lg:h-64 bg-gradient-to-t from-black via-black/50 to-transparent" />
      </motion.div>

      {/* 2. MAIN CONTENT AREA (Z-INDEX 20) - Aligned with the standard site container */}
      <div className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-8 lg:px-16 flex flex-col items-start text-left py-4 sm:py-6 md:py-8 lg:py-12 flex-grow justify-center">
        
        <motion.div
          style={{ y: contentY, opacity: contentOpacity }}
          className="w-full lg:w-8/12 flex flex-col items-start justify-start text-left"
        >
          {/* Tagline Badge */}
          <div 
            className="animate-fade-up delay-0 flex items-center justify-start gap-2 mb-5 sm:mb-6 text-white/85 select-none"
            id="hero-tagline"
          >
            <div className="bg-gold/15 p-1 rounded-md border border-gold/30 flex items-center justify-center min-w-[28px] min-h-[28px]">
              <Crown className="w-3.5 h-3.5 text-gold" />
            </div>
            <span className="font-sans text-[clamp(0.65rem,1.5vw,0.75rem)] tracking-[0.25em] uppercase font-bold text-white/95">
              {t('hero.tagline')}
            </span>
          </div>

          {/* Large Hero Heading: Cinzel, Clean, Heavy Bold with Periods */}
          <h1 
            className="animate-fade-up delay-200 font-serif text-white uppercase tracking-[0.03em] select-none flex flex-col font-black mb-6 text-left items-start"
            id="hero-heading"
            style={{
              fontSize: "clamp(2.25rem, 6.5vw, 4rem)",
              lineHeight: "1.05"
            }}
          >
            <span className="text-gradient-platinum drop-shadow-[0_4px_16px_rgba(0,0,0,0.85)] filter">{t('hero.title1')}</span>
            <span className="text-gradient-platinum drop-shadow-[0_4px_16px_rgba(0,0,0,0.85)] filter">{t('hero.title2')}</span>
            <span className="text-gradient-gold glow-text-gold drop-shadow-[0_0_35px_rgba(215,174,106,0.35)]">{t('hero.subtitle')}</span>
          </h1>

          {/* Description subtext in Italian */}
          <div 
            className="animate-fade-up delay-400 text-gray-200 font-sans leading-relaxed font-normal text-left"
            style={{
              fontSize: "clamp(0.85rem, 1.5vw + 0.1rem, 1.1rem)",
              maxWidth: "min(100%, 550px)"
            }}
            id="hero-subtext"
          >
            <p className="drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
              {t('hero.desc')} <strong className="text-white font-semibold">{t('hero.descHighlight')}</strong>
            </p>
          </div>

          {/* CTA Buttons & Badge Row */}
          <div 
            className="animate-fade-up delay-600 mt-8 sm:mt-10 flex items-center justify-start w-full font-bold"
            id="hero-cta-row"
          >
            {/* Overview Button with Premium Glassmorphism design */}
            <button
              onClick={handleScrollDown}
              className="group relative flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-full border-2 border-gold bg-black/60 backdrop-blur-md text-gold hover:text-white hover:bg-gold/20 hover:border-gold shadow-[0_4px_25px_rgba(0,0,0,0.6)] transition-all duration-300 w-full sm:w-auto font-sans font-bold tracking-widest text-xs uppercase cursor-pointer"
              id="hero-overview-btn"
            >
              <span className="relative z-10">{t('hero.overviewBtn')}</span>
              <ArrowUpRight className="relative z-10 w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </button>
          </div>
        </motion.div>
      </div>

      {/* Decorative Bottom Shadow / Ambient Gold Glow */}
      <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-[80%] h-32 bg-gold/10 blur-[80px] pointer-events-none rounded-full z-20" />

      {/* Seamless Bottom Gradient Fade to blend with next section without covering the bar completely */}
      <div className="absolute bottom-0 left-0 w-full h-12 bg-gradient-to-t from-black to-transparent pointer-events-none z-10" />

      {/* Barra Pilastri Piatta sul Fondo */}
      <div className="w-full bg-black/20 backdrop-blur-xl border-t border-white/10 py-4 sm:py-5 relative z-30 shadow-[0_-8px_30px_rgba(0,0,0,0.4)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-16 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-0 md:divide-x divide-white/10" id="hero-stats-row">
            {/* Stat 1: Giocate */}
            <div className="flex flex-col items-center justify-center gap-0.5 text-center px-2">
              <div className="flex items-center justify-center gap-1 mb-0.5 text-neutral-400">
                <Activity className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="text-[10px] sm:text-[11px] font-sans uppercase tracking-[0.2em] font-semibold text-gray-400 truncate">
                  {t('hero.stats.played') || "Partite"}
                </span>
              </div>
              <span className="font-serif text-lg sm:text-xl text-white font-bold drop-shadow-md">{gamesPlayed}</span>
            </div>

            {/* Stat 2: Vittorie */}
            <div className="flex flex-col items-center justify-center gap-0.5 text-center px-2">
              <div className="flex items-center justify-center gap-1 mb-0.5 text-gold/80">
                <img 
                  src="https://res.cloudinary.com/kwwyxgal/image/upload/v1784273713/Progetto_senza_titolo_-_2026-07-17T093456.592_k9jg8l.png" 
                  alt="Trophy" 
                  className="w-4 h-4 object-contain flex-shrink-0 drop-shadow-[0_0_6px_rgba(234,179,8,0.7)]" 
                />
                <span className="text-[10px] sm:text-[11px] font-sans uppercase tracking-[0.2em] font-semibold text-gold/80 truncate">
                  {t('hero.stats.wins') || "Vittorie"}
                </span>
              </div>
              <span className="font-serif text-lg sm:text-xl text-gold font-bold drop-shadow-md">{wins}</span>
            </div>

            {/* Stat 3: Win Rate */}
            <div className="flex flex-col items-center justify-center gap-0.5 text-center px-2">
              <div className="flex items-center justify-center gap-1 mb-0.5 text-neutral-400">
                <Trophy className="w-3.5 h-3.5 flex-shrink-0 text-emerald-500/80" />
                <span className="text-[10px] sm:text-[11px] font-sans uppercase tracking-[0.2em] font-semibold text-gray-400 truncate">
                  {t('hero.stats.winRate') || "Win Rate"}
                </span>
              </div>
              <span className="font-serif text-lg sm:text-xl text-emerald-400 font-bold drop-shadow-md">{winRate}%</span>
            </div>

            {/* Stat 4: Goal */}
            <div className="flex flex-col items-center justify-center gap-0.5 text-center px-2">
              <div className="flex items-center justify-center gap-1 mb-0.5 text-neutral-400">
                <img 
                  src="https://res.cloudinary.com/kwwyxgal/image/upload/v1784273713/Progetto_senza_titolo_-_2026-07-17T093456.592_k9jg8l.png" 
                  alt="Ball" 
                  className="w-3.5 h-3.5 object-contain flex-shrink-0 filter brightness-125" 
                  onError={(e) => {
                    // Fallback to Flame icon if error
                    e.currentTarget.style.display = 'none';
                  }}
                  referrerPolicy="no-referrer"
                />
                <span className="text-[10px] sm:text-[11px] font-sans uppercase tracking-[0.2em] font-semibold text-gray-400 truncate">
                  {t('hero.stats.goals') || "Gol"}
                </span>
              </div>
              <span className="font-serif text-lg sm:text-xl text-white font-bold drop-shadow-md">{goals}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Animated Floating Scroll Indicator */}
      <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-1.5 select-none pointer-events-none hidden md:flex">
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
        >
          <ChevronDown className="w-5 h-5 text-gold/40" />
        </motion.div>
      </div>
    </section>
  );
}
