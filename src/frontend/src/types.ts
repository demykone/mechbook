// Re-export backend types
export type { Booking } from "./backend";
export { BookingStatus, UserRole } from "./backend";

// Slot time configuration
export const SLOT_TIMES: Record<
  number,
  { start: string; end: string; label: string }
> = {
  0: { start: "09:00", end: "10:30", label: "9:00 AM" },
  1: { start: "12:00", end: "13:30", label: "12:00 PM" },
  2: { start: "14:30", end: "16:00", label: "2:30 PM" },
  3: { start: "16:30", end: "18:00", label: "4:30 PM" },
};

// Chat message type for AI agent
export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}
