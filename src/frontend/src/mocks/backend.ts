import type { backendInterface } from "../backend";
import { BookingStatus, UserRole } from "../backend";
import { Principal } from "@icp-sdk/core/principal";

const mockPrincipal = Principal.fromText("aaaaa-aa");
const now = BigInt(Date.now()) * BigInt(1_000_000);
const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);
const tomorrowStr = tomorrow.toISOString().slice(0, 10);

const nextWeek = new Date();
nextWeek.setDate(nextWeek.getDate() + 7);
const nextWeekStr = nextWeek.toISOString().slice(0, 10);

export const mockBackend: backendInterface = {
  _initializeAccessControl: async () => undefined,

  assignCallerUserRole: async () => undefined,

  cancelBooking: async () => ({ __kind__: "ok" as const, ok: null }),

  createBooking: async () => ({
    __kind__: "ok" as const,
    ok: {
      id: BigInt(3),
      date: tomorrowStr,
      slotIndex: BigInt(0),
      startTime: "09:00",
      endTime: "10:30",
      status: BookingStatus.active,
      createdAt: now,
    },
  }),

  getAvailableSlots: async () => [BigInt(0), BigInt(1), BigInt(2), BigInt(3)],

  getBookings: async () => [
    {
      id: BigInt(1),
      date: tomorrowStr,
      slotIndex: BigInt(0),
      startTime: "09:00",
      endTime: "10:30",
      status: BookingStatus.active,
      createdAt: now,
    },
    {
      id: BigInt(2),
      date: nextWeekStr,
      slotIndex: BigInt(2),
      startTime: "14:30",
      endTime: "16:00",
      status: BookingStatus.active,
      createdAt: now,
    },
  ],

  getCallerUserRole: async () => UserRole.admin,

  isCallerAdmin: async () => true,
};
