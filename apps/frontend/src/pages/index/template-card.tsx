import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronRight, MoreVertical, Edit, RotateCcw } from "lucide-react";
import { iconMap, Template } from "@/models/template";
import { useState } from "react";
import { useCreateThreadMutation } from "@/services/threads/mutations";
import { useNavigate } from "react-router";
import { newThreadId } from "@/services/threads/service";
import { formatDate } from "date-fns";
import { useTranslation } from "react-i18next";
import { useResetTemplateMutation } from "@/services/templates/mutations";
import { useToast } from "@/hooks/use-toast";
import { useAlert } from "@/components/alert";
import { useAuthenticator } from "@aws-amplify/ui-react";

type TemplateCardProps = {
  template: Template;
  index: number;
};

export const TemplateCard = ({ template }: TemplateCardProps) => {
  const { t } = useTranslation();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { mutateAsync: createChat } = useCreateThreadMutation();
  const { mutate: resetTemplate } = useResetTemplateMutation();
  const { user } = useAuthenticator((context) => [context.user]);
  const { openAlert } = useAlert();
  const { toast } = useToast();
  const navigate = useNavigate();
  const newId = newThreadId();
  const handleStartChat = async () => {
    setIsDialogOpen(false);
    if (!user) {
      openAlert({
        title: t("templateCard.signInRequired"),
        description: t("templateCard.signInDescription"),
        actions: [
          {
            label: t("templateCard.signIn"),
            variant: "action",
            onClick: () => navigate("/sign-in"),
          },
        ],
      });
      return;
    }
    await createChat({
      threadId: newId,
      title: `${template.title} - ${formatDate(new Date(), "yyyy-MM-dd HH:mm")}`,
      settings: {
        threadId: newId,
        systemMessage: template.systemMessage,
        initialAssistantMessage: template.initialAssistantMessage,
        templateTitle: template.title,
        templateOverview: template.overview,
        templateType: template.type,
        reportGenerationPrompt: template.reportGenerationPrompt,
        templateId: template.id,
      },
    });
    navigate(`/chat/${newId}`);
  };

  const handleEdit = () => {
    navigate(`/edit-template/${template.id}`);
  };

  const handleReset = () => {
    openAlert({
      title: t("templateCard.resetConfirmation"),
      description: t("templateCard.resetDescription"),
      actions: [
        {
          label: t("templateCard.cancel"),
          variant: "cancel",
          onClick: () => {},
        },
        {
          label: t("templateCard.reset"),
          variant: "destructive",
          onClick: reset,
        },
      ],
    });
  };

  const reset = async () => {
    resetTemplate(template.id, {
      onSuccess: () => {
        toast({
          variant: "info",
          description: t("templateCard.resetSuccess"),
        });
      },
      onError: (e) => {
        toast({
          title: t("templateCard.resetError"),
          description: e.message,
          variant: "destructive",
        });
      },
    });
  };

  return (
    <Card className="h-full flex flex-col hover:shadow-lg transition-shadow duration-300 border-2 border-gray-200 relative">
      <div className="absolute top-2 right-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleEdit}>
              <Edit className="mr-2 h-4 w-4" />
              <span>{t("templateCard.edit")}</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleReset}>
              <RotateCcw className="mr-2 h-4 w-4" />
              <span>{t("templateCard.reset")}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <CardHeader>
        <div className="flex items-center space-x-4">
          {iconMap[template.icon as keyof typeof iconMap]}
          <CardTitle className="text-xl font-semibold text-gray-800">
            {template.title}
          </CardTitle>
        </div>
        <CardDescription className="mt-2 text-gray-600">
          {template.overview}
        </CardDescription>
      </CardHeader>
      <CardFooter className="mt-auto flex justify-end items-center">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2 text-2xl">
              {iconMap[template.icon as keyof typeof iconMap]}
                <span>{template.title}</span>
              </DialogTitle>
              <DialogDescription className="text-gray-700 mt-4">
                {template.description}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button onClick={handleStartChat} className="w-full mt-4">
                {t("templateCard.startChat")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <Button
          onClick={() => setIsDialogOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white flex items-center"
        >
          {t("templateCard.select")} <ChevronRight className="ml-2 w-4 h-4" />
        </Button>
      </CardFooter>
    </Card>
  );
};
