import { useToast } from "@/hooks/use-toast";
import { Hub } from "aws-amplify/utils";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Outlet, useNavigate } from "react-router";

export default function Root() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();
  useEffect(() => {
    Hub.listen("auth", (data) => {
      if (data.payload.event === "signedOut") {
        toast({
          title: t("auth.signedOut"),
          description: t("auth.signedOutDescription"),
        });
        navigate("/");
      }
      if (data.payload.event === "signedIn") {
        toast({
          title: t("auth.signedIn"),
          description: t("auth.signedInDescription"),
        });
        navigate("/");
      }
    });
  }, [navigate, toast, t]);
  return (
    <div className=" min-h-screen">
      <Outlet />
    </div>
  );
}
