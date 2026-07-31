import { useState } from "react";
import { ClubData, ClubMatch } from "../hooks/useClubData";
import { Award, Zap, Activity } from "lucide-react";
import { motion } from "motion/react";
import { useLanguage } from "../contexts/LanguageContext";
import { CrestImage } from "./Matches";
import H2HStats from "./H2HStats";

const getMatchTypeTranslation = (type: string, lang: string): string => {
  if (lang === "it") return type;
  const typeMappings: Record<string, string> = {
    "Campionato": "League Match",
    "Playoff": "Playoff Match",
    "Amichevole": "Friendly Match"
  };
  return typeMappings[type] || type;
};

interface ClubCrestProps {
  crestId?: number | string;
  clubName: string;
  abbreviation: string;
  isHome?: boolean;
}

function ClubCrest({ crestId, clubName, abbreviation, isHome }: ClubCrestProps) {
  return (
    <div className="w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center flex-shrink-0">
      <CrestImage crestId={crestId || ""} className="w-full h-full object-contain select-none drop-shadow-md" alt={clubName} />
    </div>
  );
}

interface LastMatchProps {
  clubData: ClubData;
}

export default function LastMatch({ clubData }: LastMatchProps) {
  const { t, language } = useLanguage();

  const latestMatch: ClubMatch = clubData.matches[0] || {
    opponent: "Elite Madrid FC",
    score: "4 - 0",
    result: "W" as const,
    date: "Ieri, 22:30",
    type: "League Match" as const,
    isHome: true,
    mvp: "Skifo89",
    matchStats: {
      home: { shotsOnTarget: 8, passes: 120, tackles: 15, saves: 2, redCards: 0 },
      away: { shotsOnTarget: 3, passes: 85, tackles: 10, saves: 4, redCards: 0 }
    },
    players: [],
    oppPlayers: [],
    opponentAbbreviation: "ELI",
    day: "08",
    month: "LUG",
    homeCrestId: undefined,
    opponentCrestId: undefined
  };

  const getGlowStyles = (result: "W" | "D" | "L") => {
    if (result === "W") {
      return {
        cardHover: "hover:border-gold/80 hover:shadow-[0_0_30px_rgba(215,174,106,0.25)]",
        bgGlow: "bg-[#0dd08b]/2",
        topLine: "via-[#0dd08b]"
      };
    } else if (result === "L") {
      return {
        cardHover: "hover:border-[#be213b]/80 hover:shadow-[0_0_30px_rgba(190,33,59,0.25)]",
        bgGlow: "bg-[#be213b]/2",
        topLine: "via-[#be213b]"
      };
    } else {
      return {
        cardHover: "hover:border-zinc-400/80 hover:shadow-[0_0_30px_rgba(161,161,170,0.25)]",
        bgGlow: "bg-zinc-400/2",
        topLine: "via-zinc-500"
      };
    }
  };

  const glowStyles = getGlowStyles(latestMatch.result);

  return (
    <div className="w-full" id="sezione-ultima-partita-spostata">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4">
        <h3 className="font-serif text-xl sm:text-2xl text-white font-black tracking-widest uppercase flex flex-col">
          <span className="text-white/40 text-[10px] font-sans font-bold tracking-[0.2em] mb-1">
            {t("overview.recentStats")}
          </span>
          {t("overview.lastPlayedMatch")}
        </h3>
        <div className="hidden md:block h-[1px] bg-gradient-to-r from-white/20 to-transparent flex-grow ml-8"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={`rounded-2xl p-5 sm:p-6 bg-gradient-to-br from-zinc-900/90 to-zinc-950/90 backdrop-blur-xl border border-white/10 ${glowStyles.cardHover} transition-all duration-500 relative overflow-hidden group w-full`}
      >
        <div className={`absolute top-0 right-0 w-80 h-80 ${glowStyles.bgGlow} blur-[80px] pointer-events-none rounded-full`} />
        <div className={`absolute top-0 left-0 w-full h-[1.5px] bg-gradient-to-r from-transparent ${glowStyles.topLine} to-transparent pointer-events-none`} />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Left Column: Scoreboard */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center border-b lg:border-b-0 lg:border-r border-white/5 pb-6 lg:pb-0 lg:pr-6">
            <div className="flex justify-between items-start w-full px-2 mb-6 mt-4">
              
              {/* Squadra Casa */}
              <div className="flex flex-col items-center w-[30%] min-w-0">
                <div className="w-12 h-12 sm:w-16 sm:h-16 mb-2">
                  <ClubCrest
                    crestId={latestMatch.homeCrestId}
                    clubName={clubData.name}
                    abbreviation={(clubData.name || "WHT").substring(0, 3).toUpperCase()}
                    isHome={true}
                  />
                </div>
                <span className="text-[10px] sm:text-xs font-bold text-white text-center leading-tight break-words line-clamp-2 w-full">
                  {clubData.name}
                </span>
              </div>

              {/* Punteggio Centrale */}
              <div className="flex flex-col items-center justify-start w-[40%] pt-1">
                <div className="flex items-center justify-center gap-2 sm:gap-4 mb-2">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center shadow-inner">
                    <span className={`text-xl sm:text-2xl font-serif font-black ${latestMatch.result === "W" ? "text-green-400" : latestMatch.result === "L" ? "text-red-500" : "text-white"}`}>
                      {latestMatch.score.split("-")[0]?.trim() || "0"}
                    </span>
                  </div>
                  <span className="text-gray-500 font-bold">-</span>
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center shadow-inner">
                    <span className={`text-xl sm:text-2xl font-serif font-black ${latestMatch.result === "L" ? "text-green-400" : latestMatch.result === "W" ? "text-red-500" : "text-white"}`}>
                      {latestMatch.score.split("-")[1]?.trim() || "0"}
                    </span>
                  </div>
                </div>
                
                {latestMatch.result === "W" ? (
                  <span className="px-3 py-1 rounded-full border border-green-500/30 text-[10px] tracking-widest uppercase text-green-400 font-bold bg-green-500/10 shadow-[0_0_15px_rgba(74,222,128,0.15)]">
                    {t("overview.win").toUpperCase()}
                  </span>
                ) : latestMatch.result === "D" ? (
                  <span className="px-3 py-1 rounded-full border border-zinc-500/30 text-[10px] tracking-widest uppercase text-zinc-400 font-bold bg-zinc-500/10">
                    {t("overview.draw").toUpperCase()}
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full border border-red-500/30 text-[10px] tracking-widest uppercase text-red-500 font-bold bg-red-500/10 shadow-[0_0_15px_rgba(239,68,68,0.15)]">
                    {t("overview.loss").toUpperCase()}
                  </span>
                )}
              </div>

              {/* Squadra Trasferta */}
              <div className="flex flex-col items-center w-[30%] min-w-0">
                <div className="w-12 h-12 sm:w-16 sm:h-16 mb-2">
                  <ClubCrest
                    crestId={latestMatch.opponentCrestId}
                    clubName={latestMatch.opponent}
                    abbreviation={latestMatch.opponentAbbreviation}
                    isHome={false}
                  />
                </div>
                <span className="text-[10px] sm:text-xs font-bold text-gray-300 text-center leading-tight break-words line-clamp-2 w-full">
                  {latestMatch.opponent}
                </span>
              </div>

            </div>
          </div>

          {/* Right Column: Stats and Metadata */}
          <div className="lg:col-span-7 flex flex-col justify-between h-full w-full font-sans">
            <div className="flex flex-col gap-3">
              {/* MVP card */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center justify-between shadow-inner">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-gold" />
                  <span className="text-[10px] sm:text-xs font-sans uppercase tracking-[0.2em] font-semibold text-gray-400">{t("overview.mvpMatch")}</span>
                </div>
                <span className="text-sm sm:text-base font-serif font-bold text-gold drop-shadow-md uppercase tracking-wide">{latestMatch.mvp || "N/A"}</span>
              </div>
            </div>

            {/* H2H Bar Chart Comparison Module */}
            <H2HStats match={latestMatch} clubName={clubData.name} />

            {/* Bottom Metadata */}
            <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center text-[10px] font-sans tracking-widest uppercase text-white/40">
              <span className="flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-[#0dd08b]" />
                {getMatchTypeTranslation(latestMatch.type, language)}
              </span>
              <span>
                {latestMatch.timeAgoText ? latestMatch.timeAgoText.replace("\n", " ") : (t("overview.best") === "MIGLIOR:" ? "Giocata di recente" : "Recently Played")}
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
