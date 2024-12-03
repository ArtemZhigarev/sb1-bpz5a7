import { useEffect } from 'react';
import { useAccessStore } from '../store/accessStore';

export const useAccessLog = () => {
  const { addLog, updateLogStatus } = useAccessStore();

  useEffect(() => {
    const logAccess = async () => {
      try {
        // Get IP address from ipify API
        const ipResponse = await fetch('https://api.ipify.org?format=json');
        const { ip } = await ipResponse.json();

        // Parse user agent
        const ua = navigator.userAgent;
        const browserRegex = /(chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i;
        const browserMatch = ua.match(browserRegex) || [];
        const browser = browserMatch[1] || 'Unknown';

        // Detect OS
        const osRegex = /(windows|mac|linux|android|ios)/i;
        const osMatch = ua.match(osRegex) || [];
        const os = osMatch[1] || 'Unknown';

        // Detect device type
        const isMobile = /mobile|tablet|android|ios/i.test(ua);
        const device = isMobile ? 'Mobile' : 'Desktop';

        const log = {
          timestamp: new Date(),
          ipAddress: ip,
          userAgent: ua,
          browser,
          os,
          device,
          online: navigator.onLine,
          lastSeen: new Date()
        };

        addLog(log);

        // Update online status
        const handleOnline = () => updateLogStatus(log.id, true);
        const handleOffline = () => updateLogStatus(log.id, false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
          window.removeEventListener('online', handleOnline);
          window.removeEventListener('offline', handleOffline);
        };
      } catch (error) {
        console.error('Failed to log access:', error);
      }
    };

    logAccess();
  }, []);
};