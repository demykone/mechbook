import { createActor } from "@/backend";
import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Booking } from "../backend";

// ── Helpers ────────────────────────────────────────────────────────────────────
function isOk<T>(
  result: { __kind__: "ok"; ok: T } | { __kind__: "err"; err: string },
): T {
  if (result.__kind__ === "ok") return result.ok;
  throw new Error(result.err);
}

// ── Bookings ───────────────────────────────────────────────────────────────────

export function useBookings(startDate: string, endDate: string) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<Booking[]>({
    queryKey: ["bookings", startDate, endDate],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getBookings(startDate, endDate);
    },
    enabled: !!actor && !isFetching && !!startDate && !!endDate,
  });
}

export function useAvailableSlots(date: string) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<bigint[]>({
    queryKey: ["availableSlots", date],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAvailableSlots(date);
    },
    enabled: !!actor && !isFetching && !!date,
  });
}

export function useCreateBooking() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { date: string; slotIndex: number }) => {
      if (!actor) throw new Error("Not connected");
      return isOk(await actor.createBooking(vars.date, BigInt(vars.slotIndex)));
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bookings"] });
      qc.invalidateQueries({ queryKey: ["availableSlots"] });
    },
  });
}

export function useCancelBooking() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Not connected");
      return isOk(await actor.cancelBooking(id));
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bookings"] });
      qc.invalidateQueries({ queryKey: ["availableSlots"] });
    },
  });
}

// ── Auth / Admin ────────────────────────────────────────────────────────────────

export function useIsAdmin() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<boolean>({
    queryKey: ["isAdmin"],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching,
  });
}
