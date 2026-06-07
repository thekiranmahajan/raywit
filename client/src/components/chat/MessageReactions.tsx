import React, { useMemo, useState } from "react";
import { Smile } from "lucide-react";

interface MessageReactionsProps {
  reactions: string[];
  onReact: (emoji: string) => void;
}

const POPULAR_REACTIONS = ["❤️", "😂", "👍", "😮", "😢", "🔥"];

export const MessageReactions: React.FC<MessageReactionsProps> = ({
  reactions,
  onReact,
}) => {
  const [showPicker, setShowPicker] = useState(false);

  const reactionCounts = useMemo(() => {
    const counts = new Map<string, number>();
    reactions.forEach((emoji) => {
      counts.set(emoji, (counts.get(emoji) || 0) + 1);
    });
    return Array.from(counts.entries());
  }, [reactions]);

  return (
    <div className="mt-2 flex flex-col gap-1">
      {reactionCounts.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {reactionCounts.map(([emoji, count]) => (
            <button
              key={emoji}
              type="button"
              onClick={() => onReact(emoji)}
              className="flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-1 text-[11px] text-zinc-700 transition hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
            >
              <span>{emoji}</span>
              <span>{count}</span>
            </button>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2 text-[11px]">
        <button
          type="button"
          onClick={() => setShowPicker((prev) => !prev)}
          className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-1 text-zinc-700 transition hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
          aria-label="Add reaction"
        >
          <Smile className="h-3.5 w-3.5" />
          React
        </button>

        {showPicker && (
          <div className="flex flex-wrap gap-1 rounded-full bg-white p-1 shadow-sm dark:bg-zinc-900">
            {POPULAR_REACTIONS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => {
                  onReact(emoji);
                  setShowPicker(false);
                }}
                className="rounded-full px-2 py-1 text-sm transition hover:bg-zinc-100 dark:hover:bg-zinc-700"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
