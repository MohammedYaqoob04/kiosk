import { useQuery, type QueryKey } from "@tanstack/react-query";

export function useApi<T>(
  queryKey: QueryKey,
  queryFn: () => Promise<T>,
  options: { enabled?: boolean } = {},
): { data: T | undefined; loading: boolean; error: Error | null; reload: () => void } {
  const query = useQuery({
    queryKey,
    queryFn,
    enabled: options.enabled ?? true,
    staleTime: 30_000,
  });

  return {
    data: query.data,
    loading: query.isPending,
    error: query.error instanceof Error ? query.error : null,
    reload: () => {
      void query.refetch();
    },
  };
}
