import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateUserPreferences } from "./service";

export const useUpdateUserPreferencesMutation = () => {
  const client = useQueryClient();
  return useMutation({
    mutationKey: ["updateUserPreferences"],
    mutationFn: ({ llmModel }: { llmModel: string }) =>
      updateUserPreferences({ llmModel }),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["userPreferences"] });
    },
  });
};
