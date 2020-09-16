interface EventData {
  [key: string]: string
}

export class Wt {
  track(event: string, data: EventData): void;
  login(loginId: string): void
}
