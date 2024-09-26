import { schema } from "@/lib/database/schema";
import { ReactNode } from "react";
import {
  Activity,
  Stethoscope,
  Users,
  FileText,
  Home,
  HeartPulse,
} from "lucide-react";
import { z } from "zod";

const iconMap = {
  actvity: <Activity className="w-6 h-6  text-blue-500" />,
  stethoscope: <Stethoscope className="w-6 h-6 text-red-500" />,
  users: <Users className="w-6 h-6 text-yellow-500" />,
  "file-text": <FileText className="w-6 h-6 text-purple-500" />,
  home: <Home className="w-6 h-6 text-green-500" />,
  "heart-pulse": <HeartPulse className="w-6 h-6 text-indigo-500" />,
};

type BaseTemplate = {
  id: string;
  title: string;
  overview: string;
  description: string;
  icon: ReactNode;
  systemMessage: string;
  initialAssistantMessage: string;
  reportGenerationPrompt?: string;
  originalTemplate?: NewTemplateParams;
};

type ReportTemplate = BaseTemplate & {
  type: "report";
};

type SummaryTemplate = BaseTemplate & {
  type: "summary";
};

type ConsultationTemplate = BaseTemplate & {
  type: "consultation";
};

type Template = ReportTemplate | SummaryTemplate | ConsultationTemplate;

type DatabaseTemplate = typeof schema.templates.$inferSelect;

function toTemplate(data: DatabaseTemplate): Template {
  const parsed = z
    .object({
      type: z.enum(["report", "summary", "consultation"]),
      title: z.string(),
      overview: z.string(),
      description: z.string(),
      systemMessage: z.string(),
      initialAssistantMessage: z.string(),
      icon: z.string(),
      reportGenerationPrompt: z.string().optional(),
    })
    .safeParse(data.originalTemplate);
  switch (data.type) {
    case "report":
      return {
        ...data,
        icon: iconMap[data.icon as keyof typeof iconMap],
        type: "report" as const,
        reportGenerationPrompt: data.reportGenerationPrompt ?? "",
        originalTemplate: parsed.success ? parsed.data : undefined,
      };
    case "summary":
      return {
        ...data,
        icon: iconMap[data.icon as keyof typeof iconMap],
        type: "summary" as const,
        reportGenerationPrompt: data.reportGenerationPrompt ?? "",
        originalTemplate: parsed.success ? parsed.data : undefined,
      };
    case "consultation":
      return {
        ...data,
        icon: iconMap[data.icon as keyof typeof iconMap],
        type: "consultation" as const,
        reportGenerationPrompt: data.reportGenerationPrompt ?? "",
        originalTemplate: parsed.success ? parsed.data : undefined,
      };
  }
}

type BaseNewTemplateParams = {
  title: string;
  overview: string;
  description: string;
  systemMessage: string;
  initialAssistantMessage: string;
  icon: string;
  reportGenerationPrompt?: string;
};

type NewConsultationTemplateParams = BaseNewTemplateParams & {
  type: "consultation";
};

type NewReportTemplateParams = BaseNewTemplateParams & {
  type: "report";
};

type NewSummaryTemplateParams = BaseNewTemplateParams & {
  type: "summary";
};

type NewTemplateParams =
  | NewConsultationTemplateParams
  | NewReportTemplateParams
  | NewSummaryTemplateParams;

export { toTemplate };
export type {
  ReportTemplate,
  SummaryTemplate,
  ConsultationTemplate,
  Template,
  NewTemplateParams,
};