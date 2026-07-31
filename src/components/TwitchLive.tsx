/* RESPONSIVE: Mobile-first, fluid clamp(), auto-fit grid, card-transform tables */
import { useRef, useState, useEffect } from "react";
import { Shield, Tv, Radio } from "lucide-react";
import { motion, useScroll, useTransform } from "motion/react";
import { useLanguage } from "../contexts/LanguageContext";

export default function TwitchLive() {
  const containerRef = useRef<HTMLDivElement>(null);
  const desktopUrl = "https://www.twitch.tv/fcwhiteangelxi";
  const { t } = useLanguage();
  
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Setup useScroll for scroll-driven parallax effects
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  // Transform outputs based on scroll progression for parallax effect
  const contentY = useTransform(scrollYProgress, [0, 1], [40, -40]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0.6, 1, 1, 0.6]);
  const bgScale = useTransform(scrollYProgress, [0, 1], [1, 1]);

  return (
    <section
      ref={containerRef}
      id="twitch-live"
      className="relative w-full overflow-hidden flex items-center justify-center py-6 md:py-12 lg:py-16 bg-black border-y border-white/5 shadow-[0_0_100px_rgba(0,0,0,0.8)]"
    >
      {/* 1. BACKGROUND AND BLENDING ARTWORK (Z-INDEX 0) */}
      <motion.div
        style={{ scale: bgScale }}
        className="absolute inset-0 w-full h-full pointer-events-none select-none z-0 overflow-hidden bg-zinc-950"
      >
        {/* Sleek, responsive tech grid pattern for purple neon theme */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(147,51,234,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(147,51,234,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(147,51,234,0.08)_0%,transparent_60%)]" />

        {/* Video Element with hardware acceleration for a perfect loop - Fully opaque video */}
        <video
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          poster="/uploads/logo.jpg"
          className="absolute inset-0 w-full h-full object-cover object-top opacity-100"
          style={{
            transform: "translate3d(0, 0, 0)",
            willChange: "transform",
            backfaceVisibility: "hidden"
          }}
        >
          <source src="https://res.cloudinary.com/kwwyxgal/video/upload/w_1920,c_limit,f_auto,q_auto:best/v1783676821/Progetto_senza_titolo_20_b7veap.mp4" type="video/mp4" />
        </video>
        
        {/* Softened blending gradients to show much more of the brilliant video */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/60 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-black/90 pointer-events-none" />
        
        {/* Cinematic Letterbox effect gradients */}
        <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-black to-transparent pointer-events-none z-10" />
        <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-black to-transparent pointer-events-none z-10" />
      </motion.div>

      {/* 2. MAIN CONTENT AREA (Z-INDEX 20) */}
      <div className="relative z-20 w-full max-w-7xl mx-auto p-4 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-10 items-center">
        
        {/* Colonna Sinistra (7 colonne): Artwork Placeholder o Spazio per il Background */}
        <div className="hidden lg:block lg:col-span-7 h-full w-full pointer-events-none">
          {/* L'artwork (video) è in background, questo div riserva lo spazio e permette al video di brillare a sinistra */}
        </div>

        {/* Colonna Destra (5 colonne): Card con effetto vetro avanzato */}
        <motion.div
          style={{ y: isMobile ? 0 : contentY, opacity: contentOpacity }}
          className="col-span-1 md:col-span-12 lg:col-span-5"
        >
          {/* INIZIO GLASS CARD */}
          <div className="relative bg-black/50 backdrop-blur-2xl border border-white/10 hover:border-[#9146FF]/50 rounded-3xl p-6 sm:p-8 shadow-[0_25px_60px_rgba(0,0,0,0.9)] transition-all duration-500 overflow-hidden group text-left">
            
            {/* Bagliori d'Ambiente su Desktop */}
            <div className="hidden md:block absolute -top-12 -left-12 w-40 h-40 bg-[#d7ae6a]/15 rounded-full blur-3xl pointer-events-none"></div>
            <div className="hidden md:block absolute -bottom-12 -right-12 w-48 h-48 bg-[#9146FF]/25 rounded-full blur-3xl pointer-events-none group-hover:bg-[#9146FF]/40 transition-all duration-500"></div>

            {/* Badge Status */}
            <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full border border-[#d7ae6a]/40 bg-[#d7ae6a]/10 text-[#d7ae6a] text-xs font-bold tracking-[0.25em] uppercase mb-6 backdrop-blur-md">
              <Shield className="w-3.5 h-3.5 text-[#d7ae6a]" />
              <span>Pro Club Team</span>
            </div>

            {/* Titolo Principale */}
            <h2 className="font-serif font-black text-4xl xl:text-5xl tracking-wider leading-tight uppercase mb-4">
              <span className="text-[#e4dbcd] block">{t('twitch.direct') || "DIRETTA."}</span>
              <span className="text-[#d7ae6a] block">{t('twitch.excellence') || "ECCELLENZA."}</span>
            </h2>

            {/* Testo Descrittivo */}
            <p className="text-left text-[#a89b8a] text-base leading-relaxed font-sans font-medium my-6">
              {t('twitch.description')}
            </p>

            {/* Bottone Twitch Interattivo */}
            <a 
              href={desktopUrl} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="w-full py-4 px-8 rounded-2xl bg-[#9146FF] hover:bg-[#772ce8] text-white font-bold text-sm tracking-[0.15em] uppercase flex items-center justify-center gap-3 transition-all duration-300 shadow-[0_0_25px_rgba(145,70,255,0.35)] hover:shadow-[0_0_40px_rgba(145,70,255,0.7)] hover:scale-[1.02] active:scale-[0.98] mb-8"
            >
              {/* Icona Ufficiale Twitch SVG */}
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M2.149 0l-1.612 4.119v16.836h5.731v3.045h3.224l3.045-3.045h4.657l6.806-6.806v-14.149h-21.851zm19.343 13.134l-4.119 4.119h-4.657l-3.045 3.045v-3.045h-4.836v-15.045h16.657v10.895zm-9.314-5.373h2.149v5.015h-2.149v-5.015zm4.836 0h2.149v5.015h-2.149v-5.015z"/>
              </svg>
              {t('twitch.follow') || "SEGUI SU TWITCH"}
            </a>

            {/* Footer Stats Desktop */}
            <div className="border-t border-white/10 mt-8 pt-5 flex items-center justify-between">
              
              {/* Lato Sinistro: Official Stream */}
              <div className="flex flex-col items-start">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <Tv className="w-3.5 h-3.5 text-[#a89b8a]" />
                  <span className="text-[10px] text-[#a89b8a] font-bold tracking-widest block uppercase">Official Stream</span>
                </div>
                <span className="text-base font-serif font-bold text-white tracking-wide uppercase">
                  {t('twitch.direct') === "DIRETTE." || t('twitch.direct') === "DIRETTA." ? "DIRETTE" : "STREAMS"}
                </span>
              </div>
              
              {/* Lato Destro: Status */}
              <div className="flex flex-col items-end">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-[10px] text-[#a89b8a] font-bold tracking-widest block uppercase">Status</span>
                  {/* Pallino rosso pulsante con aura luminosa */}
                  <div className="relative flex items-center justify-center w-2 h-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500 shadow-[0_0_8px_#ef4444]"></span>
                  </div>
                </div>
                <span className="text-[#9146FF] font-black text-base tracking-wide uppercase">LIVE CHAT</span>
              </div>

            </div>

          </div>
          {/* FINE GLASS CARD */}
        </motion.div>
      </div>

      {/* Decorative Bottom Shadow / Ambient Purple Glow */}
      <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-[80%] h-32 bg-purple-500/5 blur-[80px] pointer-events-none rounded-full" />
    </section>
  );
}
