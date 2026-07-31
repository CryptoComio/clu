import React, { useState, useEffect } from "react";
import { ClubMember } from "../types";
import { useClubData } from "../hooks/useClubData";
import { 
  X, 
  Trophy, 
  Award, 
  Target, 
  Shield, 
  Activity, 
  Star, 
  Zap, 
  CheckCircle2, 
  BarChart3, 
  Flame, 
  TrendingUp, 
  ShieldCheck, 
  Crosshair, 
  UserCheck,
  Compass,
  ArrowUpRight,
  TrendingDown
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from "recharts";
import { parseAndTranslateRole } from "../utils/roleUtils";
import { useLanguage } from "../contexts/LanguageContext";

interface PlayerCardModalProps {
  member: ClubMember | null;
  onClose: () => void;
  initialTab?: "card" | "kpi" | "weekly";
}

export const PlayerCardModal: React.FC<PlayerCardModalProps> = ({ member, onClose, initialTab = "card" }) => {
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState<"card" | "kpi" | "weekly">(initialTab);
  const { clubData } = useClubData();
  const clubName = clubData?.name || "CLUB";

  useEffect(() => {
    if (member) {
      setActiveTab(initialTab);
    }
  }, [initialTab, member]);

  if (!member) return null;

  const parsedRole = parseAndTranslateRole(member.role, language);
  const mainRoleText = t(`members.roles.${member.category}`);

  // Base stats calculations
  const gp = Math.max(1, member.games);
  const goalsPerGame = member.goals / gp;
  const assistsPerGame = member.assists / gp;
  const ratingFactor = member.ratingAve ? Math.min(1, member.ratingAve / 10) : 0.75;

  // FUT Macro Stats formulas
  const PAC = Math.min(99, Math.max(60, Math.round(72 + ratingFactor * 20 + (member.category === 'forward' ? 8 : 0))));
  const SHO = Math.min(99, Math.max(45, Math.round(50 + goalsPerGame * 35 + (member.category === 'forward' ? 15 : 0))));
  const PAS = Math.min(99, Math.max(50, Math.round((member.passPercent || 75) * 0.7 + assistsPerGame * 25)));
  const DRI = Math.min(99, Math.max(55, Math.round(65 + ratingFactor * 25)));
  const DEF = Math.min(99, Math.max(40, Math.round((member.tacklePercent || 60) * 0.6 + (member.cleanSheets / gp) * 30 + (member.category === 'defender' || member.category === 'goalkeeper' ? 20 : 0))));
  const PHY = Math.min(99, Math.max(55, Math.round(60 + Math.min(30, gp * 0.3) + ((member.winPercent || 50) * 0.2))));

  // Radar chart dataset
  const radarData = [
    { subject: language === 'it' ? "Finalizzazione" : "Finishing", value: SHO, fullMark: 100 },
    { subject: language === 'it' ? "Passaggi" : "Passing", value: PAS, fullMark: 100 },
    { subject: language === 'it' ? "Contrasti" : "Defending", value: DEF, fullMark: 100 },
    { subject: language === 'it' ? "Dribbling" : "Dribbling", value: DRI, fullMark: 100 },
    { subject: language === 'it' ? "Velocità" : "Pace", value: PAC, fullMark: 100 },
    { subject: language === 'it' ? "Fisicità" : "Physical", value: PHY, fullMark: 100 },
  ];

  const ws = member.weeklyStats;
  const proScore = ws?.compatibilityScore ?? Math.round((member.ratingAve || 7.2) * 10);
  const roleFidelity = ws?.roleFidelity ?? 100;

  // Role-Specific Detailed KPI & Metrics Generation
  const getRoleMetrics = () => {
    const cat = member.category;
    if (cat === "forward") {
      return {
        styleTitle: "Terminali d'Attacco & Finalizzazione",
        tacticalBadge: "Punta d'Area // Sniper",
        kpis: [
          { label: "Goal Per Match (GPG)", value: goalsPerGame.toFixed(2), benchmark: "0.65", unit: "gol/g", status: goalsPerGame >= 0.65 ? "top" : "good" },
          { label: "Conversion Rate (Tiri/Gol)", value: `${Math.min(42, Math.round(22 + goalsPerGame * 15))}%`, benchmark: "25%", unit: "%", status: "top" },
          { label: "Expected Goals (xG) / 90", value: (goalsPerGame * 0.92).toFixed(2), benchmark: "0.55", unit: "xG", status: "good" },
          { label: "Partecipazione Gol (G+A)", value: (goalsPerGame + assistsPerGame).toFixed(2), benchmark: "0.90", unit: "p/g", status: "top" },
        ],
        histogramData: [
          { metric: "Finishing %", player: Math.min(99, Math.round(SHO * 0.95)), leagueAvg: 72 },
          { metric: "Precisione Tiri", player: Math.min(98, Math.round(68 + goalsPerGame * 20)), leagueAvg: 60 },
          { metric: "Dribbling %", player: Math.min(95, Math.round(DRI * 0.9)), leagueAvg: 65 },
          { metric: "Key Passes", player: Math.min(90, Math.round(45 + assistsPerGame * 35)), leagueAvg: 50 },
        ],
        tacticalNote: "Eccellente freddezza sotto porta. Mantiene una posizione centrale dominante attirando i difensori avversari per creare sponda."
      };
    } else if (cat === "midfielder") {
      return {
        styleTitle: "Costruzione Gioco & Metronomo Tattico",
        tacticalBadge: "Regista di Centrocampo // Metronomo",
        kpis: [
          { label: "Accuracy Passaggi", value: `${member.passPercent || 82}%`, benchmark: "78%", unit: "%", status: "top" },
          { label: "Passaggi Chiave / Gara", value: (1.2 + assistsPerGame * 3.5).toFixed(1), benchmark: "1.8", unit: "kp/g", status: "top" },
          { label: "Palle Recuperate / Gara", value: (3.8 + ratingFactor * 2).toFixed(1), benchmark: "3.5", unit: "rec/g", status: "good" },
          { label: "Duelli Vinti %", value: `${Math.round(62 + ratingFactor * 20)}%`, benchmark: "60%", unit: "%", status: "good" },
        ],
        histogramData: [
          { metric: "Precisione Pass", player: member.passPercent || 84, leagueAvg: 75 },
          { metric: "Visione di Gioco", player: Math.min(99, Math.round(PAS * 0.96)), leagueAvg: 70 },
          { metric: "Intercetti", player: Math.min(95, Math.round(55 + ratingFactor * 30)), leagueAvg: 58 },
          { metric: "Resistenza Pressing", player: Math.min(96, Math.round(65 + ratingFactor * 25)), leagueAvg: 62 },
        ],
        tacticalNote: "Punto di riferimento nella prima impostazione. Garantisce un alto volume di passaggi e mantiene l'equilibrio della squadra."
      };
    } else if (cat === "defender") {
      return {
        styleTitle: "Copertura Tattica & Duelli Difensivi",
        tacticalBadge: "Muro Difensivo // Stopper",
        kpis: [
          { label: "Contrasti Vinti %", value: `${member.tacklePercent || 74}%`, benchmark: "68%", unit: "%", status: "top" },
          { label: "Clean Sheet Rate", value: `${Math.round((member.cleanSheets / gp) * 100)}%`, benchmark: "30%", unit: "%", status: "good" },
          { label: "Intercetti / Gara", value: (2.9 + ratingFactor * 2.5).toFixed(1), benchmark: "2.5", unit: "int/g", status: "top" },
          { label: "Duelli Aerei %", value: `${Math.round(70 + ratingFactor * 18)}%`, benchmark: "65%", unit: "%", status: "good" },
        ],
        histogramData: [
          { metric: "Precisione Tackles", player: member.tacklePercent || 75, leagueAvg: 64 },
          { metric: "Lettura Tattica", player: Math.min(98, Math.round(DEF * 0.95)), leagueAvg: 68 },
          { metric: "Forza nei Duelli", player: Math.min(97, Math.round(PHY * 0.92)), leagueAvg: 66 },
          { metric: "Pulizia Interventi", player: Math.min(99, Math.round(80 + ratingFactor * 15)), leagueAvg: 72 },
        ],
        tacticalNote: "Posizionamento difensivo impeccabile. Minimizza i rischi nella linea difensiva guidando i compagni nei raddoppi di marcatura."
      };
    } else {
      // Goalkeeper
      return {
        styleTitle: "Presidio della Porta & Riflessi",
        tacticalBadge: "Guardiano dei Pali // Shot Stopper",
        kpis: [
          { label: "Parate Decisive / Gara", value: (3.6 + ratingFactor * 1.5).toFixed(1), benchmark: "2.8", unit: "par/g", status: "top" },
          { label: "Clean Sheets Totali", value: `${member.cleanSheets}`, benchmark: "5", unit: "CS", status: "top" },
          { label: "Save Ratio %", value: `${Math.round(76 + ratingFactor * 15)}%`, benchmark: "70%", unit: "%", status: "top" },
          { label: "Uscite Riuscite %", value: `${Math.round(82 + ratingFactor * 12)}%`, benchmark: "75%", unit: "%", status: "good" },
        ],
        histogramData: [
          { metric: "Riflessi da Vicino", player: Math.min(99, Math.round(82 + ratingFactor * 15)), leagueAvg: 70 },
          { metric: "Presa & Rinvii", player: Math.min(95, Math.round(75 + ratingFactor * 18)), leagueAvg: 68 },
          { metric: "Uscite Basse/Alte", player: Math.min(94, Math.round(72 + ratingFactor * 20)), leagueAvg: 65 },
          { metric: "Reattività CS", player: Math.min(98, Math.round(80 + ratingFactor * 16)), leagueAvg: 71 },
        ],
        tacticalNote: "Reattività da top player sulle conclusioni ravvicinate. Comunica continuamente per posizionare la barriera e la difesa."
      };
    }
  };

  const roleData = getRoleMetrics();

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/85 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          transition={{ type: "spring", damping: 26, stiffness: 320 }}
          className="relative z-10 w-full max-w-4xl max-h-[92vh] bg-gradient-to-br from-[#14100c]/95 to-[#0a0a0a]/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_0_60px_rgba(0,0,0,0.9)] overflow-hidden my-auto text-white flex flex-col"
        >
          {/* Header Gold Hairline */}
          <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-[#d7ae6a] to-transparent shrink-0" />

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-lg bg-black/80 border border-white/10 text-[#a89b8a] hover:text-white hover:border-[#d7ae6a] transition-all cursor-pointer z-20"
            aria-label="Chiudi"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Top Bar Info */}
          <div className="px-5 sm:px-8 pt-5 pb-3 flex items-center justify-between border-b border-white/10 shrink-0 pr-14">
            <div className="flex items-center gap-2.5">
              <div className="w-2.5 h-2.5 rounded-full bg-[#d7ae6a] animate-pulse shadow-[0_0_8px_#d7ae6a]" />
              <span className="font-mono text-[11px] sm:text-xs text-[#a89b8a] tracking-widest uppercase truncate">
                {clubName.toUpperCase()} // INFOGRAFICA & ANALISI
              </span>
            </div>
          </div>

          {/* Modal Tab Controls (Segmented Pill Buttons) */}
          <div className="px-4 sm:px-8 pt-3 pb-2 border-b border-white/10 shrink-0">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 p-1 bg-black/50 border border-white/10 rounded-xl">
              {[
                { id: "card", label: language === "it" ? "FUT Card & Radar" : "FUT Card & Radar", icon: Star },
                { id: "kpi", label: language === "it" ? "KPI & Efficienza" : "Role KPIs & Efficiency", icon: BarChart3 },
                { id: "weekly", label: language === "it" ? "Finestra Live" : "Live Weekly Window", icon: TrendingUp },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg font-serif text-[11px] sm:text-xs font-bold uppercase tracking-wider transition-all cursor-pointer border ${
                      isActive
                        ? "bg-gradient-to-r from-[#ffd89b] via-[#d7ae6a] to-[#b88e4c] text-black border-[#d7ae6a] shadow-[0_0_15px_rgba(215,174,106,0.4)]"
                        : "bg-transparent text-[#a89b8a] hover:text-[#d7ae6a] hover:bg-white/5 border-transparent"
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? "text-black" : "text-[#d7ae6a]"}`} />
                    <span className="truncate">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-4 sm:p-8 overflow-y-auto max-h-[calc(92vh-130px)] custom-scrollbar min-w-0">
            {/* TAB 1: FUT CARD & RADAR */}
            {activeTab === "card" && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-8 items-center">
                {/* LEFT COLUMN: FUT EA FC ULTIMATE TEAM PLAYER CARD */}
                <div className="md:col-span-5 flex flex-col items-center justify-center">
                  <div className="relative w-64 sm:w-72 h-[390px] sm:h-[430px] rounded-2xl p-5 bg-gradient-to-b from-[#14100c] via-[#111111] to-[#0a0a0a] border border-[#d7ae6a]/60 shadow-[0_0_40px_rgba(215,174,106,0.2)] flex flex-col justify-between overflow-hidden group">
                    
                    {/* Background Card Details / Watermark */}
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-[#d7ae6a]/15 via-transparent to-transparent pointer-events-none" />
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#d7ae6a]/10 rounded-full blur-2xl pointer-events-none" />

                    {/* Top Section: Overall & Role & Crest */}
                    <div className="flex justify-between items-start z-10">
                      <div className="flex flex-col items-center">
                        <span className="font-serif text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-[#d7ae6a] to-[#9a7b4f] drop-shadow-[0_2px_10px_rgba(215,174,106,0.4)]">
                          {member.overall}
                        </span>
                        <span className="text-xs sm:text-sm font-mono tracking-widest text-white uppercase font-bold mt-0.5 border-b border-[#d7ae6a]/40 pb-0.5">
                          {parsedRole.sigla}
                        </span>
                        <span className="text-[10px] text-[#a89b8a] uppercase tracking-wider font-semibold mt-1">
                          {mainRoleText}
                        </span>
                      </div>

                      {/* FC WhiteAngelXI Crest Placeholder */}
                      <div className="w-12 h-12 rounded-lg bg-black/50 border border-[#d7ae6a]/50 flex items-center justify-center text-[#d7ae6a] shadow-md">
                        <Shield className="w-6 h-6 text-[#d7ae6a]" />
                      </div>
                    </div>

                    {/* Center Section: Avatar & Player Name */}
                    <div className="flex flex-col items-center text-center z-10 my-auto">
                      <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-full bg-gradient-to-br from-[#14100c] to-[#0a0a0a] border-2 border-[#d7ae6a]/60 flex items-center justify-center text-2xl font-black text-white font-serif shadow-xl mb-2">
                        {member.name.substring(0, 2).toUpperCase()}
                      </div>
                      <h3 className="font-serif font-black text-lg sm:text-xl text-white tracking-wide uppercase line-clamp-1">
                        {member.name}
                      </h3>
                      {member.proName && member.proName !== member.name && (
                        <span className="text-xs text-[#d7ae6a]/90 italic font-sans font-medium mt-0.5">
                          "{member.proName}"
                        </span>
                      )}
                      <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-[#d7ae6a]/50 to-transparent my-2.5" />
                    </div>

                    {/* Bottom Section: 6 Macro FUT Stats */}
                    <div className="grid grid-cols-6 gap-1 text-center bg-black/90 border border-white/10 rounded-lg p-2 z-10">
                      <div>
                        <span className="block font-mono font-bold text-xs sm:text-sm text-white">{PAC}</span>
                        <span className="block text-[8px] text-[#a89b8a] font-bold uppercase">PAC</span>
                      </div>
                      <div>
                        <span className="block font-mono font-bold text-xs sm:text-sm text-white">{SHO}</span>
                        <span className="block text-[8px] text-[#a89b8a] font-bold uppercase">SHO</span>
                      </div>
                      <div>
                        <span className="block font-mono font-bold text-xs sm:text-sm text-white">{PAS}</span>
                        <span className="block text-[8px] text-[#a89b8a] font-bold uppercase">PAS</span>
                      </div>
                      <div>
                        <span className="block font-mono font-bold text-xs sm:text-sm text-white">{DRI}</span>
                        <span className="block text-[8px] text-[#a89b8a] font-bold uppercase">DRI</span>
                      </div>
                      <div>
                        <span className="block font-mono font-bold text-xs sm:text-sm text-white">{DEF}</span>
                        <span className="block text-[8px] text-[#a89b8a] font-bold uppercase">DEF</span>
                      </div>
                      <div>
                        <span className="block font-mono font-bold text-xs sm:text-sm text-white">{PHY}</span>
                        <span className="block text-[8px] text-[#a89b8a] font-bold uppercase">PHY</span>
                      </div>
                    </div>

                  </div>
                </div>

                {/* RIGHT COLUMN: RADAR CHART & DETAILED STATS */}
                <div className="md:col-span-7 flex flex-col gap-5">
                  
                  {/* Title & Badges */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
                    <div>
                      <h2 className="text-xl sm:text-2xl font-serif font-black text-white tracking-wide uppercase flex items-center gap-2">
                        {member.name}
                        {member.ratingAve >= 7.5 && (
                          <Star className="w-5 h-5 text-[#d7ae6a] fill-[#d7ae6a] animate-pulse" />
                        )}
                      </h2>
                      <p className="text-xs text-[#a89b8a] font-sans mt-0.5">
                        {clubName.toUpperCase()} Pro Club • Legione Ufficiale
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="px-3 py-1 rounded-md bg-[#d7ae6a]/10 border border-[#d7ae6a]/40 text-[#d7ae6a] text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5">
                        <Trophy className="w-3.5 h-3.5" />
                        OVR {member.overall}
                      </div>
                    </div>
                  </div>

                  {/* RADAR CHART (GRAFICO A RAGNATELA) */}
                  <div className="bg-gradient-to-br from-[#14100c]/60 to-[#0a0a0a]/60 border border-white/10 rounded-2xl p-4 sm:p-5 relative overflow-hidden shadow-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold font-serif uppercase tracking-widest text-[#d7ae6a] flex items-center gap-1.5">
                        <Activity className="w-4 h-4 text-[#d7ae6a]" />
                        Equilibrio Prestazioni Tattiche
                      </span>
                      <span className="text-[10px] font-mono text-[#a89b8a] uppercase tracking-wider">0 - 100 INDEX</span>
                    </div>

                    <div className="h-[210px] w-full flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                          <PolarGrid stroke="rgba(255,255,255,0.08)" />
                          <PolarAngleAxis 
                            dataKey="subject" 
                            tick={{ fill: "#a89b8a", fontSize: 10, fontWeight: 500, fontFamily: "Space Mono" }} 
                          />
                          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                          <Radar
                            name={member.name}
                            dataKey="value"
                            stroke="#d7ae6a"
                            fill="#d7ae6a"
                            fillOpacity={0.25}
                          />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* MACRO STATS GRID */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div className="bg-gradient-to-br from-[#14100c]/40 to-[#0a0a0a]/40 border border-white/5 rounded-xl p-3 text-center transition-all duration-300 hover:border-[#d7ae6a]/30">
                      <span className="block text-[10px] text-[#a89b8a] uppercase font-bold tracking-wider mb-1">Partite</span>
                      <span className="font-mono text-lg font-black text-white">{member.games}</span>
                    </div>

                    <div className="bg-gradient-to-br from-[#14100c]/40 to-[#0a0a0a]/40 border border-white/5 rounded-xl p-3 text-center transition-all duration-300 hover:border-[#d7ae6a]/30">
                      <span className="block text-[10px] text-[#a89b8a] uppercase font-bold tracking-wider mb-1">Gol Fatti</span>
                      <span className="font-mono text-lg font-black text-emerald-400">{member.goals}</span>
                    </div>

                    <div className="bg-gradient-to-br from-[#14100c]/40 to-[#0a0a0a]/40 border border-white/5 rounded-xl p-3 text-center transition-all duration-300 hover:border-[#d7ae6a]/30">
                      <span className="block text-[10px] text-[#a89b8a] uppercase font-bold tracking-wider mb-1">Assist</span>
                      <span className="font-mono text-lg font-black text-[#d7ae6a]">{member.assists}</span>
                    </div>

                    <div className="bg-gradient-to-br from-[#14100c]/40 to-[#0a0a0a]/40 border border-white/5 rounded-xl p-3 text-center transition-all duration-300 hover:border-[#d7ae6a]/30">
                      <span className="block text-[10px] text-[#a89b8a] uppercase font-bold tracking-wider mb-1">Voto EA</span>
                      <span className="font-mono text-lg font-black text-white">{member.ratingAve ? parseFloat(member.ratingAve.toString()).toFixed(1) : "—"}</span>
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* TAB 2: KPI & EFFICIENZA DI RUOLO */}
            {activeTab === "kpi" && (
              <div className="flex flex-col gap-6">
                
                {/* Header with Role Badge */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-serif text-lg font-bold uppercase text-white flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-[#d7ae6a]" />
                        {roleData.styleTitle}
                      </h3>
                    </div>
                    <p className="text-xs text-[#a89b8a] mt-0.5">
                      KPI avanzati specifici per il ruolo <strong className="text-[#d7ae6a]">{parsedRole.sigla} ({mainRoleText})</strong>
                    </p>
                  </div>

                  <div className="px-3 py-1.5 rounded-lg bg-[#d7ae6a]/10 border border-[#d7ae6a]/40 text-xs font-mono text-[#d7ae6a] font-bold flex items-center gap-2">
                    <Compass className="w-4 h-4 text-[#d7ae6a]" />
                    {roleData.tacticalBadge}
                  </div>
                </div>

                {/* 4 SPECIFIC ROLE KPI CARDS */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {roleData.kpis.map((kpi, index) => (
                    <div key={index} className="bg-gradient-to-br from-[#14100c]/40 to-[#0a0a0a]/40 border border-white/10 rounded-xl p-4 flex flex-col justify-between transition-all duration-300 hover:border-[#d7ae6a]/30">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] text-[#a89b8a] uppercase font-bold tracking-wider line-clamp-1">{kpi.label}</span>
                        <ArrowUpRight className="w-3.5 h-3.5 text-[#d7ae6a] shrink-0" />
                      </div>
                      <div>
                        <span className="font-mono text-xl sm:text-2xl font-black text-white">{kpi.value}</span>
                        <div className="flex items-center justify-between text-[9px] font-mono text-[#a89b8a] mt-1">
                          <span>Target: {kpi.benchmark}</span>
                          <span className="text-emerald-400 font-bold">TOP</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* HISTOGRAM (ISTOGRAMMA DI PRESTAZIONE RECHARTS) */}
                <div className="bg-gradient-to-br from-[#14100c]/60 to-[#0a0a0a]/60 border border-white/10 rounded-2xl p-4 sm:p-5 shadow-lg">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-xs sm:text-sm font-bold font-serif uppercase tracking-widest text-[#d7ae6a] flex items-center gap-1.5">
                          <Activity className="w-4 h-4 text-[#d7ae6a] shrink-0" />
                          Istogramma Comparativo
                        </h4>
                        <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-black/40 border border-white/10 text-[#a89b8a]">
                          Scale 0 - 100
                        </span>
                      </div>
                      <p className="text-[10px] sm:text-xs text-[#a89b8a] font-sans mt-1">
                        Metriche tecniche operative confrontate con gli standard della Divisione Elite
                      </p>
                    </div>

                    <div className="flex items-center gap-3 text-[10px] font-mono bg-black/40 px-2.5 py-1.5 rounded-lg border border-white/10 self-start sm:self-auto shrink-0">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-sm bg-[#d7ae6a]" />
                        <span className="text-white font-semibold">{member.name}</span>
                      </div>
                      <div className="w-px h-3 bg-white/10" />
                      <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-sm bg-white/10" />
                        <span className="text-[#a89b8a]">Media Elite</span>
                      </div>
                    </div>
                  </div>

                  <div className="h-[230px] sm:h-[250px] w-full pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={roleData.histogramData} margin={{ top: 10, right: 10, left: -22, bottom: 22 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis 
                          dataKey="metric" 
                          interval={0}
                          tick={(props: any) => {
                            const { x, y, payload } = props;
                            const text = payload.value || "";
                            const words = text.split(" ");
                            if (words.length > 1 && text.length > 9) {
                              const mid = Math.ceil(words.length / 2);
                              return (
                                <g transform={`translate(${x},${y})`}>
                                  <text x={0} y={10} textAnchor="middle" fill="#a89b8a" fontSize={9} fontFamily="Space Mono">
                                    {words.slice(0, mid).join(" ")}
                                  </text>
                                  <text x={0} y={21} textAnchor="middle" fill="#a89b8a" fontSize={9} fontFamily="Space Mono">
                                    {words.slice(mid).join(" ")}
                                  </text>
                                </g>
                              );
                            }
                            return (
                              <g transform={`translate(${x},${y})`}>
                                <text x={0} y={12} textAnchor="middle" fill="#a89b8a" fontSize={9} fontFamily="Space Mono">
                                  {text}
                                </text>
                              </g>
                            );
                          }} 
                          axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
                        />
                        <YAxis 
                          domain={[0, 100]} 
                          tick={{ fill: "#a89b8a", fontSize: 9, fontFamily: "Space Mono" }} 
                          axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
                        />
                        <Tooltip 
                          contentStyle={{ backgroundColor: "#0a0a0a", borderColor: "rgba(215,174,106,0.3)", borderRadius: "12px", color: "white", fontSize: "11px", border: "1px solid rgba(215,174,106,0.3)" }}
                          itemStyle={{ color: "white", fontSize: "11px" }}
                        />
                        <Bar dataKey="player" name={member.name} fill="#d7ae6a" radius={[4, 4, 0, 0]} maxBarSize={20} />
                        <Bar dataKey="leagueAvg" name="Media Elite" fill="rgba(255,255,255,0.08)" radius={[4, 4, 0, 0]} maxBarSize={20} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* INFOGRAFICA EFFICENZA PASSAGGI E CONTRASTI */}
                <div className="bg-gradient-to-br from-[#14100c]/60 to-[#0a0a0a]/60 border border-white/10 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
                  <span className="text-xs font-serif font-bold uppercase text-white flex items-center gap-2 mb-3">
                    <Crosshair className="w-4 h-4 text-[#d7ae6a]" />
                    Infografica Efficienza Passaggi & Contrasti
                  </span>

                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-xs font-mono mb-1.5">
                        <span className="text-[#a89b8a]">Passaggi Riusciti %</span>
                        <span className="text-[#d7ae6a] font-bold">{member.passPercent || ws?.passSuccessRate || 82}%</span>
                      </div>
                      <div className="w-full h-3 bg-black/50 rounded-full overflow-hidden border border-white/10 p-0.5">
                        <div 
                          className="h-full bg-gradient-to-r from-[#b88e4c] via-[#d7ae6a] to-[#ffd89b] rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(215,174,106,0.5)]" 
                          style={{ width: `${member.passPercent || ws?.passSuccessRate || 82}%` }} 
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-mono mb-1.5">
                        <span className="text-[#a89b8a]">Efficienza Contrasti %</span>
                        <span className="text-sky-400 font-bold">{member.tacklePercent || ws?.tackleSuccessRate || 68}%</span>
                      </div>
                      <div className="w-full h-3 bg-black/50 rounded-full overflow-hidden border border-white/10 p-0.5">
                        <div 
                          className="h-full bg-gradient-to-r from-sky-700 via-sky-500 to-sky-300 rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(56,189,248,0.5)]" 
                          style={{ width: `${member.tacklePercent || ws?.tackleSuccessRate || 68}%` }} 
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-mono mb-1.5">
                        <span className="text-[#a89b8a]">Fedeltà al Ruolo Tattico</span>
                        <span className="text-emerald-400 font-bold">{roleFidelity}%</span>
                      </div>
                      <div className="w-full h-3 bg-black/50 rounded-full overflow-hidden border border-white/10 p-0.5">
                        <div 
                          className="h-full bg-gradient-to-r from-emerald-700 via-emerald-500 to-emerald-300 rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(52,211,153,0.5)]" 
                          style={{ width: `${roleFidelity}%` }} 
                        />
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* TAB 3: FINESTRA SETTIMANALE LIVE */}
            {activeTab === "weekly" && (
              <div className="flex flex-col gap-6">
                <div className="border-b border-white/10 pb-3">
                  <div>
                    <h3 className="font-serif text-lg font-bold uppercase text-white flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-[#d7ae6a]" />
                      Finestra Settimanale Ufficiale (Lun - Gio)
                    </h3>
                    <p className="text-xs text-[#a89b8a] mt-0.5">
                      Statistiche live rilevate nelle partite ufficiali della settimana in corso
                    </p>
                  </div>
                </div>

                {/* Weekly Highlight Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-gradient-to-br from-[#14100c]/40 to-[#0a0a0a]/40 border border-white/10 p-4 rounded-xl text-center transition-all duration-300 hover:border-[#d7ae6a]/30">
                    <span className="block text-[10px] text-[#a89b8a] uppercase font-bold tracking-wider mb-1">Gare Settimana</span>
                    <span className="font-mono text-xl font-bold text-white">{(ws as any)?.games ?? 0}</span>
                  </div>

                  <div className="bg-gradient-to-br from-[#14100c]/40 to-[#0a0a0a]/40 border border-white/10 p-4 rounded-xl text-center transition-all duration-300 hover:border-[#d7ae6a]/30">
                    <span className="block text-[10px] text-[#a89b8a] uppercase font-bold tracking-wider mb-1">Gol Settimana</span>
                    <span className="font-mono text-xl font-bold text-emerald-400">{(ws as any)?.goals ?? 0}</span>
                  </div>

                  <div className="bg-gradient-to-br from-[#14100c]/40 to-[#0a0a0a]/40 border border-white/10 p-4 rounded-xl text-center transition-all duration-300 hover:border-[#d7ae6a]/30">
                    <span className="block text-[10px] text-[#a89b8a] uppercase font-bold tracking-wider mb-1">Assist Settimana</span>
                    <span className="font-mono text-xl font-bold text-[#d7ae6a]">{(ws as any)?.assists ?? 0}</span>
                  </div>

                  <div className="bg-gradient-to-br from-[#14100c]/40 to-[#0a0a0a]/40 border border-white/10 p-4 rounded-xl text-center transition-all duration-300 hover:border-[#d7ae6a]/30">
                    <span className="block text-[10px] text-[#a89b8a] uppercase font-bold tracking-wider mb-1">Voto Medio EA</span>
                    <span className="font-mono text-xl font-bold text-white">{(ws as any)?.ratingAve ? parseFloat((ws as any).ratingAve.toString()).toFixed(1) : "—"}</span>
                  </div>
                </div>

                {/* Algoritmo Punteggio Pro Card */}
                <div className="bg-gradient-to-br from-[#14100c]/60 to-[#0a0a0a]/60 border border-[#d7ae6a]/40 p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-[0_0_20px_rgba(215,174,106,0.05)]">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-[#d7ae6a]/15 border border-[#d7ae6a]/40 flex items-center justify-center shrink-0 text-[#d7ae6a]">
                      <Trophy className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-serif font-bold text-white text-sm">
                        Punteggio Pro Calcolato: {proScore} / 100
                      </h4>
                      <p className="text-xs text-[#a89b8a] mt-0.5 font-sans">
                        Basato sulla media voto, KPI di ruolo ({mainRoleText}), fedeltà tattica ({roleFidelity}%) e continuità presenze.
                      </p>
                    </div>
                  </div>

                  <div className="px-4 py-2 rounded-lg bg-[#14100c]/60 border border-white/10 text-center shrink-0">
                    <span className="text-[9px] text-[#a89b8a] font-mono block uppercase">Rendimento</span>
                    <span className="font-mono text-sm font-bold text-[#d7ae6a]">
                      {proScore >= 80 ? "ECCELLENTE" : proScore >= 65 ? "OTTIMO" : "IN CRESCITA"}
                    </span>
                  </div>
                </div>

              </div>
            )}
          </div>

          {/* Footer Notice */}
          <div className="px-5 sm:px-8 py-3 bg-black/50 border-t border-white/10 flex justify-between items-center text-[10px] text-[#a89b8a] font-mono">
            <span>{clubName.toUpperCase()} — DIVISIONE ELITE</span>
            <span>FC PRO CLUB LEAGUE</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default PlayerCardModal;
