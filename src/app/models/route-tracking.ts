export interface DayOpening {
  id: string;
  sessionId: string;
  latitude: number;
  longitude: number;
  routeId: string;
  routeName: string;
  salesPointId: string;
  salesPointName: string;
  employeeId: string;
  employeeName: string;
  deviceName: string;
  osVersion: string;
  finished: boolean;
  openedAt: string;
  closedAt: string | null;
  createdAt: string;
}

export interface RouteTrackingPoint {
  id: string;
  dayOpeningId: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude: number;
  speed: number;
  provider: string;
  bearing: number;
  locationTimestamp: string;
  elapsedDurationMs: number;
  transactionType: string | null;
  transactionId: string | null;
}
