import { categories } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export function CategoryChips({
  active,
  onChange,
}: {
  active: string;
  onChange: (c: string) => void;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none -mx-4 px-4 md:mx-0 md:px-0">
      {categories.map((c) => (
        <button
          key={c}
          onClick={() => onChange(c)}
          className={cn(
            "shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-smooth border",
            active === c
              ? "bg-gradient-primary text-white border-transparent glow-primary"
              : "glass border-glass-border text-foreground/80 hover:text-foreground hover:border-primary/40"
          )}
        >
          {c}
        </button>
      ))}
    </div>
  );
}
