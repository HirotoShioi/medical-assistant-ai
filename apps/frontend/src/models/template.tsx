import { schema } from "@/lib/database/schema";
import {
  Activity,
  Stethoscope,
  Users,
  FileText,
  Home,
  HeartPulse,
  MessageSquare,
} from "lucide-react";
import { z } from "zod";

const iconMap = {
  "message-square": <MessageSquare className="w-6 h-6  text-blue-500" />,
  activity: <Activity className="w-6 h-6  text-blue-500" />,
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
  icon: string;
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

type ChatTemplate = BaseTemplate & {
  type: "chat";
};

type Template = ReportTemplate | SummaryTemplate | ChatTemplate;

type DatabaseTemplate = typeof schema.templates.$inferSelect;

const templateSchema = z.object({
  type: z.enum(["report", "summary", "chat"]),
  title: z.string(),
  overview: z.string(),
  description: z.string(),
  systemMessage: z.string(),
  initialAssistantMessage: z.string(),
  icon: z.string(),
  reportGenerationPrompt: z.string().optional(),
});

function toTemplate(data: DatabaseTemplate): Template {
  const parsed = templateSchema.safeParse(
    JSON.parse(data.originalTemplate as string)
  );
  switch (data.type) {
    case "report":
      return {
        ...data,
        icon: data.icon,
        type: "report" as const,
        reportGenerationPrompt: data.reportGenerationPrompt ?? "",
        originalTemplate: parsed.success ? parsed.data : undefined,
      };
    case "summary":
      return {
        ...data,
        icon: data.icon,
        type: "summary" as const,
        reportGenerationPrompt: data.reportGenerationPrompt ?? "",
        originalTemplate: parsed.success ? parsed.data : undefined,
      };
    case "chat":
      return {
        ...data,
        icon: data.icon,
        type: "chat" as const,
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

type NewChatTemplateParams = BaseNewTemplateParams & {
  type: "chat";
};

type NewReportTemplateParams = BaseNewTemplateParams & {
  type: "report";
};

type NewSummaryTemplateParams = BaseNewTemplateParams & {
  type: "summary";
};

type NewTemplateParams =
  | NewChatTemplateParams
  | NewReportTemplateParams
  | NewSummaryTemplateParams;

export { toTemplate, iconMap };
export type {
  ReportTemplate,
  SummaryTemplate,
  ChatTemplate,
  Template,
  NewTemplateParams,
};
