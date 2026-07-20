import React from 'react';
import { Loader2 } from 'lucide-react';

export default function Loader({ fullScreen = false, message = "Loading data..." }) {
  const content = (
    <div className="flex flex-col items-center justify-center gap-4">
      <Loader2 className="w-8 h-8 text-zinc-400 animate-spin" />
      <p className="text-sm font-medium text-zinc-500">
        {message}
      </p>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#09090b]">
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
