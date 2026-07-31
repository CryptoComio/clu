import React, { useState, useEffect } from "react";
import { CrestProps } from "../types";

export const CrestImage: React.FC<CrestProps> = ({ 
  crestId, 
  className = "w-7 h-7 object-contain select-none", 
  alt = "Crest" 
}) => {
  const [src, setSrc] = useState<string>(() => {
    if (!crestId) return "https://res.cloudinary.com/kwwyxgal/image/upload/v1783610453/LOGO_IGLOO_Studios.pdf_xledzj.png";
    const cleanId = String(crestId).trim().toLowerCase();
    const finalCrestName = cleanId.startsWith("l") ? cleanId : `l${cleanId}`;
    return `https://eafc26.content.easports.com/fc/fltOnlineAssets/26E4D4D6-8DBB-4A9A-BD99-9C47D3AA341D/2026/fcweb/crests/256x256/${finalCrestName}.png`;
  });
  const [fallbackLevel, setFallbackLevel] = useState(0);

  useEffect(() => {
    if (!crestId) {
      setSrc("https://res.cloudinary.com/kwwyxgal/image/upload/v1783610453/LOGO_IGLOO_Studios.pdf_xledzj.png");
      setFallbackLevel(0);
      return;
    }
    const cleanId = String(crestId).trim().toLowerCase();
    const finalCrestName = cleanId.startsWith("l") ? cleanId : `l${cleanId}`;
    setSrc(`https://eafc26.content.easports.com/fc/fltOnlineAssets/26E4D4D6-8DBB-4A9A-BD99-9C47D3AA341D/2026/fcweb/crests/256x256/${finalCrestName}.png`);
    setFallbackLevel(0);
  }, [crestId]);

  const handleError = () => {
    const cleanId = String(crestId).trim().toLowerCase();
    const finalCrestName = cleanId.startsWith("l") ? cleanId : `l${cleanId}`;

    if (fallbackLevel === 0) {
      setSrc(`https://eafc25.content.easports.com/fc/fltOnlineAssets/25E4CDAE-799B-45BE-B257-667FDCDE8044/2025/fcweb/crests/256x256/${finalCrestName}.png`);
      setFallbackLevel(1);
    } else if (fallbackLevel === 1) {
      setSrc(`https://eafc24.content.easports.com/fc/fltOnlineAssets/24B23FDE-7835-41C2-87A2-F453DFDB2E82/2024/fcweb/crests/256x256/${finalCrestName}.png`);
      setFallbackLevel(2);
    } else {
      setSrc("https://res.cloudinary.com/kwwyxgal/image/upload/v1783610453/LOGO_IGLOO_Studios.pdf_xledzj.png");
    }
  };

  return (
    <img 
      src={src} 
      alt={alt} 
      className={className} 
      onError={handleError} 
      referrerPolicy="no-referrer"
      style={{
        filter: "drop-shadow(0 0 6px rgba(255, 255, 255, 0.35)) drop-shadow(0 0 1px rgba(255, 255, 255, 0.5))"
      }}
    />
  );
};
