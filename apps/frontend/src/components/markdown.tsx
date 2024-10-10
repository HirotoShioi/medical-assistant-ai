import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "./ui/table";
import { useAlert } from "./alert";
import { useTranslation } from "react-i18next";

export function Markdown({ content }: { content: string }) {
  const { openAlert } = useAlert();
  const { t } = useTranslation();
  const handleClick = (href: string) => {
    console.log("handleClick", href);
    openAlert({
      title: t("markdown.openInNewTab"),
      description: t("markdown.openInNewTabDescription"),
      actions: [
        {
          label: t("markdown.cancel"),
          variant: "cancel",
        },
        {
          label: t("markdown.openInNewTab"),
          onClick: () => {
            window.open(href, "_blank");
          },
        },
      ],
    });
  };
  return (
    <div className="space-y-4">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          table: ({ children }) => (
            <div className="overflow-x-auto w-full border-collapse border rounded-lg border-slate-400">
              <Table>{children}</Table>
            </div>
          ),
          thead: ({ children }) => <TableHeader>{children}</TableHeader>,
          tbody: ({ children }) => <TableBody>{children}</TableBody>,
          tr: ({ children }) => <TableRow>{children}</TableRow>,
          th: ({ children }) => <TableHead>{children}</TableHead>,
          td: ({ children }) => <TableCell>{children}</TableCell>,
          a: ({ children, href }) => (
            <a
              className="text-blue-500 underline cursor-pointer"
              onClick={() => handleClick(href ?? "")}
            >
              {children}
            </a>
          ),
          p: ({ children }) => <div>{children}</div>,
          ul: ({ children }) => (
            <ul className="list-disc space-y-3 pl-4">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal space-y-3 pl-4">{children}</ol>
          ),
          li: ({ children }) => <li className="list-item">{children}</li>,
          blockquote: ({ children }) => (
            <blockquote className="bg-slate-200 p-4 rounded-md">
              {children}
            </blockquote>
          ),
          h3: ({ children }) => (
            <h3 className="text-lg font-bold">{children}</h3>
          ),
          h2: ({ children }) => (
            <h2 className="text-xl font-bold">{children}</h2>
          ),
          h1: ({ children }) => (
            <h1 className="text-2xl font-bold">{children}</h1>
          ),
          code: ({ children }) => (
            <code className="bg-slate-200 p-1 rounded-md">{children}</code>
          ),
          pre: ({ children }) => (
            <pre className="bg-slate-200 p-4 rounded-md">{children}</pre>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
