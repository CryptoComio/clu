/* RESPONSIVE: Mobile-first, fluid clamp(), auto-fit grid, card-transform tables */
import { useState, useMemo, useEffect } from "react";
import { ClubData, ClubMember } from "../hooks/useClubData";
import { Star, Shield, Users, Trophy, Award, ArrowUpDown, ChevronUp, ChevronDown, Search, List, ListOrdered } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useLanguage } from "../contexts/LanguageContext";
import { parseAndTranslateRole, groupPlayersByTacticalCategory } from "../utils/roleUtils";
import { calculatePreviousWeekPlayerStats } from "../utils/totw";
import MembersRanking from "./MembersRanking";
import PlayerCardModal from "./PlayerCardModal";

interface MembersListProps {
  clubData: ClubData;
}

type FilterRole = "All" | "defender" | "goalkeeper" | "midfielder" | "forward";

type SortKey = "name" | "overall" | "games" | "goals" | "assists" | "passes" | "passPercent" | "tackles" | "tacklePercent" | "cleanSheets" | "winPercent";
type SortDirection = "asc" | "desc";

export default function MembersList({ clubData }: MembersListProps) {
  const { t, language } = useLanguage();
  const [activeFilter, setActiveFilter] = useState<FilterRole>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("overall");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [visibleCount, setVisibleCount] = useState(50);
  const [viewMode, setViewMode] = useState<"grid" | "ranking">("grid");
  const [selectedMember, setSelectedMember] = useState<ClubMember | null>(null);

  const weeklyStatsMap = useMemo(() => {
    const stats = calculatePreviousWeekPlayerStats(clubData.matches || [], clubData.membersList || []);
    const map = new Map<string, typeof stats[0]>();
    stats.forEach(ws => {
      if (ws.name) map.set(ws.name.toLowerCase().trim(), ws);
      if (ws.proName) map.set(ws.proName.toLowerCase().trim(), ws);
    });
    return map;
  }, [clubData.matches, clubData.membersList]);

  const handleSelectMember = (member: ClubMember) => {
    const nameKey = member.name ? member.name.toLowerCase().trim() : "";
    const proKey = member.proName ? member.proName.toLowerCase().trim() : "";
    const ws = weeklyStatsMap.get(nameKey) || weeklyStatsMap.get(proKey);
    if (ws && ws.weeklyStats) {
      setSelectedMember({
        ...member,
        weeklyStats: ws.weeklyStats
      });
    } else {
      setSelectedMember(member);
    }
  };

  // Ascolta l'evento per cambiare vista dalla Overview (Classifica Completa)
  useEffect(() => {
    const handleSetView = (e: any) => {
      setViewMode(e.detail);
      if (e.detail === 'ranking') {
        // Opzionalmente scrolla all'inizio della lista
        document.getElementById('members-controls')?.scrollIntoView({ behavior: 'smooth' });
      }
    };
    window.addEventListener('set-members-view', handleSetView);
    return () => window.removeEventListener('set-members-view', handleSetView);
  }, []);

  // Reset pagination when filter or search changes
  useEffect(() => {
    setVisibleCount(50);
  }, [activeFilter, searchQuery]);

  const tacticalGroups = useMemo(() => {
    return groupPlayersByTacticalCategory(clubData.membersList);
  }, [clubData.membersList]);

  // Dynamic counts calculations
  const counts = useMemo(() => {
    return {
      All: clubData.membersList.length,
      goalkeeper: tacticalGroups.goalkeepers.length,
      defender: tacticalGroups.defenders.length,
      midfielder: tacticalGroups.midfielders.length,
      forward: tacticalGroups.attackers.length,
    };
  }, [clubData.membersList, tacticalGroups]);

  // Handle Sort Toggle
  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDirection("desc");
    }
  };

  // Filtered and Sorted Members
  const filteredAndSortedMembers = useMemo(() => {
    // 1. Filter
    let items = [...clubData.membersList];
    if (activeFilter !== "All") {
      if (activeFilter === "goalkeeper") {
        items = tacticalGroups.goalkeepers;
      } else if (activeFilter === "defender") {
        items = tacticalGroups.defenders;
      } else if (activeFilter === "midfielder") {
        items = tacticalGroups.midfielders;
      } else if (activeFilter === "forward") {
        items = tacticalGroups.attackers;
      }
    }
    
    // Add Search Query
    if (searchQuery) {
      items = items.filter((m) => m.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }

    // 2. Sort
    items.sort((a, b) => {
      let valA = a[sortKey];
      let valB = b[sortKey];

      // Case-insensitive sorting for strings (like name)
      if (typeof valA === "string" && typeof valB === "string") {
        valA = valA.toLowerCase();
        valB = valB.toLowerCase();
      }

      if (valA < valB) return sortDirection === "asc" ? -1 : 1;
      if (valA > valB) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    return items;
  }, [clubData.membersList, tacticalGroups, activeFilter, searchQuery, sortKey, sortDirection]);

  // Translate category to readable singular/plural
  const getRoleLabel = (cat: FilterRole) => {
    switch (cat) {
      case "All":
        return t("members.filters.all");
      case "defender":
        return t("members.filters.defender");
      case "goalkeeper":
        return t("members.filters.goalkeeper");
      case "midfielder":
        return t("members.filters.midfielder");
      case "forward":
        return t("members.filters.forward");
    }
  };

  const getRoleBadgeStyle = (siglaOrCategory: string) => {
    const key = (siglaOrCategory || "").toUpperCase();
    switch (key) {
      case "POR":
      case "GOALKEEPER":
        return "bg-gold/15 text-gold border border-gold/30";
      case "DC":
      case "TS":
      case "TD":
      case "ASA":
      case "ADA":
      case "DEFENDER":
        return "bg-blue-500/15 text-blue-400 border border-blue-500/30";
      case "CDC":
      case "CC":
      case "ES":
      case "ED":
      case "MIDFIELDER":
        return "bg-[#0dd08b]/15 text-[#0dd08b] border border-[#0dd08b]/30";
      case "COC":
      case "ATT":
      case "AT":
      case "AS":
      case "AD":
      case "FORWARD":
        return "bg-[#be213b]/15 text-[#be213b] border border-[#be213b]/30";
      default:
        return "bg-zinc-800 text-zinc-300 border border-zinc-700/50";
    }
  };

  // Helper to render sorting indicators
  const renderSortIndicator = (key: SortKey) => {
    if (sortKey !== key) {
      return <ArrowUpDown className="w-3 h-3 ml-1 text-white/20 group-hover/header:text-white/40 transition-colors" />;
    }
    return sortDirection === "asc" ? (
      <ChevronUp className="w-3.5 h-3.5 ml-0.5 text-gold" />
    ) : (
      <ChevronDown className="w-3.5 h-3.5 ml-0.5 text-gold" />
    );
  };

  return (
    <div className="flex flex-col gap-6 sm:gap-8 w-full" id="members-list-view">
      {/* SECTION TITLE */}
      <div className="mb-6">
        <span className="text-[10px] sm:text-xs font-sans uppercase tracking-[0.2em] font-semibold text-gray-400 mb-1 block">
          {t("members.sectionTitle")}
        </span>
        <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white uppercase tracking-widest">
          {t("members.sectionSubtitle")}
        </h2>
      </div>

      {/* 1. HEADER RIASSUNTO (5 box liquid-glass with brand colors) */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3" id="members-summary-header">
        {/* Total Members */}
        <div className="col-span-2 md:col-span-1 flex flex-col p-4 bg-gradient-to-b from-[#d7ae6a]/10 to-white/5 border border-white/5 border-t-2 border-t-[#d7ae6a] rounded-xl shadow-lg transition-all duration-500 hover:shadow-[0_0_20px_rgba(215,174,106,0.25)]">
          <span className="text-[10px] font-sans uppercase tracking-[0.2em] font-semibold text-[#a89b8a] mb-1">
            {t("members.tactical.total")}
          </span>
          <span className="text-3xl font-serif font-black text-white mt-auto select-none">
            {clubData.membersList.length}
          </span>
        </div>

        {/* Portieri */}
        <div className="flex flex-col p-4 bg-gradient-to-b from-[#eab308]/10 to-white/5 border border-white/5 border-t-2 border-t-[#eab308] rounded-xl shadow-lg transition-all duration-500 hover:shadow-[0_0_20px_rgba(234,179,8,0.15)]">
          <span className="text-[10px] font-sans uppercase tracking-[0.2em] font-semibold text-[#a89b8a] mb-1">
            {t("members.tactical.goalkeeper")}
          </span>
          <span className="text-3xl font-serif font-black text-white mt-auto select-none">
            {tacticalGroups.goalkeepers.length}
          </span>
        </div>

        {/* Difensori */}
        <div className="flex flex-col p-4 bg-gradient-to-b from-[#3b82f6]/10 to-white/5 border border-white/5 border-t-2 border-t-[#3b82f6] rounded-xl shadow-lg transition-all duration-500 hover:shadow-[0_0_20px_rgba(59,130,246,0.15)]">
          <span className="text-[10px] font-sans uppercase tracking-[0.2em] font-semibold text-[#a89b8a] mb-1">
            {t("members.tactical.defender")}
          </span>
          <span className="text-3xl font-serif font-black text-white mt-auto select-none">
            {tacticalGroups.defenders.length}
          </span>
        </div>

        {/* Centrocampisti */}
        <div className="flex flex-col p-4 bg-gradient-to-b from-[#0dd08b]/10 to-white/5 border border-white/5 border-t-2 border-t-[#0dd08b] rounded-xl shadow-lg transition-all duration-500 hover:shadow-[0_0_20px_rgba(13,208,139,0.15)]">
          <span className="text-[10px] font-sans uppercase tracking-[0.2em] font-semibold text-[#a89b8a] mb-1">
            {t("members.tactical.midfielder")}
          </span>
          <span className="text-3xl font-serif font-black text-white mt-auto select-none">
            {tacticalGroups.midfielders.length}
          </span>
        </div>

        {/* Attaccanti */}
        <div className="flex flex-col p-4 bg-gradient-to-b from-[#be213b]/10 to-white/5 border border-white/5 border-t-2 border-t-[#be213b] rounded-xl shadow-lg transition-all duration-500 hover:shadow-[0_0_20px_rgba(190,33,59,0.15)]">
          <span className="text-[10px] font-sans uppercase tracking-[0.2em] font-semibold text-[#a89b8a] mb-1">
            {t("members.tactical.attacker")}
          </span>
          <span className="text-3xl font-serif font-black text-white mt-auto select-none">
            {tacticalGroups.attackers.length}
          </span>
        </div>
      </div>

      {/* 2. FILTRI E RICERCA */}
      <div className="flex flex-col w-full" id="members-controls">
        
        {/* Toggle Vista (Griglia/Lista vs Classifica) */}
        <div className="flex items-center justify-end mb-2 mt-4 gap-2">
          <button
            onClick={() => setViewMode("grid")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
              viewMode === "grid"
                ? "bg-[#d7ae6a]/20 border border-[#d7ae6a]/50 text-[#d7ae6a]"
                : "bg-white/5 border border-white/10 text-gray-400 hover:text-white"
            }`}
          >
            <List className="w-4 h-4" />
            {language === 'it' ? 'La Rosa' : 'Roster'}
          </button>
          <button
            onClick={() => setViewMode("ranking")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
              viewMode === "ranking"
                ? "bg-[#d7ae6a]/20 border border-[#d7ae6a]/50 text-[#d7ae6a]"
                : "bg-white/5 border border-white/10 text-gray-400 hover:text-white"
            }`}
          >
            <ListOrdered className="w-4 h-4" />
            {language === 'it' ? 'Classifica' : 'Ranking'}
          </button>
        </div>

        {viewMode === "grid" && (
          <>
            {/* Filtri a scorrimento orizzontale (No-Wrap) */}
            <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-2 mt-2 snap-x hide-scrollbar w-full" id="members-role-filters">
              {(["All", "goalkeeper", "defender", "midfielder", "forward"] as FilterRole[]).map((filter) => {
                const isActive = activeFilter === filter;
                const count = counts[filter];
                return (
                  <button
                    key={filter}
                    onClick={() => setActiveFilter(filter)}
                    className={`snap-start shrink-0 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-colors focus:outline-none ${
                      isActive
                        ? "bg-[#d7ae6a] text-black font-bold"
                        : "bg-white/5 border border-white/10 text-gray-300 hover:text-white"
                    }`}
                  >
                    {getRoleLabel(filter)}{" "}
                    <span className={`font-serif font-black ${isActive ? "text-black/60" : "text-[#d7ae6a]"}`}>
                      ({count})
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Barra di Ricerca Integrata */}
            <div className="relative w-full mb-6 group" id="members-search-container">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                {/* Nuova Icona SVG (Minimal ed elegante, diventa oro al focus) */}
                <svg 
                  className="w-4 h-4 text-gray-500 group-focus-within:text-[#d7ae6a] transition-colors duration-300" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
              </div>
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cerca giocatore..." 
                className="w-full bg-black/40 border border-white/10 focus:border-[#d7ae6a]/50 rounded-xl py-3.5 pl-11 pr-4 text-sm text-white placeholder-gray-600 outline-none transition-all shadow-inner font-sans tracking-wide"
              />
            </div>
          </>
        )}
      </div>

      {viewMode === "ranking" ? (
        <MembersRanking clubData={clubData} />
      ) : (
        <>
          {/* 3. LISTA MEMBRI (Mobile Card View - block md:hidden) */}
          <div className="grid grid-cols-1 gap-4 md:hidden" id="members-mobile-cards">
        <AnimatePresence mode="popLayout">
          {filteredAndSortedMembers.length === 0 ? (
            <motion.div 
              key="empty-mobile"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-12 text-center text-white/30 text-sm font-sans"
            >
              {t("members.noPlayers")}
            </motion.div>
          ) : (
            filteredAndSortedMembers.slice(0, visibleCount).map((member, index) => {
              const initials = member.name.substring(0, 2).toUpperCase();
              const isPremiumOvr = member.overall >= 90;

              return (
                <motion.div
                  key={member.name}
                  onClick={() => handleSelectMember(member)}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.3, delay: index * 0.03 }}
                  layout
                  className="bg-gradient-to-br from-[#1c1c21] to-black border border-white/10 hover:border-gold/60 rounded-xl p-3 flex flex-col gap-3 relative overflow-hidden cursor-pointer transition-all hover:scale-[1.01]"
                >
                  {/* Left decorative gold accent line */}
                  <div className="absolute top-0 left-0 w-[3px] h-full bg-gold/50" />
                  
                  {/* Header: Avatar, Name, Category, OVR */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[11px] font-bold text-gold font-serif select-none">
                        {initials}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-sm text-white">
                          {member.name}
                        </span>
                        {member.proName && member.proName !== member.name && (
                          <span className="text-white/50 text-[10px] font-medium italic mt-0.5 leading-none">
                            {member.proName}
                          </span>
                        )}
                          {(() => {
                            const parsed = parseAndTranslateRole(member.role, language);
                            const mainRoleText = t(`members.roles.${member.category}`);
                            return (
                              <div className="mt-1.5 flex items-center gap-1.5">
                                <span className={`text-[9px] sm:text-[10px] font-sans font-bold tracking-wider px-2 py-0.5 rounded uppercase leading-none ${getRoleBadgeStyle(member.category)}`}>
                                  {mainRoleText}
                                </span>
                                <span className="text-[9px] sm:text-[10px] font-sans font-bold tracking-widest px-1.5 py-0.5 rounded border border-white/20 text-white/70 uppercase leading-none bg-white/5 shadow-sm">
                                  {parsed.sigla}
                                </span>
                              </div>
                            );
                          })()}
                      </div>
                    </div>

                    {/* VAL Badge */}
                    <div className="flex flex-col items-center justify-center bg-gold/10 border border-gold/30 rounded-lg px-2 py-0.5 min-w-[45px]">
                      <span className="text-[9px] text-gold/60 font-serif font-bold tracking-wider uppercase leading-none">{t("members.table.val")}</span>
                      <span className={`font-serif text-xs sm:text-sm tracking-wide mt-0.5 leading-none ${isPremiumOvr ? "text-gold font-black" : "text-white/90 font-bold"}`}>
                        {member.overall}
                      </span>
                    </div>
                  </div>

                  {/* Grid of Key Stats */}
                  <div className="grid grid-cols-4 gap-1.5 bg-white/[0.01] border border-white/5 rounded-lg p-2 text-center">
                    <div>
                      <span className="block text-[9px] text-white/40 uppercase tracking-wider font-semibold">{t("members.table.games")}</span>
                      <span className="text-xs text-white/80 font-serif font-bold mt-0.5 block">{member.games}</span>
                    </div>
                    <div>
                      <span className="block text-[9px] text-white/40 uppercase tracking-wider font-semibold">{t("members.table.goals")}</span>
                      <span className="text-xs text-[#0dd08b] font-serif font-bold mt-0.5 block">{member.goals}</span>
                    </div>
                    <div>
                      <span className="block text-[9px] text-white/40 uppercase tracking-wider font-semibold">{t("members.table.assists")}</span>
                      <span className="text-xs text-gold font-serif font-bold mt-0.5 block">{member.assists}</span>
                    </div>
                    <div>
                      <span className="block text-[9px] text-white/40 uppercase tracking-wider font-semibold font-sans">{t("members.table.winPercent")}</span>
                      <span className="text-xs text-white/80 font-serif font-bold mt-0.5 block">{member.winPercent}%</span>
                    </div>
                  </div>

                  {/* Additional detailed stats */}
                  <div className="grid grid-cols-3 gap-1.5 text-center text-[9px] text-white/50 border-t border-white/5 pt-1.5">
                    <div>
                      <span className="text-white/30 text-[9px] block uppercase tracking-wider font-semibold">Pass (Pass%)</span>
                      <span className="font-serif font-bold text-white/80">{member.passes} ({member.passPercent}%)</span>
                    </div>
                    <div>
                      <span className="text-white/30 text-[9px] block uppercase tracking-wider font-semibold">Contr (Tkl%)</span>
                      <span className="font-serif font-bold text-white/80">{member.tackles} ({member.tacklePercent}%)</span>
                    </div>
                    <div>
                      <span className="text-white/30 text-[9px] block uppercase tracking-wider font-semibold">Sheets</span>
                      <span className="font-serif font-bold text-white/80">{member.cleanSheets}</span>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>

      {/* 4. TABELLA MEMBRI (Desktop View - hidden md:block) */}
      <div 
        className="hidden md:block w-full bg-gradient-to-br from-zinc-900/90 to-zinc-950/90 backdrop-blur-xl border border-white/10 hover:border-gold/80 hover:shadow-[0_0_30px_rgba(215,174,106,0.3)] transition-all duration-500 rounded-xl overflow-hidden shadow-[0_15px_45px_rgba(0,0,0,0.4)] relative"
        id="members-table-container"
      >
        {/* Top tech accent bar */}
        <div className="absolute top-0 left-0 w-full h-[1.5px] bg-gradient-to-r from-transparent via-gold to-transparent pointer-events-none" />

        <div className="w-full overflow-x-auto overflow-y-auto max-h-[600px] scrollbar-thin scrollbar-thumb-white/10">
          <table className="w-full min-w-full md:min-w-[1000px] border-collapse text-left">
            
            {/* Header */}
            <thead className="sticky top-0 z-10">
              <tr className="border-b border-white/10 bg-zinc-950 font-sans text-[9px] uppercase tracking-wider text-white/40 select-none">
                
                {/* Column: Member */}
                <th 
                  onClick={() => handleSort("name")}
                  className="py-3 px-4 font-semibold cursor-pointer group/header hover:text-white transition-colors text-left"
                >
                  <div className="flex items-center">
                    {t("members.table.player")}
                    {renderSortIndicator("name")}
                  </div>
                </th>

                {/* Column: OVR */}
                <th 
                  onClick={() => handleSort("overall")}
                  className="py-3 px-2 font-semibold cursor-pointer group/header hover:text-white transition-colors text-center w-[80px]"
                >
                  <div className="flex items-center justify-center">
                    {t("members.table.val")}
                    {renderSortIndicator("overall")}
                  </div>
                </th>

                {/* Column: Games */}
                <th 
                  onClick={() => handleSort("games")}
                  className="py-3 px-2 font-semibold cursor-pointer group/header hover:text-white transition-colors text-center w-[80px]"
                >
                  <div className="flex items-center justify-center">
                    {t("members.table.games")}
                    {renderSortIndicator("games")}
                  </div>
                </th>

                {/* Column: Goals */}
                <th 
                  onClick={() => handleSort("goals")}
                  className="py-3 px-2 font-semibold cursor-pointer group/header hover:text-white transition-colors text-center w-[80px]"
                >
                  <div className="flex items-center justify-center">
                    {t("members.table.goals")}
                    {renderSortIndicator("goals")}
                  </div>
                </th>

                {/* Column: Assists */}
                <th 
                  onClick={() => handleSort("assists")}
                  className="py-3 px-2 font-semibold cursor-pointer group/header hover:text-white transition-colors text-center w-[85px]"
                >
                  <div className="flex items-center justify-center">
                    {t("members.table.assists")}
                    {renderSortIndicator("assists")}
                  </div>
                </th>

                {/* Column: Passes */}
                <th 
                  onClick={() => handleSort("passes")}
                  className="py-3 px-2 font-semibold cursor-pointer group/header hover:text-white transition-colors text-center w-[90px]"
                >
                  <div className="flex items-center justify-center">
                    {t("members.table.passes")}
                    {renderSortIndicator("passes")}
                  </div>
                </th>

                {/* Column: Pass% */}
                <th 
                  onClick={() => handleSort("passPercent")}
                  className="py-3 px-2 font-semibold cursor-pointer group/header hover:text-white transition-colors text-center w-[85px]"
                >
                  <div className="flex items-center justify-center">
                    {t("members.table.passPercent")}
                    {renderSortIndicator("passPercent")}
                  </div>
                </th>

                {/* Column: Tackles */}
                <th 
                  onClick={() => handleSort("tackles")}
                  className="py-3 px-2 font-semibold cursor-pointer group/header hover:text-white transition-colors text-center w-[95px]"
                >
                  <div className="flex items-center justify-center">
                    {t("members.table.tackles")}
                    {renderSortIndicator("tackles")}
                  </div>
                </th>

                {/* Column: Tkl% */}
                <th 
                  onClick={() => handleSort("tacklePercent")}
                  className="py-3 px-2 font-semibold cursor-pointer group/header hover:text-white transition-colors text-center w-[85px]"
                >
                  <div className="flex items-center justify-center">
                    {t("members.table.tacklePercent")}
                    {renderSortIndicator("tacklePercent")}
                  </div>
                </th>

                {/* Column: CS */}
                <th 
                  onClick={() => handleSort("cleanSheets")}
                  className="py-3 px-2 font-semibold cursor-pointer group/header hover:text-white transition-colors text-center w-[75px]"
                >
                  <div className="flex items-center justify-center">
                    {t("members.table.cleanSheets")}
                    {renderSortIndicator("cleanSheets")}
                  </div>
                </th>

                {/* Column: Win% */}
                <th 
                  onClick={() => handleSort("winPercent")}
                  className="py-3 px-4 font-semibold cursor-pointer group/header hover:text-white transition-colors text-center w-[80px]"
                >
                  <div className="flex items-center justify-center">
                    {t("members.table.winPercent")}
                    {renderSortIndicator("winPercent")}
                  </div>
                </th>

              </tr>
            </thead>

             {/* Body */}
            <tbody>
              <AnimatePresence mode="popLayout">
                {filteredAndSortedMembers.length === 0 ? (
                  <tr key="empty">
                    <td colSpan={11} className="py-12 text-center text-white/30 text-sm font-sans">
                      {t("members.noPlayers")}
                    </td>
                  </tr>
                ) : (
                  filteredAndSortedMembers.slice(0, visibleCount).map((member, index) => {
                    const initials = member.name.substring(0, 2).toUpperCase();
                    const isPremiumOvr = member.overall >= 90;

                    return (
                      <motion.tr
                        key={member.name}
                        onClick={() => handleSelectMember(member)}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -15 }}
                        transition={{ duration: 0.3, delay: index * 0.03 }}
                        layout
                        className="border-b border-white/[0.04] hover:bg-gold/[0.08] cursor-pointer transition-colors duration-200 group"
                      >
                        {/* Member Column */}
                        <td className="py-2 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[11px] font-bold text-gold font-serif select-none">
                              {initials}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-bold text-sm text-white group-hover:text-gold transition-colors duration-200">
                                {member.name}
                              </span>
                              {member.proName && member.proName !== member.name && (
                                <span className="text-white/40 text-[10px] font-medium leading-none mt-0.5">
                                  {member.proName}
                                </span>
                              )}
                              {(() => {
                                const parsed = parseAndTranslateRole(member.role, language);
                                const mainRoleText = t(`members.roles.${member.category}`);
                                return (
                                  <div className="mt-1 flex items-center gap-1.5">
                                    <span className={`text-[8px] font-bold tracking-wider px-1.5 py-0.5 rounded uppercase leading-none ${getRoleBadgeStyle(member.category)}`}>
                                      {mainRoleText}
                                    </span>
                                    <span className="text-[8px] font-bold tracking-widest px-1.5 py-0.5 rounded border border-white/20 text-white/70 uppercase leading-none bg-white/5 shadow-sm">
                                      {parsed.sigla}
                                    </span>
                                  </div>
                                );
                              })()}
                            </div>
                          </div>
                        </td>

                        {/* OVR Column */}
                        <td className="py-2 px-2 text-center">
                          <div className="flex items-center justify-center">
                            <span className={`font-serif text-sm tracking-wide ${isPremiumOvr ? "text-gold font-black" : "text-white/90"}`}>
                              {member.overall}
                            </span>
                          </div>
                        </td>

                        {/* Games */}
                        <td className="py-2 px-2 text-center font-serif font-bold text-xs text-white/70">
                          {member.games}
                        </td>

                        {/* Goals */}
                        <td className="py-2 px-2 text-center font-serif text-xs font-bold text-[#0dd08b]">
                          {member.goals}
                        </td>

                        {/* Assists */}
                        <td className="py-2 px-2 text-center font-serif font-bold text-xs text-gold">
                          {member.assists}
                        </td>

                        {/* Passes */}
                        <td className="py-2 px-2 text-center font-serif font-bold text-xs text-white/70">
                          {member.passes}
                        </td>

                        {/* Pass% */}
                        <td className="py-2 px-2 text-center font-serif font-bold text-xs text-white/70">
                          {member.passPercent}%
                        </td>

                        {/* Tackles */}
                        <td className="py-2 px-2 text-center font-serif font-bold text-xs text-white/70">
                          {member.tackles}
                        </td>

                        {/* Tkl% */}
                        <td className="py-2 px-2 text-center font-serif font-bold text-xs text-white/70">
                          {member.tacklePercent}%
                        </td>

                        {/* CS */}
                        <td className="py-2 px-2 text-center font-serif font-bold text-xs text-white/70">
                          {member.cleanSheets}
                        </td>

                        {/* Win% */}
                        <td className="py-2 px-4 text-center font-serif font-bold text-xs text-white/70">
                          {member.winPercent}%
                        </td>

                      </motion.tr>
                    );
                  })
                )}
              </AnimatePresence>
            </tbody>

          </table>
        </div>
      </div>

      {/* 5. GORGEOUS INTERACTIVE LOAD MORE BUTTON (Mindful UX / Dopamine Batching) */}
      {filteredAndSortedMembers.length > visibleCount && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-center mt-4 w-full"
        >
          <button
            onClick={() => setVisibleCount(prev => prev + 8)}
            className="relative group overflow-hidden flex items-center justify-center gap-3 bg-zinc-950 hover:bg-zinc-900 text-gold border border-gold/30 hover:border-gold/80 px-8 py-3.5 text-xs tracking-[0.25em] font-serif uppercase font-black rounded-xl transition-all duration-300 shadow-[0_4px_15px_rgba(0,0,0,0.5)] active:scale-95 cursor-pointer"
          >
            {/* Shimmer Light Sweep Effect */}
            <div className="absolute inset-0 w-[200%] h-full bg-gradient-to-r from-transparent via-gold/15 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_ease-in-out_infinite] pointer-events-none" />
            
            <span>{t("members.showMore")} (+{filteredAndSortedMembers.length - visibleCount})</span>
          </button>
        </motion.div>
      )}
        </>
      )}

      {/* FUT Player Card Modal */}
      <PlayerCardModal
        member={selectedMember}
        onClose={() => setSelectedMember(null)}
        initialTab="card"
      />
    </div>
  );
}
