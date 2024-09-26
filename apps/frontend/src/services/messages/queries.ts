import { useQuery } from "@tanstack/react-query";
import { getMessagesByThreadId } from "./services";

export const useMessagesQuery = (threadId?: string) => {
  return useQuery({
    queryKey: ["messages", threadId],
    queryFn: () => getMessagesByThreadId(threadId!),
    enabled: !!threadId,
  });
};
