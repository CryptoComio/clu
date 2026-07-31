import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useClubData } from '../hooks/useClubData';
import { Shield, User, Gamepad2, Mail, Smartphone, MonitorSmartphone, CheckCircle } from 'lucide-react';
import { motion } from 'motion/react';

export const Recruitment: React.FC = () => {
  const { language } = useLanguage();
  const { clubData } = useClubData();
  const clubName = clubData?.name || "CLUB";
  
  const [formData, setFormData] = useState({
    fullName: '',
    gamertag: '',
    email: '',
    phone: '',
    primaryRole: '',
    platform: 'PlayStation 5',
    experience: ''
  });
  
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch("/api/apply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          fullName: formData.fullName,
          eaId: formData.gamertag,
          email: formData.email,
          phone: formData.phone,
          role: formData.primaryRole,
          secondaryRoles: selectedRoles,
          platform: formData.platform,
          experience: formData.experience,
          statsPhoto: null
        })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || (language === 'it' ? "Impossibile inviare la candidatura. Riprova più tardi." : "Unable to submit application. Please try again later."));
      }

      setFormSubmitted(true);
      // Reset form data
      setFormData({
        fullName: '',
        gamertag: '',
        email: '',
        phone: '',
        primaryRole: '',
        platform: 'PlayStation 5',
        experience: ''
      });
      setSelectedRoles([]);
    } catch (err: any) {
      console.error("Errore invio candidatura:", err);
      setSubmitError(err.message || (language === 'it' ? "Si è verificato un errore durante l'invio." : "An error occurred during submission."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleRole = (role: string) => {
    setSelectedRoles(prev => 
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
    );
  };

  return (
    <section id="community" className="relative pt-0 pb-4 sm:pb-8 h-auto bg-black overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#d7ae6a]/20 to-transparent"></div>
      <div className="absolute -top-40 right-0 w-96 h-96 bg-[#d7ae6a]/5 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-6xl mx-auto px-4 my-4 lg:my-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="flex flex-col lg:flex-row items-stretch bg-[#000]/40 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl min-h-[600px]"
        >
          {/* COLONNA SINISTRA (Requisiti - Occupa il 40%) */}
          <div className="w-full lg:w-[40%] bg-black/80 p-8 lg:p-12 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-white/10">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0dd08b] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#0dd08b]"></span>
                </span>
                <span className="text-[#a89b8a] text-xs tracking-[0.3em] uppercase font-sans font-semibold">
                  {language === 'it' ? 'Selezioni Attive' : 'Active Trials'}
                </span>
              </div>
              <h2 className="text-4xl font-serif font-black text-white uppercase leading-tight tracking-wide mb-6">
                {language === 'it' ? (
                  <>Scegli Il Tuo<br/><span className="text-[#d7ae6a]">Destino.</span></>
                ) : (
                  <>Choose Your<br/><span className="text-[#d7ae6a]">Destiny.</span></>
                )}
              </h2>
              <p className="text-[#e4dbcd]/80 font-sans text-sm leading-relaxed mb-8">
                {language === 'it' ? (
                  <>Pensi di avere il talento e la mentalità per competere in EA SPORTS FC? Compila il modulo per unirti a <strong className="text-[#d7ae6a]">{clubName}</strong>.</>
                ) : (
                  <>Do you think you have the talent and mindset to compete in EA SPORTS FC? Fill out the form to join <strong className="text-[#d7ae6a]">{clubName}</strong>.</>
                )}
              </p>
            </div>

            {/* Requisiti spinti in basso in automatico da justify-between */}
            <div className="pt-8 border-t border-white/10 mt-12 lg:mt-auto">
              <span className="text-xs font-sans uppercase tracking-[0.2em] font-bold text-[#a89b8a] mb-6 block">
                {language === 'it' ? 'Requisiti Base' : 'Base Requirements'}
              </span>
              <ul className="space-y-5">
                <li className="flex items-start gap-4">
                  <span className="text-[#d7ae6a] mt-0.5 drop-shadow-[0_0_8px_rgba(215,174,106,0.6)]">✦</span>
                  <div className="flex flex-col">
                    <span className="text-white text-xs font-bold uppercase tracking-widest mb-1">
                      {language === 'it' ? 'Microfono & Discord' : 'Microphone & Discord'}
                    </span>
                    <span className="text-[#a89b8a] text-xs leading-relaxed">
                      {language === 'it' 
                        ? 'Comunicazione chiara e costante in game obbligatoria.' 
                        : 'Clear and constant communication in game is mandatory.'}
                    </span>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <span className="text-[#d7ae6a] mt-0.5 drop-shadow-[0_0_8px_rgba(215,174,106,0.6)]">✦</span>
                  <div className="flex flex-col">
                    <span className="text-white text-xs font-bold uppercase tracking-widest mb-1">
                      {language === 'it' ? 'Disponibilità Serale' : 'Evening Availability'}
                    </span>
                    <span className="text-[#a89b8a] text-xs leading-relaxed">
                      {language === 'it' 
                        ? 'Presenza minima garantita nei giorni e orari concordati.' 
                        : 'Minimum presence guaranteed during scheduled times.'}
                    </span>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <span className="text-[#d7ae6a] mt-0.5 drop-shadow-[0_0_8px_rgba(215,174,106,0.6)]">✦</span>
                  <div className="flex flex-col">
                    <span className="text-white text-xs font-bold uppercase tracking-widest mb-1">
                      {language === 'it' ? 'Mentalità Competitiva' : 'Competitive Mindset'}
                    </span>
                    <span className="text-[#a89b8a] text-xs leading-relaxed">
                      {language === 'it' 
                        ? 'Voglia di migliorarsi continuamente e giocare di squadra.' 
                        : 'Desire to constantly improve and play as a team.'}
                    </span>
                  </div>
                </li>
              </ul>
            </div>
          </div>

          {/* COLONNA DESTRA (Il Form - Occupa il 60%) */}
          <div className="w-full lg:w-[60%] p-8 lg:p-12 flex flex-col justify-between">
            {formSubmitted ? (
              <div className="bg-[#d7ae6a]/10 border border-[#d7ae6a]/30 p-8 rounded-2xl text-center my-auto">
                <CheckCircle className="w-12 h-12 text-[#d7ae6a] mx-auto mb-4" />
                <h4 className="font-sans font-bold text-[#e4dbcd] text-xl mb-2">
                  {language === 'it' ? 'Candidatura Inviata' : 'Application Sent'}
                </h4>
                <p className="text-[#a89b8a] text-sm leading-relaxed">
                  {language === 'it' 
                    ? 'La tua richiesta è stata registrata con successo. I capitani esamineranno le tue statistiche e ti contatteranno a breve per organizzare il provino.'
                    : 'Your application has been successfully submitted. The captains will review your stats and contact you shortly to schedule a trial.'
                  }
                </p>
              </div>
            ) : (
              <form onSubmit={handleFormSubmit} className="flex flex-col justify-between h-full gap-6">
                <div>
                  <h3 className="text-2xl font-serif font-black text-white uppercase tracking-widest mb-8">
                    {language === 'it' ? 'Invia la tua Richiesta' : 'Submit your Application'}
                  </h3>
                  
                  {/* Griglia Input Compatti */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                    {/* Nome e Cognome */}
                    <div>
                      <label className="text-xs font-sans uppercase tracking-[0.2em] font-semibold text-[#a89b8a] mb-2 flex items-center gap-1.5">
                        <User className="w-3 h-3 text-[#d7ae6a]" /> {language === 'it' ? 'Nome e Cognome *' : 'Full Name *'}
                      </label>
                      <input
                        type="text"
                        required
                        disabled={isSubmitting}
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        placeholder={language === 'it' ? 'es. Mario Rossi' : 'e.g., John Doe'}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-[#d7ae6a]/50 outline-none transition-all duration-300"
                      />
                    </div>
                    
                    {/* ID EA / Gamertag */}
                    <div>
                      <label className="text-xs font-sans uppercase tracking-[0.2em] font-semibold text-[#a89b8a] mb-2 flex items-center gap-1.5">
                        <Gamepad2 className="w-3 h-3 text-[#d7ae6a]" /> {language === 'it' ? 'ID EA / Gamertag *' : 'EA ID / Gamertag *'}
                      </label>
                      <input
                        type="text"
                        required
                        disabled={isSubmitting}
                        value={formData.gamertag}
                        onChange={(e) => setFormData({ ...formData, gamertag: e.target.value })}
                        placeholder={language === 'it' ? 'es. PSN ID, Xbox GT o ID EA' : 'e.g., EA ID'}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-[#d7ae6a]/50 outline-none transition-all duration-300"
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <label className="text-xs font-sans uppercase tracking-[0.2em] font-semibold text-[#a89b8a] mb-2 flex items-center gap-1.5">
                        <Mail className="w-3 h-3 text-[#d7ae6a]" /> Email
                      </label>
                      <input
                        type="email"
                        disabled={isSubmitting}
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder={language === 'it' ? 'es. mario.rossi@email.it' : 'e.g., john@email.com'}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-[#d7ae6a]/50 outline-none transition-all duration-300"
                      />
                    </div>

                    {/* Telefono / Telegram */}
                    <div>
                      <label className="text-xs font-sans uppercase tracking-[0.2em] font-semibold text-[#a89b8a] mb-2 flex items-center gap-1.5">
                        <Smartphone className="w-3 h-3 text-[#d7ae6a]" /> {language === 'it' ? 'Cellulare o Telegram' : 'Phone or Telegram'}
                      </label>
                      <input
                        type="text"
                        disabled={isSubmitting}
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder={language === 'it' ? 'es. @username' : 'e.g., @username'}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-[#d7ae6a]/50 outline-none transition-all duration-300"
                      />
                    </div>

                    {/* Ruolo Principale */}
                    <div>
                      <label className="text-xs font-sans uppercase tracking-[0.2em] font-semibold text-[#a89b8a] mb-2 flex items-center gap-1.5">
                        <Shield className="w-3 h-3 text-[#d7ae6a]" /> {language === 'it' ? 'Ruolo Principale *' : 'Primary Role *'}
                      </label>
                      <select
                        required
                        disabled={isSubmitting}
                        value={formData.primaryRole}
                        onChange={(e) => setFormData({ ...formData, primaryRole: e.target.value })}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-[#d7ae6a]/50 outline-none transition-all duration-300 appearance-none cursor-pointer"
                      >
                        <option value="" disabled>{language === 'it' ? 'Seleziona Ruolo' : 'Select Role'}</option>
                        <option value="PORTIERE">{language === 'it' ? 'Portiere (POR)' : 'Goalkeeper (GK)'}</option>
                        <option value="DIFENSORE">{language === 'it' ? 'Difensore (DIF)' : 'Defender (DEF)'}</option>
                        <option value="CENTROCAMPISTA">{language === 'it' ? 'Centrocampista (CEN)' : 'Midfielder (MID)'}</option>
                        <option value="ESTERNO">{language === 'it' ? 'Esterno (EST)' : 'Winger (WING)'}</option>
                        <option value="ATTACCANTE">{language === 'it' ? 'Attaccante (ATT)' : 'Striker (ST)'}</option>
                      </select>
                    </div>

                    {/* Piattaforma */}
                    <div>
                      <label className="text-xs font-sans uppercase tracking-[0.2em] font-semibold text-[#a89b8a] mb-2 flex items-center gap-1.5">
                        <MonitorSmartphone className="w-3 h-3 text-[#d7ae6a]" /> {language === 'it' ? 'Piattaforma' : 'Platform'}
                      </label>
                      <select
                        disabled={isSubmitting}
                        value={formData.platform}
                        onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-[#d7ae6a]/50 outline-none transition-all duration-300 appearance-none cursor-pointer"
                      >
                        <option>PlayStation 5</option>
                        <option>Xbox Series X|S</option>
                        <option>PC</option>
                      </select>
                    </div>
                  </div>

                  {/* RUOLI RICOPERTI SECONDARI - 5 pillole tag principali */}
                  <div className="mb-8">
                    <label className="text-xs font-sans uppercase tracking-[0.2em] font-semibold text-[#a89b8a] mb-3 block">
                      {language === 'it' ? 'Ruoli Ricoperti (Seleziona i secondari)' : 'Covered Roles (Select secondary)'}
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {['PORTIERE', 'DIFENSORE', 'CENTROCAMPISTA', 'ESTERNO', 'ATTACCANTE'].map(ruolo => {
                        const isSelected = selectedRoles.includes(ruolo);
                        return (
                          <button
                            key={ruolo}
                            type="button"
                            disabled={isSubmitting}
                            onClick={() => toggleRole(ruolo)}
                            className={`px-4 py-2.5 rounded-lg border text-xs font-sans tracking-widest uppercase transition-all duration-300 ${
                              isSelected
                                ? 'border-[#d7ae6a] bg-[#d7ae6a]/10 text-[#d7ae6a] font-bold shadow-[0_0_12px_rgba(215,174,106,0.2)]'
                                : 'border-white/10 bg-white/5 text-gray-400 hover:border-[#d7ae6a] hover:text-[#d7ae6a]'
                            }`}
                          >
                            {ruolo}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Esperienza nel Pro Club */}
                  <div className="flex flex-col mb-8">
                    <label className="text-xs font-sans uppercase tracking-[0.2em] font-semibold text-[#a89b8a] mb-3">
                      {language === 'it' ? 'Esperienza nel Pro Club' : 'Pro Club Experience'}
                    </label>
                    <textarea
                      required
                      rows={3}
                      disabled={isSubmitting}
                      value={formData.experience}
                      onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                      placeholder={language === 'it' ? "Descrivi la tua esperienza..." : "Describe your experience..."}
                      className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-sm text-white focus:border-[#d7ae6a]/50 outline-none resize-none placeholder:text-gray-600 transition-all duration-300"
                    ></textarea>
                  </div>
                </div>

                {/* Submit Error */}
                {submitError && (
                  <div className="text-red-400 font-serif text-[11px] uppercase tracking-wider text-center mb-4">
                    ⚠️ {submitError}
                  </div>
                )}

                {/* BOTTONE FINALE (Oro premium bg-[#d7ae6a] text-black) */}
                <motion.button
                  type="submit"
                  disabled={isSubmitting}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 400, damping: 15 }}
                  className="w-full py-5 rounded-xl bg-[#d7ae6a] hover:bg-[#f3d795] text-black font-serif font-black text-sm uppercase tracking-[0.2em] transition-all duration-300 shadow-[0_0_25px_rgba(215,174,106,0.35)] hover:shadow-[0_0_35px_rgba(215,174,106,0.7)] mt-auto group flex items-center justify-center gap-3 disabled:opacity-50 disabled:pointer-events-none relative overflow-hidden"
                >
                  {/* Sliding Shimmer effect */}
                  <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] pointer-events-none" />
                  
                  {isSubmitting ? (
                    <span className="flex items-center gap-2 relative z-10">
                      <svg className="animate-spin h-4 w-4 text-black" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {language === 'it' ? 'INVIO IN CORSO...' : 'SENDING...'}
                    </span>
                  ) : (
                    <span className="flex items-center gap-3 relative z-10">
                      <span>{language === 'it' ? 'Invia Candidatura' : 'Submit Application'}</span>
                      <span className="transform transition-transform group-hover:translate-x-2 text-lg">&rarr;</span>
                    </span>
                  )}
                </motion.button>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
};
