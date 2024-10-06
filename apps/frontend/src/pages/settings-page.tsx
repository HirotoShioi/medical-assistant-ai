import Header from "@/components/header";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { pageWrapperStyles } from "@/styles/common";
import { useAlert } from "@/components/alert";
import { useTranslation } from "react-i18next";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { useDeleteThreadMutation } from "@/services/threads/mutations";
import { useUpdateUserPreferencesMutation } from "@/services/user/mutations";
import { useUserPreferencesQuery } from "@/services/user/queries";
import { useResetDatabase } from "@/hooks/use-reset-database";
import { FullPageLoader } from "@/components/fulll-page-loader";
export default function SettingsPage() {
  const { t, i18n } = useTranslation();
  const { openAlert } = useAlert();
  const { reset } = useResetDatabase();
  const userPreferences = useUserPreferencesQuery();
  const { mutateAsync } = useUpdateUserPreferencesMutation();
  const { mutateAsync: deleteThread } = useDeleteThreadMutation();
  if (userPreferences.isLoading || !userPreferences.data) {
    return <FullPageLoader label={t("settings.loading")} />;
  }
  const models = [
    {
      name: "GPT-4o-mini",
      value: "gpt-4o-mini",
      description: t("settings.gpt4oMiniDescription"),
    },
    {
      name: "GPT-4o",
      value: "gpt-4o",
      description: t("settings.gpt4oDescription"),
    },
  ];

  async function handleDeleteThreads() {
    await deleteThread();
    openAlert({
      title: t("settings.threadsDeleted"),
      description: t("settings.threadsDeletedDescription"),
      actions: [
        {
          label: t("settings.ok"),
          variant: "destructive",
        },
      ],
    });
  }

  function showDeleteThreadsAlert() {
    openAlert({
      title: t("settings.deleteThreads"),
      description: t("settings.deleteThreadsConfirmation"),
      actions: [
        {
          label: t("settings.cancel"),
          variant: "cancel",
          onClick: () => {},
        },
        {
          label: t("settings.delete"),
          variant: "destructive",
          onClick: handleDeleteThreads,
        },
      ],
    });
  }
  return (
    <>
      <Header />
      <div className={cn(pageWrapperStyles)}>
        <div className="space-y-4">
          <h1 className="text-2xl font-bold bg-white">{t("settings.title")}</h1>
          <div className="border rounded-lg p-4 space-y-4 bg-white">
            <div className="flex justify-between items-center">
              <Label htmlFor="delete-database" className="text-lg font-medium">
                {t("settings.language")}
              </Label>
              <div className="flex items-center">
                <Select
                  defaultValue={i18n.language}
                  onValueChange={(value) => i18n.changeLanguage(value)}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ja">日本語</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <Label htmlFor="delete-database" className="text-lg font-medium">
                {t("settings.llmModel")}
              </Label>
              <div className="flex items-center">
                <Select
                  defaultValue={userPreferences.data.llmModel ?? "gpt-4o-mini"}
                  onValueChange={(value) => mutateAsync({ llmModel: value })}
                >
                  <SelectTrigger>
                    {
                      models.find(
                        (model) => model.value === userPreferences.data.llmModel
                      )?.name
                    }
                  </SelectTrigger>
                  <SelectContent>
                    {models.map((model) => (
                      <SelectItem key={model.value} value={model.value}>
                        <div className="flex flex-col gap-1">
                          <h3 className="font-medium">{model.name}</h3>
                          <p className="text-sm text-gray-500">
                            {model.description}
                          </p>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <Label htmlFor="delete-database" className="text-lg font-medium">
                {t("settings.deleteThreads")}
              </Label>
              <div className="flex items-center">
                <Button variant="destructive" onClick={showDeleteThreadsAlert}>
                  {t("settings.delete")}
                </Button>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <Label htmlFor="delete-database" className="text-lg font-medium">
                {t("settings.deleteDatabase")}
              </Label>
              <div className="flex items-center">
                <Button variant="destructive" onClick={reset}>
                  {t("settings.delete")}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
