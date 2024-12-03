import React from 'react';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';

interface NetworkStatusProps {
  isOnline: boolean;
  isSyncing: boolean;
}

export const NetworkStatus: React.FC<NetworkStatusProps> = ({ isOnline, isSyncing }) => {
  return (
    <div className="fixed top-4 right-4 flex items-center gap-2 bg-white rounded-full shadow-md px-4 py-2">
      {isOnline ? (
        <>
          <Wifi className="w-5 h-5 text-green-500" />
          <span className="text-sm text-gray-600">Online</span>
        </>
      ) : (
        <>
          <WifiOff className="w-5 h-5 text-red-500" />
          <span className="text-sm text-gray-600">Offline</span>
        </>
      )}
      {isSyncing && (
        <RefreshCw className="w-5 h-5 text-blue-500 animate-spin ml-2" />
      )}
    </div>
  );
};