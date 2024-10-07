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

export function Markdown({ content }: { content: string }) {
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
          // @ts-expect-error react-markdown doesn't support custom components
          thinking: ({ children }) => (
            <div className="">
              <h3 className="text-md font-bold">Thinking</h3>
              <div className="space-y-2">{children}</div>
            </div>
          ),
          // @ts-expect-error react-markdown doesn't support custom components
          step: ({ children }) => (
            <div className="">
              <div className="space-y-2">{children}</div>
            </div>
          ),
          count: () => <></>,
          // @ts-expect-error react-markdown doesn't support custom components
          reflection: ({ children }) => (
            <div className="">
              <h3 className="text-md font-bold">Reflection</h3>
              <div className="space-y-2">{children}</div>
            </div>
          ),
          // @ts-expect-error react-markdown doesn't support custom components
          reward: ({ children }) => (
            <div className="">
              <h3 className="text-md font-bold">Reward</h3>
              <div className="space-y-2">{children}</div>
            </div>
          ),
          // @ts-expect-error react-markdown doesn't support custom components
          answer: ({ children }) => (
            <div className="">
              <h3 className="text-md font-bold">Answer</h3>
              <div className="space-y-2">{children}</div>
            </div>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
