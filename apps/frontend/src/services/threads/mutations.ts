import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createThread,
  deleteThread as deleteThreads,
  deleteThreadById,
  renameThread,
} from "./service";
import { NewThreadSettingsParams } from "@/models";

export const useCreateThreadMutation = () => {
  return useMutation({
    mutationFn: ({
      threadId,
      title,
      settings,
    }: {
      threadId: string;
      title?: string;
      settings: NewThreadSettingsParams;
    }) => createThread(threadId, title, settings),
  });
};

export const useRenameThreadMutation = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ threadId, title }: { threadId: string; title: string }) =>
      renameThread(threadId, title),
    onSuccess: (data) => {
      client.invalidateQueries({
        queryKey: ["thread", { threadId: data.id }],
      });
    },
  });
};

export const useDeleteThreadByIdMutation = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (threadId: string) => deleteThreadById(threadId),
    onSuccess: (_, threadId) => {
      client.invalidateQueries({ queryKey: ["threads"] });
      client.invalidateQueries({ queryKey: ["thread", { threadId }] });
    },
  });
};

export const useDeleteThreadMutation = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: () => deleteThreads(),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["threads"] });
    },
  });
};
