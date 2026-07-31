import React, { ErrorInfo, ReactNode } from "react";
import { ShieldAlert, RefreshCw } from "lucide-react";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
  override state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center font-sans">
          <div className="p-8 rounded-2xl bg-zinc-950 border border-gold/30 shadow-[0_0_30px_rgba(215,174,106,0.15)] max-w-md w-full">
            <div className="w-16 h-16 rounded-full bg-gold/10 border border-gold/40 flex items-center justify-center mx-auto mb-5 text-gold">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold font-serif text-gold mb-2">
              Si è verificato un errore imprevisto
            </h2>
            <p className="text-xs text-zinc-400 mb-6 leading-relaxed">
              Alcuni dati non sono stati caricati correttamente. Puoi provare a ricaricare l'applicazione.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 rounded-lg bg-gold text-black font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 mx-auto hover:bg-amber-400 transition-colors shadow-lg cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              Ricarica Pagina
            </button>
          </div>
        </div>
      );
    }

    return (this.props as Props).children;
  }
}

export default ErrorBoundary;
