import { useQuery } from "@tanstack/react-query";
import { getThreadById, getThreads, getThreadSettingsById } from "./service";

export const useThreadQuery = (threadId: string) => {
  return useQuery({
    queryKey: ["thread", { threadId }],
    queryFn: () => getThreadById(threadId),
  });
};

export const useThreadsQuery = () => {
  return useQuery({
    queryKey: ["threads"],
    queryFn: () => getThreads(),
  });
};

export const useThreadSettingsQuery = (threadId?: string) => {
  return useQuery({
    queryKey: ["threadSettings", { threadId }],
    queryFn: () => getThreadSettingsById(threadId!),
    enabled: !!threadId,
  });
};
