export interface AccessLog {
  id: string;
  timestamp: Date;
  ipAddress: string;
  userAgent: string;
  browser: string;
  os: string;
  device: string;
  online: boolean;
  lastSeen: Date;
}