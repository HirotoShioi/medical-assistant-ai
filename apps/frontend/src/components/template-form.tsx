import { CardHeader, CardTitle, CardContent, Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Template } from "@/models";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useTranslation } from "react-i18next";
import { Sparkles } from "lucide-react";

export type TemplateFormData = {
  title: string;
  overview: string;
  description: string;
  systemMessage: string;
  initialAssistantMessage: string;
  reportGenerationPrompt?: string;
};

export type TemplateFormProps = {
  template?: Template;
  onSubmit: (data: TemplateFormData) => void;
};
export const TemplateForm = ({ template, onSubmit }: TemplateFormProps) => {
  const { t } = useTranslation();
  const schema = z.object({
    title: z.string().min(1).max(30, {
      message: "タイトルは30文字以内で入力してください。",
    }),
    overview: z.string().min(1).max(50, {
      message: "概要は50文字以内で入力してください。",
    }),
    description: z.string().min(1).max(100, {
      message: "説明は100文字以内で入力してください。",
    }),
    systemMessage: z.string().min(1).max(1600, {
      message: "システムメッセージは1600文字以内で入力してください。",
    }),
    initialAssistantMessage: z.string().min(1).max(1600, {
      message: "初期メッセージは1600文字以内で入力してください。",
    }),
    reportGenerationPrompt: z
      .string()
      .max(600, {
        message:
          "書類作成時に気をつけるべき点は600文字以内で入力してください。",
      })
      .optional(),
  });
  type TemplateFormSchema = z.infer<typeof schema>;
  const form = useForm<TemplateFormSchema>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: template?.title ?? "",
      overview: template?.overview ?? "",
      description: template?.description ?? "",
      systemMessage: template?.systemMessage ?? "",
      initialAssistantMessage: template?.initialAssistantMessage ?? "",
      reportGenerationPrompt: template?.reportGenerationPrompt,
    },
  });

  const isSubmittable = form.formState.isDirty && form.formState.isValid;

  const handleAiSuggest = () => {
    // systemMessage
    // initialAssistantMessageの値を取得
    const title = form.getValues("title");
    const overview = form.getValues("overview");
    const description = form.getValues("description");
    const systemMessage = form.getValues("systemMessage");
    const initialAssistantMessage = form.getValues("initialAssistantMessage");
    console.log(title, overview, description, systemMessage, initialAssistantMessage);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>{t("templateForm.title")}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("templateForm.title")}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={t("templateForm.titlePlaceholder")}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="space-y-2">
              <FormField
                control={form.control}
                name="overview"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("templateForm.overviewLabel")}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={t("templateForm.overviewPlaceholder")}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="space-y-2">
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("templateForm.descriptionLabel")}</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        rows={3}
                        className="resize-none"
                        placeholder={t("templateForm.descriptionPlaceholder")}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="space-y-2">
              <FormField
                control={form.control}
                name="systemMessage"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex justify-between items-center">
                      <FormLabel>
                        {t("templateForm.systemMessageLabel")}
                      </FormLabel>
                    </div>
                    <FormDescription>
                      {t("templateForm.systemMessageDescription")}
                    </FormDescription>
                    <FormControl>
                      <Textarea
                        {...field}
                        rows={20}
                        className="resize-none"
                        placeholder={t("templateForm.systemMessagePlaceholder")}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="space-y-2">
              <FormField
                control={form.control}
                name="initialAssistantMessage"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex justify-between items-center">
                      <FormLabel>
                        {t("templateForm.initialAssistantMessageLabel")}
                      </FormLabel>
                    </div>
                    <FormDescription>
                      {t("templateForm.initialAssistantMessageDescription")}
                    </FormDescription>
                    <FormControl>
                      <Textarea
                        {...field}
                        rows={15}
                        className="resize-none"
                        placeholder={t(
                          "templateForm.initialAssistantMessagePlaceholder"
                        )}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            {template?.type === "report" && (
              <div className="space-y-2">
                <FormField
                  control={form.control}
                  name="reportGenerationPrompt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t("templateForm.reportGenerationPromptLabel")}
                      </FormLabel>
                      <FormDescription>
                        {t("templateForm.reportGenerationPromptDescription")}
                      </FormDescription>
                      <FormControl>
                        <Textarea
                          {...field}
                          rows={15}
                          className="resize-none"
                          placeholder={t(
                            "templateForm.reportGenerationPromptPlaceholder"
                          )}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
            <div className="flex justify-end">
              <div className="flex items-center gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={handleAiSuggest}
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      AI
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      {t(
                        "templateForm.aiSuggestSystemMessageTooltip",
                        "AIにシステムメッセージの提案を依頼する"
                      )}
                    </p>
                  </TooltipContent>
                </Tooltip>
                <Button type="submit" disabled={!isSubmittable}>
                  {t("templateForm.saveButton")}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
