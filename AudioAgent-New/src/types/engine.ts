export interface TranscriptSegment {
  id?: string;
  speaker: string;
  source?: string; // Kept for backwards compatibility with overlay.ts if needed
  text: string;
  isLocal: boolean;
  timestampMs: number; // Kept for backwards compatibility with overlay.ts
  timestamp?: number;
  isFinal?: boolean;
}

export interface PlatformDomWatcher {
  readonly platformName: 'meet' | 'teams';
  start(onSegment: (segments: TranscriptSegment[]) => void): void;
  stop(): void;
  isCaptionsAvailable(): boolean;
}
