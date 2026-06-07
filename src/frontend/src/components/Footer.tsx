import { Bot } from "lucide-react";

export function Footer() {
  const year = new Date().getFullYear();
  const utm = `utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`;

  return (
    <footer className="border-t border-border bg-card/80 mt-auto py-6">
      <div className="container mx-auto px-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
              <Bot
                className="w-3 h-3 text-primary-foreground"
                strokeWidth={2.5}
              />
            </div>
            <span className="font-display font-bold text-sm text-foreground">
              Book<span className="text-primary">Bot</span>
            </span>
          </div>
          <p className="text-sm text-muted-foreground text-center">
            &copy; {year}. Built with love using{" "}
            <a
              href={`https://caffeine.ai?${utm}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              caffeine.ai
            </a>
          </p>
          <div className="text-xs text-muted-foreground font-mono uppercase tracking-widest">
            AI Booking System
          </div>
        </div>
      </div>
    </footer>
  );
}
