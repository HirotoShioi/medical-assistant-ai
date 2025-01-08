import Header from "@/components/header";
import {
  TemplateForm,
  TemplateFormData,
} from "@/components/template-form";
import { useNavigate, useParams } from "react-router";
import { useTemplateQueryById } from "@/services/templates/queries";
import { FullPageLoader } from "@/components/fulll-page-loader";
import NotFoundPage from "../not-found-page";
import { useUpdateTemplateMutation } from "@/services/templates/mutations";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";

export default function EditTemplatePage() {
  const { templateId } = useParams();
  const navigate = useNavigate();
  const { data: template, isLoading } = useTemplateQueryById(templateId);
  const { mutate: updateTemplate } = useUpdateTemplateMutation();
  const { toast } = useToast();

  useEffect(() => {
    if (!templateId) {
      navigate("/not-found");
    }
  }, [templateId, navigate]);

  if (isLoading) {
    return <FullPageLoader />;
  }
  if (!template) {
    return <NotFoundPage />;
  }
  async function handleSubmit(params: TemplateFormData) {
    if (!template) {
      return;
    }
    updateTemplate(
      {
        id: template.id,
        ...params,
      },
      {
        onSuccess: () => {
          toast({
            title: "テンプレート更新",
            variant: "info",
            description: "テンプレートを更新しました。",
          });
        },
        onError: (error) => {
          toast({
            title: "テンプレート更新失敗",
            variant: "destructive",
            description: error.message,
          });
        },
      }
    );
  }
  return (
    <>
      <Header />
      <div className="p-4">
        <TemplateForm template={template} onSubmit={handleSubmit} />
      </div>
    </>
  );
}
