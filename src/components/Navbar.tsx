/* RESPONSIVE: Mobile-first, fluid clamp(), auto-fit grid, card-transform tables */
import { useState, useEffect } from "react";
import { ArrowUpRight, Menu, X, Globe } from "lucide-react";
import { motion, AnimatePresence, useScroll, useTransform } from "motion/react";
import { useLanguage } from "../contexts/LanguageContext";
import { useClubData } from "../hooks/useClubData";

interface NavbarProps {
  onNavClick?: (target: string) => void;
  activeSection?: string;
}

export default function Navbar({ onNavClick, activeSection }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { language, setLanguage, t } = useLanguage();
  const { clubData } = useClubData();

  const toggleLanguage = () => {
    setLanguage(language === 'it' ? 'en' : 'it');
  };

  const { scrollY } = useScroll();

  // Smooth, progressive interpolation of styles based on scroll position (0px to 150px)
  const bg = useTransform(scrollY, [0, 150], ["rgba(0, 0, 0, 0)", "rgba(3, 3, 3, 0.82)"]);
  const backdropBlur = useTransform(scrollY, [0, 150], ["blur(0px)", "blur(12px)"]);
  const borderBottom = useTransform(scrollY, [0, 150], ["1px solid rgba(255, 255, 255, 0)", "1px solid rgba(255, 255, 255, 0.08)"]);
  const paddingY = useTransform(scrollY, [0, 150], ["16px", "10px"]);
  const boxShadow = useTransform(scrollY, [0, 150], ["0 4px 30px rgba(0,0,0,0)", "0 4px 30px rgba(0,0,0,0.55)"]);

  // Override progressive values when mobile menu is open to ensure clean background contrast
  const styleBg = isOpen ? "rgba(3, 3, 3, 0.98)" : bg;
  const styleBackdropBlur = isOpen ? "blur(24px)" : backdropBlur;
  const styleBorderBottom = isOpen ? "1px solid rgba(255, 255, 255, 0.1)" : borderBottom;
  const stylePaddingY = isOpen ? "10px" : paddingY;
  const styleBoxShadow = isOpen ? "0 4px 30px rgba(0,0,0,0.55)" : boxShadow;

  const navLinks = [
    { label: language === 'it' ? "Panoramica" : "Overview", id: "overview" },
    { label: language === 'it' ? "Partite" : "Matches", id: "matches" },
    { label: language === 'it' ? "Membri" : "Members", id: "members" },
    { label: "Twitch Live", id: "twitch" },
    { label: language === 'it' ? "Candidatura" : "Apply", id: "community" },
  ];

  const handleLinkClick = (id: string) => {
    setIsOpen(false);
    if (onNavClick) {
      onNavClick(id);
    } else {
      // Smooth scroll fallback
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  return (
    <>
      <motion.nav
        id="navbar-vanguard"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        style={{
          background: styleBg,
          backdropFilter: styleBackdropBlur,
          WebkitBackdropFilter: styleBackdropBlur,
          borderBottom: styleBorderBottom,
          paddingTop: stylePaddingY,
          paddingBottom: stylePaddingY,
          boxShadow: styleBoxShadow,
        }}
        className="fixed top-0 left-0 w-full z-50 px-4 sm:px-8 lg:px-16"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Left: Brand */}
          <button
            onClick={() => handleLinkClick("overview")}
            className="flex items-center space-x-2.5 text-left bg-transparent border-none cursor-pointer focus:outline-none group min-h-[44px]"
            id="brand-logo"
          >
            <img
              src="https://res.cloudinary.com/kwwyxgal/image/upload/v1785138160/Progetto_senza_titolo_-_2026-07-27T094228.277_yychku.png"
              alt={`${clubData?.name || "CLUB"} Logo`}
              className="object-contain drop-shadow-[0_0_8px_rgba(215,174,106,0.4)] group-hover:scale-105 transition-transform duration-300"
              style={{
                width: "clamp(32px, 8vw, 42px)",
                height: "clamp(32px, 8vw, 42px)",
              }}
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
              referrerPolicy="no-referrer"
              width="42"
              height="42"
            />
            {/* COMPACT: Hide brand text below 400px (xs) */}
            <span className="inline-block font-serif text-xs sm:text-sm md:text-base tracking-[0.15em] uppercase text-white font-bold select-none transition-colors group-hover:text-gold/90">
              {clubData?.name || "CLUB"}
            </span>
          </button>

          {/* Center: Desktop Navigation Links */}
          <div className="hidden lg:flex items-center space-x-10">
            {navLinks.map((link) => {
              const isActive = activeSection === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => handleLinkClick(link.id)}
                  className={`font-sans text-xs transition-all duration-300 tracking-[0.25em] uppercase relative group cursor-pointer focus:outline-none py-2 ${
                    isActive ? "text-gold font-bold" : "text-white/70 hover:text-white"
                  }`}
                  id={`nav-link-${link.id}`}
                >
                  {link.label}
                  {isActive ? (
                    <motion.span 
                      layoutId="activeNavLinkUnderline"
                      className="absolute bottom-0 left-0 w-full h-[1px] bg-gold shadow-[0_0_8px_rgba(215,174,106,0.6)]" 
                    />
                  ) : (
                    <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-gold/50 transition-all duration-300 group-hover:w-full" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Right: Desktop Language Toggle */}
          <div className="hidden lg:flex items-center gap-4">
            <button
              onClick={toggleLanguage}
              className="flex items-center justify-center gap-2 text-white/60 hover:text-white bg-white/5 hover:bg-white/10 px-4 py-2 rounded-full transition-all duration-300 font-serif text-[10px] tracking-widest font-bold border border-white/5 hover:border-white/20"
            >
              <Globe className="w-3.5 h-3.5" />
              {language === 'it' ? 'EN' : 'IT'}
            </button>
          </div>

          {/* Mobile: Hamburger Button & Lang Toggle */}
          <div className="flex lg:hidden items-center gap-1">
            <button
              onClick={toggleLanguage}
              className="text-white/80 hover:text-white p-2 flex items-center gap-1 font-serif text-[10px] tracking-wider border border-white/10 rounded-lg bg-white/5 h-[48px] px-3"
            >
              <Globe className="w-3.5 h-3.5" />
              {language === 'it' ? 'EN' : 'IT'}
            </button>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-white/90 hover:text-white w-12 h-12 lg:hidden flex items-center justify-center transition-colors focus:outline-none bg-white/5 border border-white/10 rounded-xl"
              aria-label="Toggle Menu"
              id="mobile-menu-btn"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile absolute menu dropdown */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              id="mobile-overlay"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="absolute top-full left-0 w-full bg-black/98 backdrop-blur-2xl border-b border-white/10 z-40 lg:hidden flex flex-col p-6 space-y-6 shadow-[0_20px_50px_rgba(0,0,0,0.9)]"
            >
              {/* Ambient Background Accents inside Mobile Menu */}
              <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-gold/5 blur-[80px] pointer-events-none rounded-full" />

              {/* Links Container */}
              <div className="flex flex-col space-y-4 relative z-10">
                {navLinks.map((link, index) => {
                  const isActive = activeSection === link.id;
                  return (
                    <motion.button
                      key={link.id}
                      initial={{ opacity: 0, x: -15 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05, duration: 0.3 }}
                      onClick={() => handleLinkClick(link.id)}
                      className={`font-podium text-2xl text-left tracking-wider uppercase transition-colors cursor-pointer focus:outline-none w-fit group flex items-center gap-4 min-h-[44px] ${
                        isActive ? "text-gold" : "text-white hover:text-gold"
                      }`}
                      id={`mobile-nav-${link.id}`}
                    >
                      <span className={`text-xs font-serif ${isActive ? "text-gold/80" : "text-gold/30"}`}>0{index + 1}</span>
                      <span>{link.label}</span>
                      <ArrowUpRight className={`w-5 h-5 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all duration-300 ${
                        isActive ? "opacity-100 text-gold" : "text-gold"
                      }`} />
                    </motion.button>
                  );
                })}
              </div>

              {/* Bottom Section in Mobile Menu */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="border-t border-white/10 pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10"
              >
                <div className="text-white/50 text-[10px] tracking-widest uppercase font-sans text-center sm:text-left">
                  EA SPORTS FC 26 · SOUTHERN EUROPE
                </div>
                <button
                  onClick={() => handleLinkClick("community")}
                  className="relative group overflow-hidden w-full sm:w-auto flex items-center justify-center gap-3 bg-black/60 hover:bg-gold text-white hover:text-black border border-gold/40 hover:border-white px-8 py-3 text-xs tracking-[0.2em] font-serif uppercase font-black rounded-xl transition-all duration-300 shadow-[0_4px_15px_rgba(0,0,0,0.4)] hover:shadow-[0_0_20px_rgba(215,174,106,0.4)] cursor-pointer focus:outline-none active:scale-95 min-h-[48px]"
                  id="cta-join-mobile"
                >
                  <div className="absolute inset-0 w-[200%] h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_ease-in-out_infinite] pointer-events-none" />
                  <span className="relative z-10">{t('nav.joinClub')}</span>
                  <ArrowUpRight className="relative z-10 w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-300" />
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>
    </>
  );
}
