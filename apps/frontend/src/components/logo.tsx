import { Link, useNavigate } from "react-router";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./ui/sheet";
import { useThreadsQuery } from "@/services/threads/queries";
import { Thread } from "@/models";
import { useState } from "react";
import { APP_NAME } from "@/constants";

function ThreadItem({
  thread,
  onSelect,
}: {
  thread: Thread;
  onSelect: () => void;
}) {
  return (
    <Link
      to={`/chat/${thread.id}`}
      className="flex items-center bg-white hover:bg-gray-100 rounded-lg transition cursor-pointer w-full p-2"
      onClick={() => {
        onSelect();
      }}
    >
      <div className="flex-1 flex items-center overflow-hidden">
        <p className="text-md font-medium truncate">{thread.title}</p>
      </div>
    </Link>
  );
}
export function Logo() {
  const { data: threads } = useThreadsQuery();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  return (
    <div className="flex items-center cursor-pointer">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger>
          <h1 className="text-lg font-bold hover:bg-gray-50 p-2 rounded-lg transition-colors">
            {APP_NAME}
          </h1>
        </SheetTrigger>
        <SheetContent side="left" className="w-[350px] p-4">
          <SheetHeader>
            <SheetTitle
              onClick={() => {
                navigate("/");
                setOpen(false);
              }}
              className="cursor-pointer"
            >
              {APP_NAME}
            </SheetTitle>
          </SheetHeader>
          <SheetDescription></SheetDescription>
          <div className="flex flex-col gap-1 mt-4">
            {threads?.map((thread) => (
              <ThreadItem
                key={thread.id}
                thread={thread}
                onSelect={() => setOpen(false)}
              />
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
