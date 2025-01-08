import { useQueryClient, useMutation } from "@tanstack/react-query";
import { resetTemplate, UpdateTemplateParams, createTemplate } from "./service";
import { updateTemplate } from "./service";
import { NewTemplateParams } from "@/models/template";

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

export const useCreateTemplateMutation = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (params: NewTemplateParams) => createTemplate(params),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["templates"] });
    },
  });
};
