import { pageWrapperStyles } from "@/styles/common";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useRouteError } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import Header from "@/components/header";
import { AlertTitle, AlertDescription, Alert } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { useResetDatabase } from "@/hooks/use-reset-database";

export default function ErrorPage() {
  const error = useRouteError() as Error;
  const { t } = useTranslation();
  const { reset } = useResetDatabase();
  if (error) {
    console.error(error);
  }

  return (
    <div id="error-page">
      <Header />
      <div className={cn(pageWrapperStyles, "space-y-4")}>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {t("error.unexpectedError")}
            <br />
            {t("error.databaseReset")}
          </AlertDescription>
        </Alert>
        <div className="grid gap-4 md:grid-cols-2 w-full">
          <Button asChild>
            <Link to="/">{t("error.goHome")}</Link>
          </Button>
          <Button variant="destructive" onClick={reset}>
            {t("error.resetDatabase")}
          </Button>
        </div>
      </div>
    </div>
  );
}
