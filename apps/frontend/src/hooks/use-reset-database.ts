import { useAlert } from "@/components/alert";
import { DB_NAME } from "@/constants";
import { useTranslation } from "react-i18next";

export function useResetDatabase() {
  const { t } = useTranslation();
  const { openAlert } = useAlert();
  function reset() {
    async function handleDeleteDatabase() {
      indexedDB.deleteDatabase(`/pglite/${DB_NAME}`);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      openAlert({
        title: t("settings.databaseDeleted"),
        description: t("settings.databaseDeletedDescription"),
        actions: [
          {
            label: t("settings.ok"),
            variant: "destructive",
            onClick: () => window.location.reload(),
          },
        ],
      });
    }
    openAlert({
      title: t("settings.deleteDatabase"),
      description: t("settings.deleteConfirmation"),
      actions: [
        {
          label: t("settings.cancel"),
          variant: "cancel",
          onClick: () => {},
        },
        {
          label: t("settings.delete"),
          variant: "destructive",
          onClick: handleDeleteDatabase,
        },
      ],
    });
  }
  return { reset };
}
