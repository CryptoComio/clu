import { useMemo, useState } from "react";
import { ClubData, ClubMember } from "../hooks/useClubData";
import { useLanguage } from "../contexts/LanguageContext";
import { 
  calculatePreviousWeekTOTW, 
  calculatePreviousWeekPlayerStats, 
  getFilteredMatchesAndMetadata, 
  normalizeName,
  TimeframeMode
} from "../utils/totw";
import { parseAndTranslateRole } from "../utils/roleUtils";
import { motion, AnimatePresence } from "motion/react";
import { 
  Trophy, 
  Target, 
  Zap, 
  ShieldCheck, 
  Crosshair, 
  Shield, 
  Users,
  Crown,
  Medal,
  Award,
  Search,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Calendar,
  BarChart3,
  Activity,
  CheckCircle2,
  Filter,
  Star
} from "lucide-react";
import PlayerCardModal from "./PlayerCardModal";

interface MembersRankingProps {
  clubData: ClubData;
}

type FilterCategory = "all" | "forward" | "midfielder" | "defender" | "goalkeeper";

export default function MembersRanking({ clubData }: MembersRankingProps) {
  const { t, language } = useLanguage();
  const [selectedMember, setSelectedMember] = useState<ClubMember | null>(null);
  const [activeTab, setActiveTab] = useState<FilterCategory>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showInfo, setShowInfo] = useState(false);
  const [timeframe, setTimeframe] = useState<TimeframeMode>("weekly");

  // Calculate metadata for previous week timeframe (Monday to Thursday)
  const timeframeMeta = useMemo(() => {
    return getFilteredMatchesAndMetadata(clubData.matches || [], timeframe, language);
  }, [clubData.matches, timeframe, language]);

  // Build complete rankings with Pro Score (Punteggio Pro) including ALL club members
  const rankings = useMemo(() => {
    // 1. Get TOTW winners for previous week
    const totw = calculatePreviousWeekTOTW(
      clubData.matches || [], 
      clubData.membersList, 
      clubData.featuredMember?.name, 
      language,
      timeframe
    );
    const totwNames = new Set(totw.map(p => p.name));
    
    // 2. Get player stats for previous week Mon-Thu matches
    const weeklyStats = calculatePreviousWeekPlayerStats(
      clubData.matches || [], 
      clubData.membersList || [],
      timeframe
    );
    const weeklyStatsMap = new Map<string, typeof weeklyStats[0]>();
    weeklyStats.forEach(ws => {
      if (ws.name) {
        weeklyStatsMap.set(normalizeName(ws.name), ws);
        weeklyStatsMap.set(ws.name.toLowerCase().trim(), ws);
      }
      if (ws.proName) {
        weeklyStatsMap.set(normalizeName(ws.proName), ws);
        weeklyStatsMap.set(ws.proName.toLowerCase().trim(), ws);
      }
    });
    
    // 3. Build complete list of ALL members from clubData.membersList
    const rawMembers = Array.isArray(clubData.membersList) ? clubData.membersList : [];
    const matchedStatsKeys = new Set<string>();
    
    const allMembers: ClubMember[] = rawMembers.map(m => {
      const nameNorm = m.name ? normalizeName(m.name) : "";
      const nameKey = m.name ? m.name.toLowerCase().trim() : "";
      const proNameNorm = m.proName ? normalizeName(m.proName) : "";
      const proNameKey = m.proName ? m.proName.toLowerCase().trim() : "";

      const ws = (nameNorm ? weeklyStatsMap.get(nameNorm) : undefined)
        || (nameKey ? weeklyStatsMap.get(nameKey) : undefined)
        || (proNameNorm ? weeklyStatsMap.get(proNameNorm) : undefined)
        || (proNameKey ? weeklyStatsMap.get(proNameKey) : undefined);

      if (ws) {
        if (ws.name) matchedStatsKeys.add(normalizeName(ws.name));
        if (ws.proName) matchedStatsKeys.add(normalizeName(ws.proName));

        return {
          ...m,
          name: m.name || ws.name,
          proName: m.proName || ws.proName || m.name,
          role: m.role || ws.role,
          overall: m.overall || ws.overall,
          avatarColor: m.avatarColor || ws.avatarColor,
          games: ws.games,
          goals: ws.goals,
          assists: ws.assists,
          category: m.category || ws.category || 'midfielder',
          ratingAve: ws.ratingAve,
          manOfTheMatch: ws.manOfTheMatch,
          passes: m.passes || 0,
          passPercent: m.passPercent || 0,
          tackles: m.tackles || 0,
          tacklePercent: m.tacklePercent || 0,
          cleanSheets: m.cleanSheets || 0,
          winPercent: m.winPercent || 0,
          weeklyStats: ws.weeklyStats,
        } as ClubMember;
      } else {
        // Member did not play in the analyzed period
        return {
          ...m,
          name: m.name,
          proName: m.proName || m.name,
          role: m.role || 'CC',
          overall: m.overall || 80,
          games: 0,
          goals: m.goals || 0,
          assists: m.assists || 0,
          category: m.category || 'midfielder',
          ratingAve: m.ratingAve || 0,
          manOfTheMatch: m.manOfTheMatch || 0,
          passes: m.passes || 0,
          passPercent: m.passPercent || 0,
          tackles: m.tackles || 0,
          tacklePercent: m.tacklePercent || 0,
          cleanSheets: m.cleanSheets || 0,
          winPercent: m.winPercent || 0,
          weeklyStats: undefined,
        } as ClubMember;
      }
    });

    // Append any active players from weeklyStats that were not present in membersList
    weeklyStats.forEach(ws => {
      const normN = normalizeName(ws.name);
      const normP = normalizeName(ws.proName);
      if (!matchedStatsKeys.has(normN) && !matchedStatsKeys.has(normP)) {
        allMembers.push({
          name: ws.name,
          proName: ws.proName || ws.name,
          role: ws.role,
          overall: ws.overall || 82,
          avatarColor: ws.avatarColor || "from-blue-600 to-cyan-500",
          games: ws.games,
          goals: ws.goals,
          assists: ws.assists,
          category: ws.category || 'midfielder',
          ratingAve: ws.ratingAve,
          manOfTheMatch: ws.manOfTheMatch,
          weeklyStats: ws.weeklyStats,
        } as ClubMember);
      }
    });

    const activeMembers = allMembers.filter(m => m.games > 0);
    const maxWeeklyGames = activeMembers.length > 0 ? Math.max(...activeMembers.map(m => m.games), 1) : 1;
    const threshold = Math.min(3, Math.ceil(maxWeeklyGames / 2));

    // Calculate Pro Score (Punteggio Pro) weighted by game threshold
    const getProScore = (m: ClubMember) => {
      if (!m.games || m.games === 0) return 0;
      const basePPI = m.weeklyStats?.compatibilityScore ?? ((m.ratingAve || 0) * 10);
      const weight = m.games >= threshold ? 1 : (m.games / threshold);
      return Math.round(basePPI * weight);
    };

    // Group by role category for role-filtered tabs
    const categories = ['forward', 'midfielder', 'defender', 'goalkeeper'] as const;
    const grouped: Record<string, ClubMember[]> = {
      forward: [],
      midfielder: [],
      defender: [],
      goalkeeper: []
    };

    allMembers.forEach(m => {
      if (grouped[m.category]) {
        grouped[m.category].push(m);
      }
    });

    // Sort function: TOTW first -> Active players by Pro Score -> Inactive players
    const sortMembers = (list: ClubMember[]) => {
      return [...list].sort((a, b) => {
        const aIsTotw = totwNames.has(a.name);
        const bIsTotw = totwNames.has(b.name);
        
        if (aIsTotw && !bIsTotw) return -1;
        if (!aIsTotw && bIsTotw) return 1;

        const aActive = a.games > 0;
        const bActive = b.games > 0;
        if (aActive && !bActive) return -1;
        if (!aActive && bActive) return 1;

        const scoreA = getProScore(a);
        const scoreB = getProScore(b);
        
        if (scoreB !== scoreA) return scoreB - scoreA;
        if (Math.abs(a.ratingAve - b.ratingAve) > 0.001) return b.ratingAve - a.ratingAve;
        return (b.overall || 0) - (a.overall || 0);
      });
    };

    categories.forEach(cat => {
      grouped[cat] = sortMembers(grouped[cat]);
    });

    const allMembersSorted = sortMembers(allMembers);

    return {
      allMembersSorted,
      grouped,
      categories,
      totwNames,
      threshold,
      getProScore,
      totalCount: allMembers.length,
      activeCount: activeMembers.length
    };
  }, [clubData, language, timeframe]);

  // Display list according to selected filter tab and search query
  const activeMembersList = activeTab === "all" 
    ? rankings.allMembersSorted 
    : (rankings.grouped[activeTab] || []);

  const filteredDisplayList = useMemo(() => {
    let list = activeMembersList;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(m => 
        m.name.toLowerCase().includes(q) || 
        (m.proName && m.proName.toLowerCase().includes(q)) ||
        (m.role && m.role.toLowerCase().includes(q))
      );
    }
    return list;
  }, [activeMembersList, searchQuery]);

  return (
    <div className="w-full flex flex-col gap-6">
      {/* 1. HEADER SECTION & INFO TOGGLE */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-1">
        <div>
          <h2 className="text-2xl sm:text-3xl font-serif font-black uppercase tracking-widest text-white">
            {language === 'it' ? 'Classifica e Statistiche' : 'Leaderboard & Stats'}
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowInfo(!showInfo)}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold font-sans transition-all cursor-pointer border shadow-sm ${
              showInfo
                ? "bg-gradient-to-r from-[#ffd89b] via-[#d7ae6a] to-[#b88e4c] text-black border-[#d7ae6a] shadow-[0_0_15px_rgba(215,174,106,0.4)]"
                : "bg-[#d7ae6a]/10 hover:bg-[#d7ae6a]/20 text-[#d7ae6a] border-[#d7ae6a]/40 hover:border-[#d7ae6a]/70"
            }`}
          >
          {/* Custom Premium Gold Star Emblem SVG */}
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="btnGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ffe6a9" />
                  <stop offset="50%" stopColor="#d7ae6a" />
                  <stop offset="100%" stopColor="#926c2e" />
                </linearGradient>
              </defs>
              <path d="M12 2L14.8 8.2L21.5 9L16.5 13.5L18 20.2L12 16.8L6 20.2L7.5 13.5L2.5 9L9.2 8.2L12 2Z" 
                fill={showInfo ? "#000000" : "url(#btnGoldGrad)"} 
                stroke={showInfo ? "#000000" : "#d7ae6a"} 
                strokeWidth="0.5"
              />
            </svg>
            <span>
              {language === 'it' ? 'Come funziona il Punteggio Pro?' : 'How does Pro Score work?'}
            </span>
            {showInfo ? (
              <ChevronUp className="w-3.5 h-3.5 ml-0.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 ml-0.5" />
            )}
          </button>
        </div>
      </div>

      {/* EXPANDABLE PRO SCORE INFO SECTION */}
      <AnimatePresence>
        {showInfo && (
          <motion.div
            initial={{ opacity: 0, height: 0, scale: 0.98 }}
            animate={{ opacity: 1, height: "auto", scale: 1 }}
            exit={{ opacity: 0, height: 0, scale: 0.98 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="bg-gradient-to-b from-[#18181d] via-[#141418] to-[#101014] border border-[#d7ae6a]/30 rounded-2xl p-4 sm:p-5 shadow-[0_4px_25px_rgba(0,0,0,0.5)] my-1 relative">
              {/* Subtle decorative gold light background glow */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#d7ae6a]/5 blur-3xl pointer-events-none rounded-full" />

              {/* Top Card Bar */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-white/10 pb-3.5 mb-4">
                <div className="flex items-center gap-3">
                  {/* Premium Gold Pro Shield Badge */}
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#ffd89b] via-[#d7ae6a] to-[#805a20] p-[1.5px] shadow-[0_0_12px_rgba(215,174,106,0.3)] shrink-0">
                    <div className="w-full h-full bg-[#18140c] rounded-[10px] flex items-center justify-center relative overflow-hidden">
                      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                          <linearGradient id="badgeGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#fff2c2" />
                            <stop offset="40%" stopColor="#d7ae6a" />
                            <stop offset="100%" stopColor="#926c2e" />
                          </linearGradient>
                        </defs>
                        {/* Shield Contour */}
                        <path d="M12 2L4 5V11C4 16.5 7.4 21.3 12 22.5C16.6 21.3 20 16.5 20 11V5L12 2Z" fill="url(#badgeGoldGrad)" opacity="0.15" />
                        <path d="M12 2L4 5V11C4 16.5 7.4 21.3 12 22.5C16.6 21.3 20 16.5 20 11V5L12 2Z" stroke="url(#badgeGoldGrad)" strokeWidth="1.5" strokeLinejoin="round" />
                        {/* Crown/Star inside shield */}
                        <path d="M12 6.5L13.8 10.2L17.8 10.7L14.9 13.5L15.6 17.5L12 15.6L8.4 17.5L9.1 13.5L6.2 10.7L10.2 10.2L12 6.5Z" fill="url(#badgeGoldGrad)" />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-white font-sans flex items-center gap-2">
                      {language === 'it' ? 'Algoritmo Analitico Voto Pro (0 - 100)' : 'Pro Score Analytical Algorithm (0 - 100)'}
                    </h3>
                    <p className="text-xs text-gray-400 font-sans mt-0.5">
                      {language === 'it'
                        ? 'Incrocio di 4 fattori di performance per una valutazione oggettiva e meritocratica.'
                        : 'Combination of 4 performance factors for an objective, merit-based rating.'}
                    </p>
                  </div>
                </div>

                {/* Timeframe Pill */}
                <div className="inline-flex items-center gap-1.5 bg-black/60 border border-[#d7ae6a]/40 px-3 py-1.5 rounded-xl text-[11px] text-gray-200 font-sans self-start md:self-auto shrink-0 shadow-sm">
                  <Calendar className="w-3.5 h-3.5 text-[#d7ae6a]" />
                  <span>
                    {language === 'it' 
                      ? 'Finestra: Partite ufficiali Lunedì - Giovedì (sett. precedente)' 
                      : 'Window: Official matches Monday - Thursday (prev. week)'}
                  </span>
                </div>
              </div>

              {/* 1. WEIGHTS GRID (4 FACTORS) */}
              <div className="mb-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#d7ae6a] mb-3 font-sans flex items-center gap-1.5">
                  <BarChart3 className="w-3.5 h-3.5 text-[#d7ae6a]" />
                  <span>{language === 'it' ? '1. La Formula del Punteggio Pro (0 - 100)' : '1. The Pro Score Formula (0 - 100)'}</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Factor 1 */}
                  <div className="bg-black/50 border border-white/10 hover:border-[#d7ae6a]/40 rounded-xl p-3.5 transition-colors">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-white font-sans flex items-center gap-1.5">
                        <Award className="w-4 h-4 text-amber-400 shrink-0" />
                        {language === 'it' ? 'Media Voto EA' : 'EA Rating Average'}
                      </span>
                      <span className="text-[11px] font-mono font-black text-[#d7ae6a] bg-[#d7ae6a]/15 border border-[#d7ae6a]/40 px-2 py-0.5 rounded-lg">
                        PESO 45%
                      </span>
                    </div>
                    <p className="text-xs text-gray-300 leading-relaxed font-sans">
                      {language === 'it' 
                        ? 'Trasforma la media pagella delle tue partite settimanali in un punteggio base (es. una media voto di 8.0 genera un punteggio pagella proporzionato ad alta precisione).' 
                        : 'Converts your weekly match rating average into a base score (e.g., an 8.0 average rating produces a high-precision proportional score).'}
                    </p>
                  </div>

                  {/* Factor 2 */}
                  <div className="bg-black/50 border border-white/10 hover:border-[#d7ae6a]/40 rounded-xl p-3.5 transition-colors">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-white font-sans flex items-center gap-1.5">
                        <Activity className="w-4 h-4 text-blue-400 shrink-0" />
                        {language === 'it' ? 'KPI Specifici di Ruolo' : 'Role-Specific KPIs'}
                      </span>
                      <span className="text-[11px] font-mono font-black text-[#d7ae6a] bg-[#d7ae6a]/15 border border-[#d7ae6a]/40 px-2 py-0.5 rounded-lg">
                        PESO 30%
                      </span>
                    </div>
                    <p className="text-xs text-gray-300 leading-relaxed font-sans mb-2">
                      {language === 'it'
                        ? "Non tutti i ruoli vengono giudicati per i gol! L'algoritmo analizza le statistiche giuste per ogni posizione:"
                        : 'Not all positions are judged by goals! The algorithm evaluates role-tailored stats:'}
                    </p>
                    <ul className="space-y-1.5 text-[11px] text-gray-300 font-sans border-t border-white/5 pt-2">
                      <li className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-md bg-gradient-to-br from-[#ffd89b]/25 via-[#d7ae6a]/20 to-[#926c2e]/25 border border-[#d7ae6a]/50 flex items-center justify-center shrink-0 shadow-[0_0_8px_rgba(215,174,106,0.25)]">
                          <Target className="w-3 h-3 text-[#d7ae6a]" />
                        </span>
                        <div>
                          <strong className="text-white">{language === 'it' ? 'Attaccanti:' : 'Forwards:'}</strong>{' '}
                          {language === 'it' ? 'Gol per partita, assist e precisione di tiro.' : 'Goals per match, assists & shot accuracy.'}
                        </div>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-md bg-gradient-to-br from-[#ffd89b]/25 via-[#d7ae6a]/20 to-[#926c2e]/25 border border-[#d7ae6a]/50 flex items-center justify-center shrink-0 shadow-[0_0_8px_rgba(215,174,106,0.25)]">
                          <Crosshair className="w-3 h-3 text-[#d7ae6a]" />
                        </span>
                        <div>
                          <strong className="text-white">{language === 'it' ? 'Centrocampisti:' : 'Midfielders:'}</strong>{' '}
                          {language === 'it' ? 'Precisione passaggi, assist, contrasti e contributo offensivo/difensivo.' : 'Pass accuracy, assists, tackles & overall balance.'}
                        </div>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-md bg-gradient-to-br from-[#ffd89b]/25 via-[#d7ae6a]/20 to-[#926c2e]/25 border border-[#d7ae6a]/50 flex items-center justify-center shrink-0 shadow-[0_0_8px_rgba(215,174,106,0.25)]">
                          <Shield className="w-3 h-3 text-[#d7ae6a]" />
                        </span>
                        <div>
                          <strong className="text-white">{language === 'it' ? 'Difensori:' : 'Defenders:'}</strong>{' '}
                          {language === 'it' ? '% contrasti vinti, volume di interventi difensivi e passaggi riusciti.' : '% tackles won, defensive actions & pass volume.'}
                        </div>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-md bg-gradient-to-br from-[#ffd89b]/25 via-[#d7ae6a]/20 to-[#926c2e]/25 border border-[#d7ae6a]/50 flex items-center justify-center shrink-0 shadow-[0_0_8px_rgba(215,174,106,0.25)]">
                          <Crown className="w-3 h-3 text-[#d7ae6a]" />
                        </span>
                        <div>
                          <strong className="text-white">{language === 'it' ? 'Portieri:' : 'Goalkeepers:'}</strong>{' '}
                          {language === 'it' ? 'Numero di parate per partita e rilanci completati.' : 'Saves per game & completed distribution.'}
                        </div>
                      </li>
                    </ul>
                  </div>

                  {/* Factor 3 */}
                  <div className="bg-black/50 border border-white/10 hover:border-[#d7ae6a]/40 rounded-xl p-3.5 transition-colors">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-white font-sans flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                        {language === 'it' ? 'Fedeltà Tattica al Ruolo' : 'Tactical Role Discipline'}
                      </span>
                      <span className="text-[11px] font-mono font-black text-[#d7ae6a] bg-[#d7ae6a]/15 border border-[#d7ae6a]/40 px-2 py-0.5 rounded-lg">
                        PESO 15%
                      </span>
                    </div>
                    <p className="text-xs text-gray-300 leading-relaxed font-sans">
                      {language === 'it'
                        ? 'Premia i giocatori che rispettano la propria posizione in rosa senza finire troppo spesso fuori ruolo.'
                        : 'Rewards players who maintain their official tactical position without playing out of role.'}
                    </p>
                  </div>

                  {/* Factor 4 */}
                  <div className="bg-black/50 border border-white/10 hover:border-[#d7ae6a]/40 rounded-xl p-3.5 transition-colors">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-white font-sans flex items-center gap-1.5">
                        <Zap className="w-4 h-4 text-purple-400 shrink-0" />
                        {language === 'it' ? 'Continuità & Presenze' : 'Consistency & Matches'}
                      </span>
                      <span className="text-[11px] font-mono font-black text-[#d7ae6a] bg-[#d7ae6a]/15 border border-[#d7ae6a]/40 px-2 py-0.5 rounded-lg">
                        PESO 10%
                      </span>
                    </div>
                    <p className="text-xs text-gray-300 leading-relaxed font-sans">
                      {language === 'it'
                        ? 'Premia chi scende in campo con regolarità durante la settimana.'
                        : 'Rewards players who consistently take the field during the week.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* 2. PRESENCE WEIGHTING FACTOR */}
              <div className="bg-black/60 border border-white/10 rounded-xl p-3.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-2 font-sans flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#d7ae6a]" />
                  <span>{language === 'it' ? '2. Il Fattore Ponderazione Presenze' : '2. Match Count Weighting Factor'}</span>
                </h4>
                <p className="text-xs text-gray-300 leading-relaxed font-sans mb-2">
                  {language === 'it'
                    ? 'Per evitare che chi gioca una sola partita con voto alto passi davanti a chi gioca 10 partite con voto costante:'
                    : 'To avoid cases where a player with 1 match outranks someone playing 10 consistent matches:'}
                </p>
                <ul className="space-y-1 text-xs text-gray-300 font-sans list-disc pl-5">
                  <li>
                    {language === 'it'
                      ? 'Viene calcolata una soglia minima di presenze settimanali.'
                      : 'A minimum weekly match threshold is dynamically calculated.'}
                  </li>
                  <li>
                    {language === 'it'
                      ? 'Chi raggiunge o supera la soglia mantiene il Punteggio Pro al 100%.'
                      : 'Players reaching or exceeding the threshold keep 100% of their Pro Score.'}
                  </li>
                  <li>
                    {language === 'it'
                      ? 'Chi ha pochissime presenze ha un punteggio leggermente riparametrato in base alle partite giocate.'
                      : 'Players with very few matches have their score proportionately adjusted.'}
                  </li>
                </ul>
              </div>

              {/* Note on Starters Selection */}
              <div className="mt-3 p-3 bg-gradient-to-r from-[#d7ae6a]/20 via-[#d7ae6a]/10 to-transparent border border-[#d7ae6a]/40 rounded-xl text-xs text-gray-200 font-sans flex items-center gap-2.5">
                <Star className="w-4 h-4 text-[#d7ae6a] fill-[#d7ae6a] shrink-0" />
                <span className="leading-relaxed">
                  <strong className="text-white uppercase font-bold">{language === 'it' ? 'Selezione Titolari: ' : 'Starter Selection: '}</strong>
                  {language === 'it'
                    ? 'Il club e lo staff tecnico utilizzano questa classifica e il Team of the Week per scegliere i TITOLARI DELLE PROSSIME PARTITE UFFICIALI. La Star del Club e tutti i membri competono settimanalmente per conquistare un posto nell\'XI titolare.'
                    : 'The club leadership uses this leaderboard and TOTW to select STARTERS FOR UPCOMING OFFICIAL MATCHES. The Club Star and all members compete weekly to earn a spot in the starting XI.'}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. ROLE FILTER TABS & SEARCH BAR */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          {[
            { id: "all", label: language === "it" ? `Tutti (${rankings.totalCount})` : `All (${rankings.totalCount})`, icon: Users },
            { id: "forward", label: `${t("members.tactical.forward")} (${rankings.grouped.forward?.length || 0})`, icon: Crosshair },
            { id: "midfielder", label: `${t("members.tactical.midfielder")} (${rankings.grouped.midfielder?.length || 0})`, icon: Target },
            { id: "defender", label: `${t("members.tactical.defender")} (${rankings.grouped.defender?.length || 0})`, icon: Shield },
            { id: "goalkeeper", label: `${t("members.tactical.goalkeeper")} (${rankings.grouped.goalkeeper?.length || 0})`, icon: ShieldCheck },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as FilterCategory)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-sans text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? "bg-[#d7ae6a] text-black font-bold shadow-md shadow-[#d7ae6a]/20 scale-[1.02]"
                    : "bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? "text-black" : "text-gray-400"}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative shrink-0 w-full sm:w-64">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={language === 'it' ? 'Cerca un giocatore...' : 'Search player...'}
            className="w-full bg-black/40 border border-white/10 hover:border-white/20 focus:border-[#d7ae6a] focus:outline-none text-white text-xs rounded-xl pl-9 pr-8 py-2 font-sans placeholder-gray-500 transition-colors"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-xs cursor-pointer p-0.5"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* 3. UNIFIED LEADERBOARD LIST */}
      <div className="flex flex-col gap-3">
        {filteredDisplayList.length === 0 ? (
          <div className="p-8 text-center bg-[#141418] rounded-2xl border border-white/10 text-gray-400 text-sm font-sans">
            {language === 'it' ? 'Nessun giocatore trovato con i criteri correnti.' : 'No players found with current criteria.'}
          </div>
        ) : (
          filteredDisplayList.map((member, idx) => {
            const isFirst = idx === 0 && !searchQuery && activeTab === "all";
            const isSecond = idx === 1 && !searchQuery && activeTab === "all";
            const isThird = idx === 2 && !searchQuery && activeTab === "all";
            const isTOTW = rankings.totwNames.has(member.name);
            const score = rankings.getProScore(member);
            const hasPenalty = member.games > 0 && member.games < rankings.threshold;

            const featuredName = clubData.featuredMember?.name ? clubData.featuredMember.name.toLowerCase().trim() : "";
            const isStarDelClub = featuredName ? (member.name.toLowerCase().trim() === featuredName || (member.proName && member.proName.toLowerCase().trim() === featuredName)) : false;

            return (
              <RenderPlayerRow
                key={member.name}
                member={member}
                rankIndex={idx + 1}
                isFirst={isFirst}
                isSecond={isSecond}
                isThird={isThird}
                isTOTW={isTOTW}
                isStarDelClub={isStarDelClub}
                score={score}
                language={language}
                hasPenalty={hasPenalty}
                threshold={rankings.threshold}
                onSelect={() => setSelectedMember(member)}
              />
            );
          })
        )}
      </div>

      {/* PLAYER MODAL */}
      <PlayerCardModal
        member={selectedMember}
        onClose={() => setSelectedMember(null)}
        initialTab="kpi"
      />
    </div>
  );
}

/* HELPER COMPONENT FOR CLEAN PLAYER RANKING ROW */
interface RenderPlayerRowProps {
  member: ClubMember;
  rankIndex: number;
  isFirst: boolean;
  isSecond: boolean;
  isThird: boolean;
  isTOTW: boolean;
  isStarDelClub?: boolean;
  score: number;
  language: string;
  hasPenalty: boolean;
  threshold: number;
  onSelect: () => void;
}
function RenderPlayerRow({
  member,
  rankIndex,
  isFirst,
  isSecond,
  isThird,
  isTOTW,
  isStarDelClub,
  score,
  language,
  hasPenalty,
  threshold,
  onSelect
}: RenderPlayerRowProps) {
  const ws = member.weeklyStats;
  const isInactive = !member.games || member.games === 0;

  // Render Rank Crown / Medal Badge
  const renderRankBadge = () => {
    if (rankIndex === 1) {
      return (
        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-[#ffd89b] via-[#d7ae6a] to-[#926c2e] p-[1px] shadow-[0_0_12px_rgba(215,174,106,0.35)] shrink-0" title="1° Posto">
          <div className="w-full h-full bg-gradient-to-br from-[#1e1a12] to-[#12100b] rounded-[11px] flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[#d7ae6a]/20 blur-xs" />
            <Crown className="w-4 h-4 sm:w-5 sm:h-5 text-[#d7ae6a] fill-[#d7ae6a]/20 stroke-[2.2] relative z-10" />
          </div>
        </div>
      );
    }
    if (rankIndex === 2) {
      return (
        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-slate-200 via-slate-400 to-slate-600 p-[1px] shadow-[0_0_10px_rgba(226,232,240,0.15)] shrink-0" title="2° Posto">
          <div className="w-full h-full bg-gradient-to-br from-[#1a1d24] to-[#111317] rounded-[11px] flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-slate-300/10 blur-xs" />
            <Medal className="w-4 h-4 sm:w-5 sm:h-5 text-slate-300 fill-slate-300/20 stroke-[2.2] relative z-10" />
          </div>
        </div>
      );
    }
    if (rankIndex === 3) {
      return (
        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-amber-500 via-amber-700 to-amber-950 p-[1px] shadow-[0_0_10px_rgba(180,83,9,0.2)] shrink-0" title="3° Posto">
          <div className="w-full h-full bg-gradient-to-br from-[#1e1510] to-[#120d0a] rounded-[11px] flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-amber-600/10 blur-xs" />
            <Award className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500 fill-amber-500/20 stroke-[2.2] relative z-10" />
          </div>
        </div>
      );
    }
    return (
      <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-black/40 border border-white/10 flex items-center justify-center text-gray-400 font-sans font-bold text-xs shrink-0">
        #{rankIndex}
      </div>
    );
  };

  const rawRoleToParse = member.role && !["CC", "midfielder", "CM"].includes(member.role)
    ? member.role
    : (ws?.primaryPlayedRole || member.role || "");

  const parsedRole = parseAndTranslateRole(rawRoleToParse, language);
  const playedRole = parsedRole.nomeCompleto 
    ? `${parsedRole.nomeCompleto} (${parsedRole.sigla})` 
    : (rawRoleToParse || "—");

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onSelect}
      className={`relative flex flex-col lg:flex-row lg:items-center justify-between p-3.5 sm:p-4 rounded-xl border cursor-pointer hover:scale-[1.005] active:scale-[0.99] transition-all overflow-hidden gap-3 ${
        isFirst
          ? "bg-gradient-to-r from-[#d7ae6a]/20 via-[#18181c] to-[#121215] border-[#d7ae6a]/60 shadow-[0_0_20px_rgba(215,174,106,0.15)]"
          : isSecond
          ? "bg-gradient-to-r from-slate-400/15 via-[#18181c] to-[#121215] border-slate-400/30"
          : isThird
          ? "bg-gradient-to-r from-amber-700/15 via-[#18181c] to-[#121215] border-amber-600/30"
          : "bg-[#141418] hover:bg-[#18181d] border-white/5 hover:border-[#d7ae6a]/40"
      }`}
    >
      {isFirst && (
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#d7ae6a] to-transparent opacity-80" />
      )}

      {/* TOP HEADER ROW FOR MOBILE & LEFT SECTION FOR DESKTOP */}
      <div className="flex items-center justify-between lg:justify-start gap-3 min-w-0 lg:min-w-[220px]">
        {/* Left: Rank Badge + Name + Badges */}
        <div className="flex items-center gap-2.5 min-w-0">
          {renderRankBadge()}

          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className={`text-sm sm:text-base lg:text-lg font-bold font-sans truncate ${isFirst ? "text-white" : "text-gray-200"}`}>
                {member.name}
              </span>

              {isTOTW && (
                <span className="inline-flex items-center gap-0.5 text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full bg-[#d7ae6a]/20 text-[#d7ae6a] border border-[#d7ae6a]/40 shadow-sm shrink-0" title="Team of the Week">
                  <Trophy className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-[#d7ae6a]" />
                  <span>TOTW</span>
                </span>
              )}

              {isStarDelClub && (
                <span className="inline-flex items-center gap-0.5 text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm shrink-0" title="Star del Club (In corsa per la titolarità)">
                  <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-400 fill-amber-400" />
                  <span>{language === 'it' ? 'STAR DEL CLUB' : 'CLUB STAR'}</span>
                </span>
              )}
              
              {isInactive && (
                <span className="text-[9px] sm:text-[10px] font-semibold px-1.5 py-0.5 rounded bg-gray-800/80 text-gray-400 border border-gray-700 shrink-0">
                  {language === 'it' ? 'Inattivo' : 'Inactive'}
                </span>
              )}
            </div>

            <span className="text-[10px] font-mono text-gray-400 font-semibold uppercase tracking-wider">
              {playedRole}
            </span>
          </div>
        </div>

        {/* Right Header (Visible on Mobile/Tablet) - Compact Pro Score & EA Badge */}
        <div className="flex items-center gap-2 lg:hidden shrink-0">
          {/* EA Rating Badge */}
          <div className="flex flex-col items-end bg-black/50 px-2 py-1 rounded-lg border border-white/10">
            <span className="text-[8px] text-gray-400 font-bold uppercase tracking-wider">
              EA
            </span>
            <span className="text-xs font-mono font-bold text-gray-200">
              {member.ratingAve && parseFloat(member.ratingAve.toString()) > 0 
                ? parseFloat(member.ratingAve.toString()).toFixed(1) 
                : "—"}
            </span>
          </div>

          {/* Pro Score Badge */}
          <div className="flex flex-col items-end bg-[#d7ae6a]/15 px-2.5 py-1 rounded-lg border border-[#d7ae6a]/40">
            <span className="text-[8px] text-[#d7ae6a] font-black uppercase tracking-wider">
              PRO
            </span>
            <span className="text-sm font-mono font-black text-[#d7ae6a]">
              {score > 0 ? score : "N/D"}
            </span>
          </div>
        </div>
      </div>

      {/* STATS MATRIX - Optimized 3-Column Grid for Mobile & Desktop */}
      <div className="grid grid-cols-3 gap-1.5 sm:gap-3 bg-black/40 p-2 sm:p-2.5 px-2.5 sm:px-3.5 rounded-xl border border-white/5 flex-grow max-w-xl">
        {/* Stat 1: Matches, Goals, Assists */}
        <div className="flex flex-col justify-center min-w-0">
          <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider font-sans truncate">
            {language === 'it' ? 'Partite / Gol / Assist' : 'Matches / G / A'}
          </span>
          <span className="text-xs font-bold text-white flex items-center gap-1 font-sans mt-0.5 flex-wrap">
            <span className="font-mono text-white">{member.games || 0}P</span>
            <span className="text-gray-600 text-[10px]">•</span>
            <span className="font-mono text-[#d7ae6a]">{member.goals || 0}G</span>
            <span className="text-gray-600 text-[10px]">•</span>
            <span className="font-mono text-blue-400">{member.assists || 0}A</span>
          </span>
        </div>

        {/* Stat 2: Role Specific Efficiency */}
        <div className="flex flex-col justify-center min-w-0">
          <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider font-sans truncate">
            {language === 'it' ? 'Statistica Ruolo' : 'Role Stat'}
          </span>
          <span className="text-xs font-bold text-white font-sans mt-0.5 truncate">
            {!isInactive && ws ? (
              <>
                {member.category === 'goalkeeper' && (
                  <span className="text-amber-400 font-bold font-mono truncate">{ws.saves} parate</span>
                )}
                {member.category === 'defender' && (
                  <span className="text-blue-400 font-bold font-mono truncate">{ws.tackleSuccessRate}% contr.</span>
                )}
                {member.category === 'midfielder' && (
                  <span className="text-emerald-400 font-bold font-mono truncate">{ws.passSuccessRate}% pass.</span>
                )}
                {member.category === 'forward' && (
                  <span className="text-rose-400 font-bold font-mono truncate">{ws.shots} tiri</span>
                )}
              </>
            ) : (
              <span className="text-gray-500 text-xs italic font-normal">—</span>
            )}
          </span>
        </div>

        {/* Stat 3: MVP */}
        <div className="flex flex-col justify-center min-w-0">
          <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider font-sans truncate" title="Man of the Match assegnati da EA">
            {language === 'it' ? 'MOTM (EA)' : 'MOTM (EA)'}
          </span>
          <span className="text-xs font-bold text-white font-sans mt-0.5 truncate">
            {!isInactive ? (
              member.manOfTheMatch && member.manOfTheMatch > 0 ? (
                <span className="text-[#d7ae6a] font-bold font-mono">
                  ⭐ {member.manOfTheMatch} MOTM
                </span>
              ) : (
                <span className="text-gray-400 font-mono">0 MOTM</span>
              )
            ) : (
              <span className="text-gray-500 text-xs italic font-normal">—</span>
            )}
          </span>
        </div>
      </div>

      {/* RIGHT SECTION FOR DESKTOP (Hidden on mobile since shown in top header) */}
      <div className="hidden lg:flex items-center gap-4 justify-end border-l border-white/10 pl-5 shrink-0">
        {/* Voto EA */}
        <div className="flex flex-col items-end">
          <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider flex items-center gap-1 font-sans">
            {language === 'it' ? 'Voto EA' : 'EA Rating'}
            {hasPenalty && (
              <span title={language === 'it' ? `< ${threshold} Partite: peso presenze applicato` : `< ${threshold} Games: attendance weight applied`} className="text-red-400 cursor-help">
                (*)
              </span>
            )}
          </span>
          <span className="text-sm font-bold text-gray-300 font-sans font-mono">
            {member.ratingAve && parseFloat(member.ratingAve.toString()) > 0 
              ? parseFloat(member.ratingAve.toString()).toFixed(1) 
              : "—"}
          </span>
        </div>

        {/* Punteggio Pro */}
        <div className="flex flex-col items-end bg-[#d7ae6a]/10 p-2.5 px-4 rounded-xl border border-[#d7ae6a]/40 shadow-sm">
          <span className="text-[9px] text-[#d7ae6a] font-black uppercase tracking-widest flex items-center gap-1 font-sans">
            {language === 'it' ? 'Punteggio Pro' : 'Pro Score'}
          </span>
          <div className="flex items-baseline gap-1 mt-0.5">
            {score > 0 ? (
              <>
                <span className="text-2xl font-serif font-black text-[#d7ae6a] leading-none font-mono">
                  {score}
                </span>
                <span className="text-[10px] font-bold text-[#d7ae6a]/70 font-sans">/100</span>
              </>
            ) : (
              <span className="text-sm font-bold text-gray-500 font-sans leading-tight">
                {language === 'it' ? 'N/D' : 'N/A'}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
