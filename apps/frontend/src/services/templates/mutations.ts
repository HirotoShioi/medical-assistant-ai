import { useQueryClient, useMutation } from "@tanstack/react-query";
import { resetTemplate, UpdateTemplateParams } from "./service";
import { updateTemplate } from "./service";

export const useUpdateTemplateMutation = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (params: UpdateTemplateParams) => updateTemplate(params),
    onSuccess: (_, variables) => {
      client.invalidateQueries({ queryKey: ["templates"] });
      client.invalidateQueries({
        queryKey: ["template", { id: variables.id }],
      });
    },
  });
};

export const useResetTemplateMutation = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (templateId: string) => resetTemplate(templateId),
    onSuccess: (t) => {
      client.invalidateQueries({ queryKey: ["templates"] });
      client.invalidateQueries({
        queryKey: ["template", { id: t.id }],
      });
    },
  });
};
