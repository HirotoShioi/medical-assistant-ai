import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { getResourcesByThreadId } from "./service";
import { Resource } from "@/models";

export const useResourcesQuery = (
  threadId?: string,
  options: Omit<
    UseQueryOptions<Resource[], Error, Resource[]>,
    "queryKey" | "queryFn"
  > = {}
) => {
  return useQuery({
    ...options,
    queryKey: ["resources", { threadId }],
    queryFn: () => getResourcesByThreadId(threadId!),
    enabled: !!threadId,
  });
};
