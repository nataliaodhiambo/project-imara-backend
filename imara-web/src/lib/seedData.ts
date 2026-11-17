export type AthleteStatus = "ACTIVE" | "INJURED" | "RESTING";
export type SessionType = "PHYSICAL" | "TECHNICAL" | "TACTICAL" | "RECOVERY";

export interface Athlete {
  id: number;
  name: string;
  squadNumber: number;
  position: string;
  status: AthleteStatus;
  age: number;
  weight: number; // kg
  height: number; // cm
}

export interface Session {
  id: number;
  sessionName: string;
  sessionType: SessionType;
  date: string; // YYYY-MM-DD
  durationMinutes: number;
  notes: string;
}

export const seedAthletes: Athlete[] = [
  { id: 1, name: "Marcus Hale", squadNumber: 1, position: "Goalkeeper", status: "ACTIVE", age: 29, weight: 87, height: 193 },
  { id: 2, name: "Declan Ashworth", squadNumber: 4, position: "Centre Back", status: "ACTIVE", age: 27, weight: 84, height: 189 },
  { id: 3, name: "Tobias Reinhardt", squadNumber: 5, position: "Centre Back", status: "INJURED", age: 31, weight: 86, height: 187 },
  { id: 4, name: "Callum Brennan", squadNumber: 3, position: "Left Back", status: "ACTIVE", age: 24, weight: 74, height: 177 },
  { id: 5, name: "Rafael Quintero", squadNumber: 8, position: "Central Midfielder", status: "ACTIVE", age: 26, weight: 76, height: 180 },
  { id: 6, name: "Jamie Fenwick", squadNumber: 6, position: "Defensive Midfielder", status: "RESTING", age: 28, weight: 79, height: 182 },
  { id: 7, name: "Idris Okafor", squadNumber: 10, position: "Attacking Midfielder", status: "ACTIVE", age: 23, weight: 72, height: 175 },
  { id: 8, name: "Luca Marchetti", squadNumber: 7, position: "Right Winger", status: "ACTIVE", age: 22, weight: 70, height: 173 },
  { id: 9, name: "Soren Lindqvist", squadNumber: 11, position: "Left Winger", status: "INJURED", age: 25, weight: 73, height: 178 },
  { id: 10, name: "Dominic Rhodes", squadNumber: 9, position: "Striker", status: "ACTIVE", age: 30, weight: 83, height: 188 },
];

export const seedSessions: Session[] = [
  {
    id: 1,
    sessionName: "Pre-Season Conditioning",
    sessionType: "PHYSICAL",
    date: "2026-10-05",
    durationMinutes: 90,
    notes: "High-intensity interval work and strength circuits.",
  },
  {
    id: 2,
    sessionName: "Passing and Possession Drills",
    sessionType: "TECHNICAL",
    date: "2026-10-07",
    durationMinutes: 75,
    notes: "Rondos, one-touch passing patterns, first touch under pressure.",
  },
  {
    id: 3,
    sessionName: "Defensive Shape Review",
    sessionType: "TACTICAL",
    date: "2026-10-09",
    durationMinutes: 60,
    notes: "Back four positioning and pressing triggers ahead of the weekend fixture.",
  },
  {
    id: 4,
    sessionName: "Active Recovery",
    sessionType: "RECOVERY",
    date: "2026-10-11",
    durationMinutes: 45,
    notes: "Pool session, mobility work and light stretching after match day.",
  },
  {
    id: 5,
    sessionName: "Set Piece Practice",
    sessionType: "TACTICAL",
    date: "2026-10-13",
    durationMinutes: 60,
    notes: "Corners and free kicks, attacking and defensive routines.",
  },
];