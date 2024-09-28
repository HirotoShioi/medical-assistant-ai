import {
  Tooltip as TooltipUI,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export type TooltipProps = {
  children: React.ReactNode;
  content: React.ReactNode;
};

export function Tooltip({ children, content }: TooltipProps) {
  return (
    <TooltipUI>
      <TooltipTrigger asChild>
        <div>{children}</div>
      </TooltipTrigger>
      <TooltipContent>{content}</TooltipContent>
    </TooltipUI>
  );
}
