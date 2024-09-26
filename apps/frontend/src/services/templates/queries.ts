import { useQuery } from "@tanstack/react-query";
import { getTemplateById, getTemplates } from "./service";

export const useTemplatesQuery = () => {
  return useQuery({
    queryKey: ["templates"],
    queryFn: () => getTemplates(),
  });
};

export const useTemplateQueryById = (id?: string) => {
  return useQuery({
    queryKey: ["template", { id }],
    queryFn: () => getTemplateById(id!),
    enabled: !!id,
  });
};
