import React from 'react';
import { Loader2 } from 'lucide-react';

export default function Loader({ fullScreen = false, message = "Loading data..." }) {
  const content = (
    <div className="flex flex-col items-center justify-center gap-4 animate-fade-in">
      {/* iOS-like glowing spinner */}
      <div className="relative flex items-center justify-center">
        <div className="absolute inset-0 bg-pink-500/20 blur-xl rounded-full" />
        <Loader2 className="w-10 h-10 text-pink-400 animate-spin relative z-10" />
      </div>
      
      <p className="text-sm font-semibold tracking-[0.2em] uppercase text-white/50 animate-pulse">
        {message}
      </p>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#09090b]/80 backdrop-blur-2xl">
        {content}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-[50vh] w-full">
      {content}
    </div>
  );
}
