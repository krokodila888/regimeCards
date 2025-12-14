import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingOverlayProps {
  isVisible: boolean;
  message?: string;
}

export default function LoadingOverlay({ isVisible, message }: LoadingOverlayProps) {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-12 h-12 text-white animate-spin" />
        {message && (
          <p className="text-white">{message}</p>
        )}
      </div>
    </div>
  );
}
