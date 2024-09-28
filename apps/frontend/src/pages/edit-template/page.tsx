import Header from "@/components/header";
import { TemplateForm, TemplateFormData } from "./template-form";
import { useNavigate, useParams } from "react-router-dom";
import { useTemplateQueryById } from "@/services/templates/queries";
import { FullPageLoader } from "@/components/fulll-page-loader";
import NotFoundPage from "../not-found-page";
import { useUpdateTemplateMutation } from "@/services/templates/mutations";
import { useToast } from "@/hooks/use-toast";

export default function EditTemplatePage() {
  const { templateId } = useParams();
  const navigate = useNavigate();
  const { data: template, isLoading } = useTemplateQueryById(templateId);
  const { mutateAsync: updateTemplate } = useUpdateTemplateMutation();
  const { toast } = useToast();
  if (!templateId) {
    navigate("/not-found");
  }
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
    await updateTemplate({
      id: template.id,
      ...params,
    });
    toast({
      title: "テンプレート更新",
      variant: "success",
      description: "テンプレートを更新しました。",
    });
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
