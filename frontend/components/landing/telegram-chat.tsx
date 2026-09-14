import { Send } from "lucide-react";
import { cn } from "@/lib/utils";

export function PhoneFrame({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-[2.25rem] border-[8px] border-chat-shell bg-chat-shell p-2 shadow-[0_24px_60px_-20px_rgba(8,23,58,0.55)]",
        className
      )}
    >
      <div className="rounded-[1.6rem] bg-chat p-3">{children}</div>
    </div>
  );
}

export function ChatHeader({ subtitle }: { subtitle?: string }) {
  return (
    <div className="flex items-center gap-2 border-b border-white/10 pb-3">
      <Send className="size-4 text-sky-300" aria-hidden />
      <span className="text-xs font-semibold text-white">Telegram · RYVV</span>
      {subtitle ? (
        <span className="ml-auto text-[10px] text-white/50">{subtitle}</span>
      ) : null}
    </div>
  );
}

type BubbleProps = {
  from: "user" | "bot";
  children: React.ReactNode;
  className?: string;
} & React.HTMLAttributes<HTMLDivElement>;

export function Bubble({ from, children, className, ...rest }: BubbleProps) {
  const isUser = from === "user";
  return (
    <div
      className={cn(
        "w-fit max-w-[88%] rounded-2xl px-3 py-2 text-[11px] leading-[1.45] transition-colors sm:text-xs",
        isUser
          ? "ml-auto rounded-br-md bg-chat-out text-chat-out-foreground"
          : "rounded-bl-md bg-chat-in text-chat-in-foreground",
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

export function ChatThread({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-2.5 py-4", className)}>
      {children}
    </div>
  );
}

/** Money figures inside bot replies stay emphasized for scanability. */
export function Amount({ children }: { children: React.ReactNode }) {
  return <span className="font-bold tabular-nums">{children}</span>;
}
