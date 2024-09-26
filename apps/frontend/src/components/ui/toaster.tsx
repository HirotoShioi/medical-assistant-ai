import { useToast } from "@/hooks/use-toast";
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast";
import { AlertTriangle, CircleCheck, Info, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        // Determine the icon to show based on variant
        let IconComponent;
        switch (props.variant) {
          case "success":
            IconComponent = CircleCheck;
            break;
          case "destructive":
            IconComponent = XCircle;
            break;
          case "warning":
            IconComponent = AlertTriangle;
            break;
          case "info":
          default:
            IconComponent = Info;
            break;
        }

        const iconColor = (() => {
          switch (props.variant) {
            case "success":
              return "text-green-500";
            case "destructive":
              return "text-red-500";
            case "warning":
              return "text-yellow-500";
            case "info":
              return "text-blue-500";
            default:
              return "text-current";
          }
        })();

        return (
          <Toast key={id} {...props}>
            <div className="flex items-center gap-4">
              <IconComponent className={cn("w-6 h-6", iconColor)} />
              <div className="flex flex-col">
                {title && <ToastTitle>{title}</ToastTitle>}
                {description && (
                  <ToastDescription>{description}</ToastDescription>
                )}
              </div>
            </div>
            {action}
            <ToastClose />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}
