import Header from "@/components/header";
import {
  TemplateForm,
  TemplateFormData,
} from "@/components/template-form";
import { useNavigate } from "react-router";
import { useCreateTemplateMutation } from "@/services/templates/mutations";
import { useToast } from "@/hooks/use-toast";

export default function NewTemplatePage() {
  const navigate = useNavigate();
  const { mutate: createTemplate } = useCreateTemplateMutation();
  const { toast } = useToast();

  async function handleSubmit(params: TemplateFormData) {
    createTemplate(
      {
        ...params,
        type: "chat",
        icon: "message-square",
      },
      {
        onSuccess: () => {
          toast({
            title: "テンプレート作成",
            variant: "info",
            description: "テンプレートを作成しました。",
          });
          navigate("/");
        },
        onError: (error) => {
          toast({
            title: "テンプレート作成失敗",
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
        <TemplateForm onSubmit={handleSubmit} />
      </div>
    </>
  );
}
