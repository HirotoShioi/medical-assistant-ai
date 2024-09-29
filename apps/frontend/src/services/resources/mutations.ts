import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteResourceById, embedResource } from "./service";
import { NewResourceParams } from "@/models";

export const useResourceDeleteMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (resourceId: string) => deleteResourceById(resourceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resources"] });
    },
  });
};

export const useResourceCreateMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: NewResourceParams) => embedResource(params),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["usage"],
      });
      queryClient.invalidateQueries({
        queryKey: ["resources", { threadId: variables.threadId }],
      });
    },
  });
};
