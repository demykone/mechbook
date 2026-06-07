import { createActor } from "@/backend";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { useActor } from "@caffeineai/core-infrastructure";
import { useQuery } from "@tanstack/react-query";

export function useAuth() {
  const {
    identity,
    login,
    clear,
    isAuthenticated,
    isLoggingIn,
    isInitializing,
  } = useInternetIdentity();

  const { actor, isFetching } = useActor(createActor);

  const { data: isAdmin = false } = useQuery<boolean>({
    queryKey: ["isAdmin"],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching && isAuthenticated,
  });

  const principal = identity?.getPrincipal();

  return {
    isAuthenticated,
    isLoggingIn,
    isInitializing,
    principal,
    isAdmin,
    login,
    logout: clear,
  };
}
