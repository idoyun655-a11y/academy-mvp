import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { LIVE_QUERY_OPTIONS } from "@/lib/portal";

export function useLinkedPortalData() {
  const { user } = useAuth();

  const query = trpc.portal.linkedStudents.useQuery(undefined, {
    ...LIVE_QUERY_OPTIONS,
    enabled: user?.role === "student" || user?.role === "parent",
  });

  return {
    ...query,
    role: query.data?.role ?? user?.role ?? null,
    snapshots: query.data?.snapshots ?? [],
  };
}
