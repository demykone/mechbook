import { createActor } from "@/backend";
import { useActor } from "@caffeineai/core-infrastructure";

export function useBackend() {
  return useActor(createActor);
}
