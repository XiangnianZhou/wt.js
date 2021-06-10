interface EventData {
  [key: string]: string
}

export class Wt {
  track(event: string, data: EventData): void;
  login(loginId: string): void;
  sessionId: string;
}

export function createWt (): Wt
export function initWt (host: string, project: string, logstore: string): Wt
