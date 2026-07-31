import { motion } from "motion/react";

export default function LoadingScreen({ videoSrc }: { videoSrc?: string }) {
  return (
    <motion.div 
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
      className="fixed inset-0 z-50 bg-[#09090b] text-white flex flex-col items-center justify-center overflow-hidden"
    >
      {/* Premium ambient backdrop fallback to prevent black screens on slow mobile networks */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(215,174,106,0.08)_0%,transparent_70%)] pointer-events-none" />
      
      {videoSrc && (
        <video 
          src={videoSrc} 
          autoPlay 
          loop 
          muted 
          playsInline
          preload="auto"
          className="absolute inset-0 w-full h-full object-cover object-center opacity-70 sm:opacity-100 transition-opacity duration-1000" 
        />
      )}
      <div className="relative z-10 flex flex-col items-center bg-black/60 p-8 rounded-2xl backdrop-blur-md border border-white/5 shadow-2xl">
        <div className="w-16 h-16 border-2 border-gold border-t-transparent rounded-full animate-spin mb-6 shadow-[0_0_15px_rgba(215,174,106,0.3)]" />
        <div className="text-gold font-serif tracking-widest text-sm animate-pulse">CARICAMENTO DATI...</div>
      </div>
    </motion.div>
  );
}
