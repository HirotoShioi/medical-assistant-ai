import { FullPageLoader } from "@/components/fulll-page-loader";
import Header from "@/components/header";
import { TemplateCard } from "@/pages/index/template-card";
import { useTemplatesQuery } from "@/services/templates/queries";
import { useTranslation } from "react-i18next";

export default function IndexPage() {
  const { t } = useTranslation();
  const { data: templates, isLoading } = useTemplatesQuery();
  if (isLoading) {
    return <FullPageLoader label={t("index.loadingTemplates")} />;
  }
  return (
    <div className="">
      <Header />
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold text-center mb-8">
          {t("index.title")}
        </h1>
        <p className="mb-12 text-gray-600 max-w-2xl mx-auto">
          {t("index.description")}
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {(templates ?? []).map((template, index) => (
            <TemplateCard key={template.id} template={template} index={index} />
          ))}
        </div>
      </div>
    </div>
  );
}
