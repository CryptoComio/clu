/* RESPONSIVE: Mobile-first, fluid clamp(), auto-fit grid, card-transform tables */
import { useState, useMemo, useEffect } from "react";
import { Shield, Trophy, Globe, Award, Activity, RefreshCw } from "lucide-react";
import { ClubData } from "../hooks/useClubData";
import { motion } from "motion/react";
import { useLanguage } from "../contexts/LanguageContext";
import ReputationCrest from "./ReputationCrest";

const getRegionTranslation = (rawRegion: string, language: string): string => {
  if (!rawRegion) return "";
  const reg = rawRegion.trim().toLowerCase();
  const translations: Record<string, { it: string; en: string }> = {
    "southern europe": { it: "Europa Meridionale", en: "Southern Europe" },
    "northern europe": { it: "Europa Settentrionale", en: "Northern Europe" },
    "western europe": { it: "Europa Occidentale", en: "Western Europe" },
    "eastern europe": { it: "Europa Orientale", en: "Eastern Europe" },
    "british isles": { it: "Isole Britanniche", en: "British Isles" },
    "north america": { it: "Nord America", en: "North America" },
    "south america": { it: "Sud America", en: "South America" },
    "middle east": { it: "Medio Oriente", en: "Middle East" },
    "asia": { it: "Asia", en: "Asia" },
    "oceania": { it: "Oceania", en: "Oceania" }
  };
  const found = translations[reg];
  if (found) {
    return language === 'it' ? found.it : found.en;
  }
  return rawRegion; // Fallback
};

interface ReputationInfo {
  name: string;
  badgeUrl: string;
}

const getReputationInfo = (tier: number | string, t: (key: string) => string): ReputationInfo => {
  const tierNum = typeof tier === 'number' ? tier : parseInt(tier) || 1;
  return {
    name: t(`overview.reputationTiers.tier${tierNum}Name`),
    badgeUrl: `https://media.contentapi.ea.com/content/dam/eacom/fc/pro-clubs/reputation-tier${tierNum}.png`
  };
};

interface ClubHeaderProps {
  clubData: ClubData;
  isRefetching?: boolean;
  onRefresh?: () => void;
}

export default function ClubHeader({ clubData, isRefetching = false, onRefresh }: ClubHeaderProps) {
  const { t, language } = useLanguage();
  const DEFAULT_LOGO_URL = "https://res.cloudinary.com/kwwyxgal/image/upload/v1785138160/Progetto_senza_titolo_-_2026-07-27T094228.277_yychku.png";
  const crestId = clubData.customCrestId || clubData.crestId;
  const crestUrl = crestId 
    ? `https://eafc25.content.easports.com/fifa/fltOnlineAssets/24B23FDE-7835-41C2-87A2-F453DFDB2E82/2024/fcweb/crests/256x256/l${crestId}.png`
    : DEFAULT_LOGO_URL;
  const [logoSrc, setLogoSrc] = useState(crestUrl);
  const [logoError, setLogoError] = useState(false);

  useEffect(() => {
    const nextUrl = crestId 
      ? `https://eafc25.content.easports.com/fifa/fltOnlineAssets/24B23FDE-7835-41C2-87A2-F453DFDB2E82/2024/fcweb/crests/256x256/l${crestId}.png`
      : DEFAULT_LOGO_URL;
    setLogoSrc(nextUrl);
    setLogoError(false);
  }, [crestId]);

  const handleLogoError = () => {
    if (logoSrc !== DEFAULT_LOGO_URL) {
      setLogoSrc(DEFAULT_LOGO_URL); // Fallback to transparent Cloudinary logo
    } else {
      setLogoError(true); // Fallback to icon
    }
  };

  // Calculate dynamic stats
  const { totalMatches, winRate, winPercent, drawPercent, lossPercent } = useMemo(() => {
    const total = clubData.wins + clubData.draws + clubData.losses;
    const rate = total > 0 ? ((clubData.wins / total) * 100) : 0;
    
    // Percentages for the ratio bar
    const wPct = total > 0 ? (clubData.wins / total) * 100 : 0;
    const dPct = total > 0 ? (clubData.draws / total) * 100 : 0;
    const lPct = total > 0 ? (clubData.losses / total) * 100 : 0;

    return {
      totalMatches: total,
      winRate: parseFloat(rate.toFixed(1)),
      winPercent: wPct,
      drawPercent: dPct,
      lossPercent: lPct
    };
  }, [clubData]);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6 sm:mb-8">
      {/* Outer Glow Wrapper */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative rounded-xl p-[1px] bg-gradient-to-r from-gold/40 via-white/5 to-purple-500/20 shadow-[0_20px_45px_-15px_rgba(0,0,0,0.8)]"
        id="club-header-outer-wrapper"
      >
        {/* Main Card Container */}
        <div className="relative rounded-[11px] overflow-hidden bg-gradient-to-b from-zinc-950/95 to-black/98 backdrop-blur-2xl p-4 sm:p-5" id="club-header-container">
          
          {/* Futuristic Technical Alignment Grid Backdrop */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(215,174,106,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(215,174,106,0.015)_1px,transparent_1px)] bg-[size:16px_16px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />
          
          {/* Ambient Lighting Orbs */}
          <div className="absolute -top-12 -left-12 w-72 h-72 bg-gold/10 blur-[90px] rounded-full pointer-events-none" />
          <div className="absolute -bottom-12 -right-12 w-72 h-72 bg-purple-600/10 blur-[100px] rounded-full pointer-events-none" />

          {/* Golden scanning line effect */}
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-gold/30 to-transparent pointer-events-none animate-[pulse_3s_infinite]" />

          <div className="relative z-10 flex flex-col xl:flex-row gap-6 items-center justify-between">
            
            {/* LEFT SECTION: Logo & Identity details */}
            <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left w-full xl:w-auto">
              
              {/* Shield Logo container with dynamic glowing halo */}
              <div className="relative flex-shrink-0">
                <div className="absolute inset-0 rounded-xl bg-gradient-to-tr from-gold to-purple-500 opacity-20 blur-xl animate-pulse pointer-events-none" />
                <motion.div
                  whileHover={{ scale: 1.04, rotate: 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 12 }}
                  className="relative flex items-center justify-center p-1 group cursor-pointer"
                  id="club-logo-shield"
                  style={{
                    width: "clamp(72px, 16vw, 110px)",
                    height: "clamp(72px, 16vw, 110px)"
                  }}
                >
                  <div className="w-full h-full flex items-center justify-center relative z-10">
                    {!logoError ? (
                      <img
                        src={logoSrc}
                        alt="Club Logo"
                        className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105 drop-shadow-[0_0_12px_rgba(215,174,106,0.3)]"
                        onError={handleLogoError}
                        referrerPolicy="no-referrer"
                        width="128"
                        height="128"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center">
                        <Shield className="w-10 h-10 text-gold stroke-[1.2] drop-shadow-[0_0_12px_rgba(215,174,106,0.4)]" />
                        <span className="font-serif text-xs text-white tracking-widest mt-1.5 uppercase font-bold">
                          WA
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {/* Technical Corner Accents */}
                  <div className="absolute top-2 left-2 w-1.5 h-1.5 border-t border-l border-gold/60 z-30" />
                  <div className="absolute top-2 right-2 w-1.5 h-1.5 border-t border-r border-gold/60 z-30" />
                  <div className="absolute bottom-2 left-2 w-1.5 h-1.5 border-b border-l border-gold/60 z-30" />
                  <div className="absolute bottom-2 right-2 w-1.5 h-1.5 border-b border-r border-gold/60 z-30" />
                </motion.div>
              </div>

              {/* Identity details */}
              <div className="flex flex-col gap-2 w-full sm:w-auto">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-gold/80 font-serif">
                  <div className="flex items-center gap-1.5">
                    <Globe className="w-3 h-3" />
                    <span className="text-[clamp(0.55rem,1.2vw,0.7rem)] uppercase tracking-[0.25em] font-bold">
                      {getRegionTranslation(clubData.region, language)} • PRO CLUB
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-center sm:justify-start gap-3">
                  <h1 
                    className="font-serif text-white tracking-wide uppercase select-none leading-none font-black bg-gradient-to-r from-white via-white to-gold bg-clip-text text-transparent"
                    style={{ fontSize: "clamp(1.3rem, 3.5vw + 0.2rem, 2.2rem)" }}
                  >
                    {clubData.name}
                  </h1>
                </div>
              </div>
            </div>

            {/* RIGHT SECTION: The Stats HUD Grid - Fully unified, responsive and aligned */}
            <div className="w-full xl:w-auto flex-1 xl:max-w-[720px]">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 w-full" id="core-stats-grid">
                
                {/* 1. Skill Rating Box */}
                <div 
                  id="header-skill-rating-box"
                  className="col-span-1 bg-[#111111]/95 border border-neutral-800 rounded-xl p-3 flex flex-col items-center justify-center text-center transition-all duration-300 hover:border-gold/30 hover:bg-white/[0.02] shadow-inner relative group/stat min-h-[135px] sm:min-h-[145px]"
                >
                  <div className="w-12 h-12 sm:w-14 sm:h-14 mb-2 drop-shadow-[0_0_15px_rgba(234,179,8,0.4)] flex items-center justify-center transition-transform duration-300 group-hover/stat:scale-105">
                    <img 
                      src="https://res.cloudinary.com/kwwyxgal/image/upload/v1784273713/Progetto_senza_titolo_-_2026-07-17T093456.592_k9jg8l.png" 
                      alt="Custom Trophy" 
                      className="w-full h-full object-contain glow-shadow-gold" 
                    />
                  </div>
                  <span className="text-[9px] sm:text-[10px] md:text-[11px] lg:text-xs font-sans uppercase tracking-[0.2em] font-semibold text-gray-400 mb-0.5">
                    Skill Rating
                  </span>
                  <span className="text-lg sm:text-xl font-serif font-bold text-white uppercase leading-tight text-center glow-text-gold">
                    {clubData.skillRating}
                  </span>
                </div>

                {/* 2. Reputation Box */}
                <div 
                  id="header-reputation-box"
                  className="col-span-1 bg-[#111111]/95 border border-neutral-800 rounded-xl p-3 flex flex-col items-center justify-center text-center transition-all duration-300 hover:border-gold/30 hover:bg-white/[0.02] shadow-inner relative group/stat min-h-[135px] sm:min-h-[145px]"
                >
                  <div className="w-12 h-12 sm:w-14 sm:h-14 mb-2 drop-shadow-[0_0_15px_rgba(255,255,255,0.05)] flex items-center justify-center transition-transform duration-300 group-hover/stat:scale-105">
                    <ReputationCrest tier={clubData.reputationTier || 1} size={56} />
                  </div>
                  <span className="text-[9px] sm:text-[10px] md:text-[11px] lg:text-xs font-sans uppercase tracking-[0.2em] font-semibold text-gray-400 mb-0.5">
                    {t("overview.reputation")}
                  </span>
                  <span className="text-[11px] min-[380px]:text-xs sm:text-sm md:text-[11px] lg:text-[10px] xl:text-xs 2xl:text-sm font-serif font-bold text-white uppercase leading-tight text-center px-1 whitespace-normal w-full">
                    {getReputationInfo(clubData.reputationTier || 1, t).name}
                  </span>
                </div>

                {/* 3. Win Rate Box */}
                <div 
                  className="col-span-2 sm:col-span-1 lg:col-span-1 bg-[#111111]/95 border border-neutral-800 rounded-xl p-3 flex flex-col items-center justify-center text-center transition-all duration-300 hover:border-gold/30 hover:bg-white/[0.02] shadow-inner relative group/stat min-h-[135px] sm:min-h-[145px]"
                >
                  <div className="absolute top-0 right-0 w-8 h-8 bg-gold/5 blur-xl rounded-full" />
                  
                  {/* Radial circle */}
                  <div className="relative flex items-center justify-center w-12 h-12 mb-1 flex-shrink-0">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                      <path
                        className="text-white/[0.04]"
                        strokeWidth="2.5"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <motion.path
                        initial={{ strokeDasharray: "0, 100" }}
                        animate={{ strokeDasharray: `${winRate}, 100` }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        className="text-gold"
                        strokeDasharray={`${winRate}, 100`}
                        strokeWidth="3"
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    <div className="absolute flex items-center justify-center inset-0">
                      <span className="font-serif text-[10px] sm:text-xs font-black text-white leading-none glow-text-gold">{winRate}%</span>
                    </div>
                  </div>

                  <span className="text-[9px] sm:text-[10px] md:text-[11px] lg:text-xs font-sans uppercase tracking-[0.2em] font-semibold text-gray-400 mb-0.5 block leading-none">
                    Win Rate
                  </span>
                  <span className="text-[9px] text-[#0dd08b] font-serif font-bold uppercase tracking-wider leading-none">
                    {t("overview.activeForm")}
                  </span>
                </div>

                {/* 4. Bilancio Partite */}
                <div className="col-span-2 sm:col-span-3 lg:col-span-2 bg-[#111111]/95 border border-neutral-800 rounded-xl p-3 flex flex-col justify-between transition-all duration-300 hover:border-gold/30 hover:bg-white/[0.02] shadow-inner min-h-[135px] sm:min-h-[145px]">
                  
                  <div className="flex items-center justify-between text-[9px] sm:text-[10px] md:text-[11px] lg:text-xs font-bold tracking-wider text-white/40 uppercase font-serif mb-1">
                    <span>{t("overview.matchBalance")}</span>
                    <span>{totalMatches} {t("overview.playedCount")}</span>
                  </div>

                  {/* Ratio bar */}
                  <div className="h-2.5 w-full rounded-full bg-zinc-900/80 border border-white/5 overflow-hidden flex p-[1px] shadow-[inset_0_1px_2px_rgba(0,0,0,0.6)] mb-2">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${winPercent}%` }}
                      transition={{ duration: 1.2, ease: "easeOut" }}
                      className="h-full bg-gradient-to-r from-[#0dd08b] to-[#0bc080] rounded-l-full relative"
                    />
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${drawPercent}%` }}
                      transition={{ duration: 1.2, ease: "easeOut", delay: 0.1 }}
                      className="h-full bg-gradient-to-r from-zinc-500 to-zinc-400 border-x border-black/30 relative"
                    />
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${lossPercent}%` }}
                      transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 }}
                      className="h-full bg-gradient-to-r from-[#be213b] to-[#991527] rounded-r-full relative"
                    />
                  </div>

                  {/* Detailed columns */}
                  <div className="grid grid-cols-3 gap-1.5 text-center">
                    <div className="bg-zinc-950/80 border border-white/5 rounded-lg py-1 px-1 flex flex-col justify-center min-h-[36px]">
                      <span className="text-[9px] min-[400px]:text-[10px] xl:text-xs font-sans uppercase tracking-wider font-semibold text-gray-500">{t("overview.wins")}</span>
                      <span className="font-serif text-xs sm:text-sm font-bold text-gold block leading-none">{clubData.wins}</span>
                    </div>
                    <div className="bg-zinc-950/80 border border-white/5 rounded-lg py-1 px-1 flex flex-col justify-center min-h-[36px]">
                      <span className="text-[9px] min-[400px]:text-[10px] xl:text-xs font-sans uppercase tracking-wider font-semibold text-gray-500">{t("overview.draws")}</span>
                      <span className="font-serif text-xs sm:text-sm font-bold text-white/90 block leading-none">{clubData.draws}</span>
                    </div>
                    <div className="bg-zinc-950/80 border border-white/5 rounded-lg py-1 px-1 flex flex-col justify-center min-h-[36px]">
                      <span className="text-[9px] min-[400px]:text-[10px] xl:text-xs font-sans uppercase tracking-wider font-semibold text-gray-500">{t("overview.losses")}</span>
                      <span className="font-serif text-xs sm:text-sm font-bold text-[#be213b] block leading-none">{clubData.losses}</span>
                    </div>
                  </div>

                </div>

              </div>
            </div>

          </div>

        </div>
      </motion.div>
    </div>
  );
}
