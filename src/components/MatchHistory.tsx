/* RESPONSIVE: Mobile-first, fluid clamp(), auto-fit grid, card-transform tables */
import React, { useState, useEffect, Fragment } from "react";
import { ClubData, ClubMatch } from "../hooks/useClubData";
import { getResolvedRole } from "../utils/totw";
import { parseAndTranslateRole, translateRoleToItalian } from "../utils/roleUtils";

const getMatchTypeTranslation = (type: string, lang: string): string => {
  if (lang === "it") return type;
  const typeMappings: Record<string, string> = {
    "Campionato": "League Match",
    "Playoff": "Playoff Match",
    "Amichevole": "Friendly Match"
  };
  return typeMappings[type] || type;
};
import { Calendar, Award, Star, Clock, Flame, ChevronDown, ChevronUp, Shield } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useLanguage } from "../contexts/LanguageContext";
import { CrestImage } from "./Matches";
import H2HStats from "./H2HStats";

interface PlayerTableProps {
  players: any[];
  isOpponent?: boolean;
  t: (key: string) => string;
  language: string;
  membersList?: any[];
}

function PlayerTable({ players, isOpponent = false, t, language, membersList }: PlayerTableProps) {
  const [expandedPlayer, setExpandedPlayer] = useState<string | null>(null);

  if (!players || players.length === 0) {
    return (
      <div className="py-4 text-center text-white/30 text-xs italic font-sans">
        {t("members.noData")}
      </div>
    );
  }

  // Pass% text color
  const getPassPctClass = (pct: number | null) => {
    if (pct === null) return "text-white/30";
    if (pct >= 85) return "text-emerald-400 font-bold";
    if (pct < 70) return "text-rose-400 font-bold";
    return "text-white";
  };

  // Tackle% text color
  const getTacklePctClass = (pct: number | null) => {
    if (pct === null) return "text-white/30";
    if (pct >= 75) return "text-emerald-400 font-bold";
    if (pct < 50) return "text-rose-400 font-bold";
    return "text-white";
  };

  const DetailBox = ({ label, value, valueClass = "text-white" }: { label: string; value: React.ReactNode; valueClass?: string }) => (
    <div className="flex justify-between items-end border-b border-white/5 pb-1">
      <span className="text-[9px] font-sans uppercase tracking-widest text-gray-500">{label}</span>
      <span className={`text-sm font-serif font-bold ${valueClass}`}>{value}</span>
    </div>
  );

  return (
    <div className="w-full overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-zinc-900/40 to-black/40">
      {/* Intestazione */}
      <div className="flex items-center w-full px-2 py-3 border-b border-white/10 text-[9px] sm:text-[10px] font-sans uppercase tracking-[0.2em] text-gray-500 font-semibold select-none">
        <div className="w-6 shrink-0"></div> {/* Spazio per la freccetta */}
        <div className="flex-1 min-w-0">{t("members.table.player") || "Giocatore"}</div>
        <div className="w-12 text-center shrink-0">{t("members.table.role") || "Ruolo"}</div>
        <div className="w-8 text-center shrink-0">G</div>
        <div className="w-8 text-center shrink-0">A</div>
        <div className="w-14 text-right pr-2 shrink-0">{language === "it" ? "Voto" : "Rating"}</div>
      </div>

      {/* Lista Giocatori */}
      <div className="flex flex-col">
        {[...players]
          .sort((a, b) => b.rating - a.rating)
          .map((p) => {
            const isExpanded = expandedPlayer === p.name;
            const initials = p.name.substring(0, 2).toUpperCase();
            
            let roleInfo = { label: "CEN", style: "bg-emerald-500/10 border-emerald-500/40 text-emerald-400" };
            const matchCategory = (p.role || "Midfielder").toLowerCase(); // "forward", "midfielder", "defender", "goalkeeper"
            
            let badgeStyle = "bg-emerald-500/10 border-emerald-500/40 text-emerald-400";
            if (matchCategory === "forward") {
              badgeStyle = "bg-rose-500/10 border-rose-500/40 text-rose-400";
            } else if (matchCategory === "defender") {
              badgeStyle = "bg-blue-500/10 border-blue-500/40 text-blue-400";
            } else if (matchCategory === "goalkeeper") {
              badgeStyle = "bg-yellow-500/10 border-yellow-500/40 text-yellow-500";
            }

            let badgeLabel = "CEN";
            if (language === "it") {
              badgeLabel = translateRoleToItalian(p.pos !== undefined ? p.pos : p.role);
            } else {
              switch (matchCategory) {
                case "forward": badgeLabel = "FW"; break;
                case "defender": badgeLabel = "DEF"; break;
                case "goalkeeper": badgeLabel = "GK"; break;
                default: badgeLabel = "MID"; break;
              }
            }

            roleInfo = { label: badgeLabel, style: badgeStyle };

            // Calc Pass %
            const pPct = p.passAttempts > 0 
              ? Math.round((p.passesMade / p.passAttempts) * 100) 
              : null;
            
            // Calc Tackle %
            const tPct = p.tackleAttempts > 0 
              ? Math.round((p.tacklesMade / p.tackleAttempts) * 100) 
              : null;

            return (
              <div 
                key={p.name}
                className="flex flex-col border-b border-white/5 last:border-0 group cursor-pointer hover:bg-white/5 transition-colors"
              >
                {/* Riga Chiusa */}
                <div 
                  className="flex items-center w-full px-2 py-3 select-none"
                  onClick={() => setExpandedPlayer(isExpanded ? null : p.name)}
                >
                  {/* Freccia */}
                  <div className="w-6 text-gray-500 shrink-0 flex items-center justify-center">
                    <svg className={`w-4 h-4 transform transition-transform duration-200 ${isExpanded ? "rotate-180 text-gold" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>

                  {/* Avatar e Nome */}
                  <div className="flex-1 flex items-center gap-2 min-w-0 pr-2">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-black border border-white/20 flex items-center justify-center shrink-0">
                      <span className="text-[9px] sm:text-[10px] text-gray-400 font-bold">{initials}</span>
                    </div>
                    <span className="text-xs sm:text-sm font-bold text-white truncate">{p.name}</span>
                  </div>

                  {/* Ruolo */}
                  <div className="w-12 flex justify-center shrink-0">
                    <span className={`px-1.5 py-0.5 rounded border text-[9px] sm:text-[9px] font-black ${roleInfo.style}`}>
                      {roleInfo.label}
                    </span>
                  </div>

                  {/* G e A */}
                  <div className="w-8 text-center text-xs sm:text-sm font-serif text-white shrink-0">
                    {p.goals > 0 ? <span className="text-emerald-400 font-bold">{p.goals}</span> : "-"}
                  </div>
                  <div className="w-8 text-center text-xs sm:text-sm font-serif text-white shrink-0">
                    {p.assists > 0 ? <span className="text-[#d7ae6a] font-bold">{p.assists}</span> : "-"}
                  </div>

                  {/* Voto con Glow */}
                  <div className="w-14 flex justify-end shrink-0 pr-2">
                    <div className={`px-2 py-0.5 rounded text-center min-w-[42px] ${
                      p.rating >= 9.5 
                        ? "bg-yellow-500/10 border border-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.3)] text-yellow-500 font-black"
                        : p.rating >= 8.0
                          ? "bg-emerald-500/10 border border-emerald-500/40 text-emerald-400 font-bold"
                          : p.rating >= 7.0
                            ? "bg-sky-500/10 border border-sky-500/40 text-sky-400 font-medium"
                            : "bg-zinc-900 border border-zinc-800 text-zinc-400 font-normal"
                    }`}>
                      <span className="text-xs sm:text-sm font-serif font-bold">
                        {p.rating.toFixed(1)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Dettagli Espansi */}
                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: "easeInOut" }}
                      className="overflow-hidden bg-black/20"
                    >
                      <div className="w-full px-4 pb-4 pt-1">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-3 gap-x-4">
                          <DetailBox 
                            label={language === "it" ? "Tiri" : "Shots"} 
                            value={p.shots} 
                          />
                          <DetailBox 
                            label={language === "it" ? "Pass." : "Passes"} 
                            value={`${p.passesMade}/${p.passAttempts}`} 
                          />
                          <DetailBox 
                            label="Pass%" 
                            value={pPct !== null ? `${pPct}%` : "-"} 
                            valueClass={getPassPctClass(pPct)} 
                          />
                          <DetailBox 
                            label={language === "it" ? "Contrasti" : "Tackles"} 
                            value={`${p.tacklesMade}/${p.tackleAttempts}`} 
                          />
                          <DetailBox 
                            label={language === "it" ? "Contrasti%" : "Tkl%"} 
                            value={tPct !== null ? `${tPct}%` : "-"} 
                            valueClass={getTacklePctClass(tPct)} 
                          />
                          <DetailBox 
                            label={language === "it" ? "Parate" : "Saves"} 
                            value={p.saves} 
                            valueClass={p.saves > 0 ? "text-sky-400" : "text-white"} 
                          />
                          <DetailBox 
                            label={language === "it" ? "Rossi" : "Reds"} 
                            value={p.redCards > 0 ? "🟥" : "-"} 
                            valueClass={p.redCards > 0 ? "text-rose-500 font-extrabold" : "text-white/30"} 
                          />
                          <DetailBox 
                            label="MVP" 
                            value={p.motm === 1 ? "⭐" : "-"} 
                            valueClass={p.motm === 1 ? "text-amber-400" : "text-white/30"} 
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
      </div>
    </div>
  );
}

interface MatchHistoryProps {
  clubData: ClubData;
}

type FilterType = "Tutte" | "Campionato" | "Playoff" | "Amichevole";

interface ClubCrestProps {
  crestId?: number | string;
  clubName: string;
  abbreviation: string;
  isHome?: boolean;
}

function ClubCrest({ crestId, clubName, abbreviation, isHome }: ClubCrestProps) {
  return (
    <div className="w-7 h-7 sm:w-10 sm:h-10 flex items-center justify-center flex-shrink-0">
      <CrestImage crestId={crestId || ""} className="w-full h-full object-contain select-none drop-shadow-sm" alt={clubName} />
    </div>
  );
}

function MatchCrestImage({ 
  crestId, 
  fallbackUrl, 
  teamName, 
  className 
}: { 
  crestId?: number | string; 
  fallbackUrl?: string; 
  teamName: string; 
  className: string; 
}) {
  return (
    <CrestImage crestId={crestId || ""} className={className} alt={teamName} />
  );
}

export default function MatchHistory({ clubData }: MatchHistoryProps) {
  const { t, language } = useLanguage();
  const [activeFilter, setActiveFilter] = useState<FilterType>("Tutte");
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [visibleCount, setVisibleCount] = useState(5);
  const [activeTeamTabs, setActiveTeamTabs] = useState<Record<number, "home" | "away">>({});

  // Filters logic
  const filteredMatches = clubData.matches.filter((m) => {
    if (activeFilter === "Tutte") return true;
    return m.type === activeFilter;
  });

  const handleToggleExpand = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  // Framer Motion variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 100, damping: 15 } },
  };

  return (
    <div className="flex flex-col gap-6 sm:gap-8 w-full" id="match-history-view">
      {/* SECTION TITLE */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-2">
        <h2 className="font-serif text-3xl sm:text-4xl text-white font-black tracking-widest uppercase flex flex-col">
          <span className="text-white/40 text-xs font-sans font-bold tracking-[0.2em] mb-1">{t("matches.sectionTitle")}</span>
          {t("matches.sectionSubtitle")}
        </h2>
        <div className="hidden md:block h-[1px] bg-gradient-to-r from-white/20 to-transparent flex-grow ml-12"></div>
      </div>

      {/* 1. FILTRI PARTITE */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3" id="matches-type-filters">
        {(["Tutte", "Campionato", "Playoff", "Amichevole"] as FilterType[]).map((filter) => {
          const isActive = activeFilter === filter;
          return (
            <button
              key={filter}
              onClick={() => {
                setActiveFilter(filter);
                setExpandedIndex(null); // Reset expansion on filter change
                setVisibleCount(5);
              }}
              className={`px-4 sm:px-5 py-2.5 rounded-full text-xs font-semibold uppercase tracking-widest transition-all duration-300 cursor-pointer focus:outline-none ${
                isActive
                  ? "bg-gold text-black font-bold shadow-[0_0_20px_rgba(215,174,106,0.25)]"
                  : "bg-white/[0.03] text-white/60 hover:text-white hover:bg-white/[0.06] border border-white/10"
              }`}
            >
              {filter === "Tutte" ? t("matches.filters.all") : 
               filter === "Campionato" ? t("matches.filters.league") : 
               filter === "Playoff" ? t("matches.filters.playoff") : 
               filter === "Amichevole" ? t("matches.filters.friendly") : filter}
            </button>
          );
        })}
      </div>

      {/* 2. LISTA CARD PARTITE */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="flex flex-col gap-4"
        id="matches-cards-container"
      >
        <AnimatePresence mode="popLayout">
          {filteredMatches.length === 0 ? (
            <motion.div
              key="empty-matches"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-16 text-center text-white/30 text-sm font-sans bg-white/[0.01] border border-white/5 rounded-2xl"
            >
              {t("matches.noMatches")}
            </motion.div>
          ) : (
            filteredMatches.slice(0, visibleCount).map((match, idx) => {
              const isExpanded = expandedIndex === idx;
              
              // Score colors: Green for Win, Red for Loss, White/Amber for Draw
              const getScoreColorClass = (result: "W" | "D" | "L") => {
                if (result === "W") return "text-[#0dd08b]";
                if (result === "L") return "text-[#be213b]";
                return "text-white";
              };

              const getHoverGlowClass = (result: "W" | "D" | "L") => {
                if (result === "W") return "hover:border-gold/80 hover:shadow-[0_0_40px_rgba(215,174,106,0.4)]";
                if (result === "L") return "hover:border-[#be213b]/80 hover:shadow-[0_0_40px_rgba(190,33,59,0.4)]";
                return "hover:border-zinc-400/80 hover:shadow-[0_0_40px_rgba(161,161,170,0.4)]";
              };

              const scoreParts = (match.score || "0 - 0").split("-");
              const scoreLeft = scoreParts[0] ? scoreParts[0].trim() : "0";
              const scoreRight = scoreParts[1] ? scoreParts[1].trim() : "0";

              const homeLogo = match.homeCrestId
                ? `https://eafc25.content.easports.com/fifa/fltOnlineAssets/24B23FDE-7835-41C2-87A2-F453DFDB2E82/2024/fcweb/crests/256x256/l${match.homeCrestId}.png`
                : "/uploads/logo.jpg";

              const awayLogo = match.opponentCrestId
                ? `https://eafc25.content.easports.com/fifa/fltOnlineAssets/24B23FDE-7835-41C2-87A2-F453DFDB2E82/2024/fcweb/crests/256x256/l${match.opponentCrestId}.png`
                : "https://res.cloudinary.com/kwwyxgal/image/upload/v1783610453/LOGO_IGLOO_Studios.pdf_xledzj.png";

              const homeScoreColorClass = match.result === "W" ? "text-[#0dd08b]" : match.result === "L" ? "text-[#be213b]" : "text-white";
              const awayScoreColorClass = match.result === "L" ? "text-[#0dd08b]" : match.result === "W" ? "text-[#be213b]" : "text-white/80";

              return (
                <motion.div
                   key={`${match.opponent}-${idx}`}
                  variants={cardVariants}
                  layout="position"
                  className={`bg-gradient-to-br from-zinc-900/80 to-zinc-950/90 backdrop-blur-xl border ${
                    isExpanded ? "border-gold/40 bg-zinc-900/20" : `border-white/10 ${getHoverGlowClass(match.result)} transition-all duration-500`
                  } rounded-2xl overflow-hidden transition-all duration-300 shadow-[0_8px_30px_rgba(0,0,0,0.35)]`}
                >
                  {/* Clickable Card Header */}
                  <div
                    onClick={() => handleToggleExpand(idx)}
                    className="p-3 sm:p-4.5 cursor-pointer select-none"
                  >
                    {/* Top row: Date/Type info */}
                    <div className="flex items-center justify-between w-full text-[10px] uppercase font-sans tracking-wider text-white/40 pb-2 border-b border-white/5 mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="bg-white/[0.04] px-2 py-0.5 rounded border border-white/5 flex items-center gap-1 leading-none text-[9px] font-bold">
                          <span className="text-white/40 font-semibold uppercase">
                            {match.timeAgoText ? (match.timeAgoText.split("\n")[0] === "Ore fa:" ? t("matches.hour") : match.timeAgoText.split("\n")[0]) : t("matches.hour")}
                          </span>
                          <span className="text-gold font-black font-serif">
                            {match.timeAgoText ? match.timeAgoText.split("\n")[1] : "12"}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white/60">
                          {getMatchTypeTranslation(match.type, language)}
                        </span>
                        {match.result === "W" ? (
                          <span className="bg-[#0dd08b]/10 border border-[#0dd08b]/30 text-[#0dd08b] font-extrabold text-[9px] px-2 py-0.5 rounded-full">
                            W
                          </span>
                        ) : match.result === "D" ? (
                          <span className="bg-zinc-800 border border-white/10 text-white/70 font-extrabold text-[9px] px-2 py-0.5 rounded-full">
                            D
                          </span>
                        ) : (
                          <span className="bg-[#be213b]/10 border border-[#be213b]/30 text-[#be213b] font-extrabold text-[9px] px-2 py-0.5 rounded-full">
                            L
                          </span>
                        )}
                      </div>
                    </div>

                    {/* INTESTAZIONE PARTITA - LAYOUT A T */}
                    <div className="flex justify-between items-start w-full mt-4 mb-6 px-2">
                      
                      {/* SQUADRA CASA (Nome SOTTO il logo) */}
                      <div className="flex flex-col items-center w-[30%] min-w-0">
                        <MatchCrestImage 
                          crestId={match.homeCrestId} 
                          fallbackUrl="https://res.cloudinary.com/kwwyxgal/image/upload/v1785138160/Progetto_senza_titolo_-_2026-07-27T094228.277_yychku.png" 
                          teamName={clubData.name} 
                          className="w-12 h-12 sm:w-16 sm:h-16 object-contain drop-shadow-md mb-2" 
                        />
                        <span className="text-[10px] sm:text-xs font-bold text-white text-center leading-tight break-words line-clamp-2 w-full">
                          {clubData.name}
                        </span>
                      </div>

                      {/* PUNTEGGIO CENTRALE (Numeri in Serif) */}
                      <div className="flex flex-col items-center justify-start w-[40%] pt-1">
                        <div className="flex items-center justify-center gap-2 sm:gap-3 mb-2">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center shadow-inner">
                            <span className={`text-xl sm:text-2xl font-serif font-black ${homeScoreColorClass}`}>
                              {scoreLeft}
                            </span>
                          </div>
                          <span className="text-gray-500 font-bold text-lg">:</span>
                          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center shadow-inner">
                            <span className={`text-xl sm:text-2xl font-serif font-black ${awayScoreColorClass}`}>
                              {scoreRight}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* SQUADRA TRASFERTA (Nome SOTTO il logo) */}
                      <div className="flex flex-col items-center w-[30%] min-w-0">
                        <MatchCrestImage 
                          crestId={match.opponentCrestId} 
                          fallbackUrl="https://res.cloudinary.com/kwwyxgal/image/upload/v1783610453/LOGO_IGLOO_Studios.pdf_xledzj.png" 
                          teamName={match.opponent} 
                          className="w-12 h-12 sm:w-16 sm:h-16 object-contain drop-shadow-md mb-2" 
                        />
                        <span className="text-[10px] sm:text-xs font-bold text-gray-300 text-center leading-tight break-words line-clamp-2 w-full">
                          {match.opponent}
                        </span>
                      </div>

                    </div>

                    {/* Bottom Metadata row */}
                    <div className="flex items-center justify-between w-full mt-3 pt-2 border-t border-white/5">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] text-white/40 uppercase tracking-widest">
                          MVP:
                        </span>
                        <span className="text-[10px] text-gold font-serif font-bold flex items-center gap-1 bg-gold/5 px-2 py-0.5 rounded border border-gold/15">
                          <Award className="w-3 h-3 text-gold" /> {match.mvp}
                        </span>
                      </div>
                      
                      <div className="text-[10px] text-white/40 font-sans flex items-center gap-1 group-hover:text-gold transition-colors">
                        <span>{t("overview.best") === "MIGLIOR:" ? "DETTAGLI" : "DETAILS"}</span>
                        {isExpanded ? (
                          <ChevronUp className="w-3.5 h-3.5 text-gold" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 animate-pulse" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 3. ESPANSIONE DETTAGLIO */}
                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden bg-black/60 border-t border-white/5"
                      >
                        <div className="p-3.5 sm:p-5 flex flex-col gap-5">
                          
                          {/* SEZIONE 1: Team Statistics (H2H Bar Chart) */}
                          <div className="flex flex-col gap-3">
                            <H2HStats match={match} clubName={clubData.name} />
                          </div>

                          {/* SEZIONE 2 & 3: Player Performance - Tab Selector & Table */}
                          <div className="flex flex-col gap-3">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-2">
                              <h4 className="text-[10px] uppercase tracking-[0.15em] text-gold/80 font-bold font-sans flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse"></span>
                                {t("overview.best") === "MIGLIOR:" ? "Prestazioni Giocatori" : "Player Performances"}
                              </h4>
                              
                              {/* Switcher / Selector */}
                              {match.oppPlayers && match.oppPlayers.length > 0 && (
                                <div className="flex items-center gap-1 p-0.5 bg-zinc-950/80 border border-white/10 rounded-lg">
                                  <button
                                    type="button"
                                    onClick={() => setActiveTeamTabs({ ...activeTeamTabs, [idx]: "home" })}
                                    className={`py-1 px-3 text-[10px] font-black uppercase tracking-widest rounded-md transition-all duration-300 ${
                                      (activeTeamTabs[idx] || "home") === "home"
                                        ? "bg-gold text-black shadow-[0_0_10px_rgba(215,174,106,0.2)]"
                                        : "bg-transparent text-white/50 hover:text-white"
                                    }`}
                                  >
                                    {language === "it" ? "La Mia Squadra" : "My Team"}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setActiveTeamTabs({ ...activeTeamTabs, [idx]: "away" })}
                                    className={`py-1 px-3 text-[10px] font-black uppercase tracking-widest rounded-md transition-all duration-300 ${
                                      (activeTeamTabs[idx] || "home") === "away"
                                        ? "bg-gold text-black shadow-[0_0_10px_rgba(215,174,106,0.2)]"
                                        : "bg-transparent text-white/50 hover:text-white"
                                    }`}
                                  >
                                    {language === "it" ? "Avversari" : "Opponents"}
                                  </button>
                                </div>
                              )}
                            </div>

                            {/* Show active team table */}
                            {((activeTeamTabs[idx] || "home") === "home" || !match.oppPlayers || match.oppPlayers.length === 0) ? (
                              <PlayerTable 
                                players={match.players} 
                                isOpponent={false} 
                                t={t} 
                                language={language} 
                                membersList={clubData.membersList}
                              />
                            ) : (
                              <PlayerTable 
                                players={match.oppPlayers} 
                                isOpponent={true} 
                                t={t} 
                                language={language} 
                                membersList={clubData.membersList}
                              />
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </motion.div>

      {/* Show More Matches Button to prevent infinite scrolling */}
      {filteredMatches.length > visibleCount && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-center mt-2 w-full"
        >
          <button
            onClick={() => setVisibleCount(prev => prev + 5)}
            className="relative group overflow-hidden flex items-center justify-center gap-3 bg-zinc-950 hover:bg-zinc-900 text-gold border border-gold/30 hover:border-gold/80 px-8 py-3.5 text-xs tracking-[0.25em] font-serif uppercase font-black rounded-xl transition-all duration-300 shadow-[0_4px_15px_rgba(0,0,0,0.5)] active:scale-95 cursor-pointer"
          >
            {/* Shimmer Light Sweep Effect */}
            <div className="absolute inset-0 w-[200%] h-full bg-gradient-to-r from-transparent via-gold/15 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_ease-in-out_infinite] pointer-events-none" />
            
            <span>{t("matches.showMore")} (+{filteredMatches.length - visibleCount})</span>
          </button>
        </motion.div>
      )}
    </div>
  );
}
