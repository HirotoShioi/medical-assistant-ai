import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { getDocumentsByThreadId } from "./service";
import { Document } from "@/models";

export const useDocumentsQuery = (
  threadId?: string,
  options: Omit<
    UseQueryOptions<Document[], Error, Document[]>,
    "queryKey" | "queryFn"
  > = {}
) => {
  return useQuery({
    ...options,
    queryKey: ["documents", { threadId }],
    queryFn: () => getDocumentsByThreadId(threadId!),
    enabled: !!threadId,
  });
};
