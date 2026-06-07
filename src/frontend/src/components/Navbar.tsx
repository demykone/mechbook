import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "@tanstack/react-router";
import { Bot, Calendar, Home, Shield } from "lucide-react";
import { motion } from "motion/react";
import { useIsAdmin } from "../hooks/useQueries";

export function Navbar() {
  const { data: isAdmin } = useIsAdmin();
  const navigate = useNavigate();

  return (
    <motion.header
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-card/80 backdrop-blur-xl"
    >
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link
          to="/"
          data-ocid="nav.home.link"
          className="flex items-center gap-2.5 group"
        >
          <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center shadow-glow">
            <Bot
              className="w-4 h-4 text-primary-foreground"
              strokeWidth={2.5}
            />
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-display font-black text-lg text-foreground tracking-tight">
              Book<span className="text-primary">Bot</span>
            </span>
            <span className="text-[9px] font-mono text-muted-foreground tracking-[0.2em] uppercase">
              AI Booking
            </span>
          </div>
        </Link>

        {/* Nav center links */}
        <nav className="hidden md:flex items-center gap-1">
          <Link to="/" data-ocid="nav.home.link">
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 text-muted-foreground hover:text-foreground text-xs font-mono uppercase"
            >
              <Home className="w-3.5 h-3.5" />
              Home
            </Button>
          </Link>
          <Link to="/calendar" data-ocid="nav.calendar.link">
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 text-muted-foreground hover:text-foreground text-xs font-mono uppercase"
            >
              <Calendar className="w-3.5 h-3.5" />
              Calendar
            </Button>
          </Link>
          {isAdmin && (
            <Link to="/admin" data-ocid="nav.admin.link">
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 text-primary hover:text-primary hover:bg-primary/10 text-xs font-mono uppercase"
              >
                <Shield className="w-3.5 h-3.5" />
                Admin
              </Button>
            </Link>
          )}
        </nav>

        {/* Mobile nav */}
        <div className="flex md:hidden items-center gap-2">
          <Link to="/" data-ocid="nav.home.mobile.link">
            <Button variant="ghost" size="icon" className="w-9 h-9">
              <Home className="w-4 h-4" />
            </Button>
          </Link>
          <Link to="/calendar" data-ocid="nav.calendar.mobile.link">
            <Button variant="ghost" size="icon" className="w-9 h-9">
              <Calendar className="w-4 h-4" />
            </Button>
          </Link>
          {isAdmin && (
            <Button
              variant="ghost"
              size="icon"
              className="w-9 h-9 text-primary"
              onClick={() => void navigate({ to: "/admin" })}
              data-ocid="nav.admin.mobile.button"
            >
              <Shield className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </motion.header>
  );
}
