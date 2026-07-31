/// <reference types="vite/client" />
import { useState, useEffect, useMemo, useRef } from "react";
import { useLanguage } from "../contexts/LanguageContext";
import { ClubData } from "../types";
import { FALLBACK_CLUB_DATA } from "../data/fallbackData";

export type { ClubMember, MatchPlayer, MatchTeamStats, ClubMatch, PlayoffSeason, ClubData } from "../types";

const CACHE_KEY = "igloo_club_data_cache_v3";
const THROTTLE_MS = 15000; // 15s throttle to prevent slamming the port 3000 endpoint during hot reloads

export function useClubData() {
  const { language } = useLanguage();
  const lastFetchTimeRef = useRef<number>(0);

  const [rawClubData, setRawClubData] = useState<ClubData>(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (e) {
      console.warn("Failed to read club data from localStorage cache:", e);
    }
    return FALLBACK_CLUB_DATA;
  });
  const [loading, setLoading] = useState(false);
  const [isRefetching, setIsRefetching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchClubData = async (isManual = false) => {
    const now = Date.now();
    if (!isManual && now - lastFetchTimeRef.current < THROTTLE_MS) {
      console.log("Throttling club data fetch to prevent rate limits");
      setLoading(false);
      return;
    }

    if (isManual) {
      setIsRefetching(true);
    }
    setError(null);
    lastFetchTimeRef.current = now;

    try {
      const timestamp = Date.now();
      const url = import.meta.env.VITE_EA_CLUB_ID 
        ? `/api/club?clubId=${import.meta.env.VITE_EA_CLUB_ID}&_t=${timestamp}`
        : `/api/club?_t=${timestamp}`;
      
      const response = await fetch(url);
      
      if (response.status === 429) {
        throw new Error("Rate exceeded. Please try again later.");
      }

      const responseText = await response.text();
      
      if (responseText.includes("Rate exceeded") || responseText.includes("Too Many Requests")) {
        throw new Error("Rate exceeded. Please try again later.");
      }

      let json;
      try {
        json = JSON.parse(responseText);
      } catch (parseErr) {
        throw new Error("Received non-JSON response from server.");
      }
      
      if (json.success && json.data) {
        setRawClubData(json.data);
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify(json.data));
        } catch (e) {
          console.warn("Failed to write club data to localStorage:", e);
        }
      } else {
        if (!rawClubData || rawClubData === FALLBACK_CLUB_DATA) {
          setError(json.error || "Impossibile caricare i dati del club.");
        }
      }
    } catch (err: any) {
      if (err.name === 'TypeError' && err.message === 'Failed to fetch') {
        console.warn("Network error fetching club data. Server might be restarting.");
      } else {
        console.warn("Warning fetching club data (non-fatal, using fallback/cached data):", err.message || err);
      }
      
      // If we don't have cached data (other than fallback), we show a connection/rate error as a warning
      if (!rawClubData || rawClubData === FALLBACK_CLUB_DATA) {
        if (err.message && err.message.includes("Rate exceeded")) {
          setError(language === "it" ? "Limite di richieste superato. Riprova tra poco." : "Rate limit exceeded. Please try again in a few moments.");
        } else {
          setError(language === "it" ? "Errore di connessione durante il recupero dati." : "Connection error while fetching data.");
        }
      }
    } finally {
      setLoading(false);
      setIsRefetching(false);
    }
  };

  const clubData = useMemo(() => {
    if (!rawClubData) return null;

    if (!rawClubData.matches || !Array.isArray(rawClubData.matches)) {
      return rawClubData;
    }

    const locale = language === "it" ? "it-IT" : "en-US";

    const formattedMatches = rawClubData.matches.map((m) => {
      if (m.timestamp) {
        try {
          const dateObj = new Date(m.timestamp * 1000);
          const day = String(dateObj.getDate()).padStart(2, '0');
          let month = dateObj.toLocaleString(locale, { month: 'short' }).toUpperCase();
          month = month.replace(/\./g, ""); // Remove trailing dots from abbreviated months
          const time = dateObj.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
          
          return {
            ...m,
            day,
            month,
            date: `${day} ${month}, ${time}`
          };
        } catch (e) {
          console.error("Error formatting match date on client:", e);
        }
      }
      return m;
    });

    return {
      ...rawClubData,
      matches: formattedMatches
    };
  }, [rawClubData, language]);

  useEffect(() => {
    fetchClubData();

    // Polling interval of 5 minutes (300000 ms) for updates
    const interval = setInterval(() => {
      fetchClubData();
    }, 300000);

    return () => clearInterval(interval);
  }, []);

  return { clubData, loading, isRefetching, error, refetch: () => fetchClubData(true) };
}
