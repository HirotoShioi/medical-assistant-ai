import { FullPageLoader } from "@/components/fulll-page-loader";
import Header from "@/components/header";
import { TemplateCard } from "@/pages/index/template-card";
import { useTemplatesQuery } from "@/services/templates/queries";
import { useTranslation } from "react-i18next";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router";

export default function IndexPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: templates, isLoading } = useTemplatesQuery();

  if (isLoading) {
    return <FullPageLoader label={t("index.loadingTemplates")} />;
  }

  return (
    <div className="">
      <Header />
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <h1 className="text-4xl font-bold mb-6">
            {t("index.title")}
          </h1>
          <p className="text-gray-600 mb-8">
            {t("index.description")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {(templates ?? []).map((template, index) => (
            <TemplateCard key={template.id} template={template} index={index} />
          ))}
          <button
            onClick={() => navigate("/edit-template/new")}
            className="group flex flex-col items-center justify-center p-6 rounded-lg border-2 border-dashed border-gray-300 bg-white hover:border-gray-400 hover:bg-gray-50 transition-all duration-200"
          >
            <div className="rounded-full bg-gray-100 p-3 group-hover:bg-gray-200 transition-colors">
              <Plus className="w-6 h-6 text-gray-600" />
            </div>
            <span className="mt-4 text-sm font-medium text-gray-600">
              {t("templates.new")}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
