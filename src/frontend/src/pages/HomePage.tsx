import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@tanstack/react-router";
import {
  Bot,
  Calendar,
  CheckCircle,
  Clock,
  Send,
  Sparkles,
  Zap,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useAvailableSlots, useCreateBooking } from "../hooks/useQueries";
import type { ChatMessage } from "../types";
import { SLOT_TIMES } from "../types";

// ── AI Chat helpers ──────────────────────────────────────────────────────────

// Detects a YYYY-MM-DD date from a free-text message, or returns null
function parseDateFromMsg(msg: string): string | null {
  // ISO date
  const iso = msg.match(/(\d{4}-\d{2}-\d{2})/);
  if (iso) return iso[1];
  // "tomorrow"
  if (/tomorrow/i.test(msg)) {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  }
  // "today"
  if (/today/i.test(msg)) {
    return new Date().toISOString().split("T")[0];
  }
  // Written day names (Monday … Sunday) → next upcoming
  const days = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];
  for (let i = 0; i < days.length; i++) {
    if (msg.toLowerCase().includes(days[i])) {
      const now = new Date();
      const diff = (i - now.getDay() + 7) % 7 || 7;
      now.setDate(now.getDate() + diff);
      return now.toISOString().split("T")[0];
    }
  }
  return null;
}

const BOOKING_KEYWORDS = [
  "book",
  "reserve",
  "schedule",
  "appointment",
  "slot",
  "session",
  "want",
  "need",
  "get",
  "make",
];
function hasBookingIntent(msg: string): boolean {
  const lower = msg.toLowerCase();
  return BOOKING_KEYWORDS.some((kw) => lower.includes(kw));
}

// ── Quick Book Widget ─────────────────────────────────────────────────────────
function QuickBook() {
  const today = new Date().toISOString().split("T")[0];
  const [date, setDate] = useState(today);
  const { data: slots = [], isLoading } = useAvailableSlots(date);
  const { mutateAsync: createBooking, isPending } = useCreateBooking();

  const handleBook = async (slotIndex: number) => {
    try {
      await createBooking({ date, slotIndex });
      toast.success(`Booked ${SLOT_TIMES[slotIndex].label} on ${date}!`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Booking failed");
    }
  };

  const availableSet = new Set(slots.map((s) => Number(s)));

  return (
    <div className="space-y-4">
      <div>
        <label
          htmlFor="home-date-input"
          className="text-xs text-muted-foreground font-mono uppercase tracking-wider block mb-1.5"
        >
          Select Date
        </label>
        <input
          id="home-date-input"
          type="date"
          value={date}
          min={today}
          onChange={(e) => setDate(e.target.value)}
          data-ocid="home.date_input"
          className="w-full h-9 rounded-lg border border-border bg-input px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      <div>
        <p className="text-xs text-muted-foreground font-mono uppercase tracking-wider block mb-1.5">
          Available Slots
        </p>
        {isLoading ? (
          <div className="grid grid-cols-2 gap-2">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-10 rounded-lg bg-muted" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(SLOT_TIMES).map(([idx, slot]) => {
              const slotNum = Number(idx);
              const available = availableSet.has(slotNum);
              return (
                <button
                  key={idx}
                  type="button"
                  disabled={!available || isPending}
                  onClick={() => void handleBook(slotNum)}
                  data-ocid={`home.slot.${slotNum + 1}`}
                  className={`h-10 rounded-lg border text-sm font-medium transition-all ${
                    available
                      ? "border-primary/40 text-primary bg-primary/5 hover:bg-primary/15 hover:border-primary"
                      : "border-border text-muted-foreground/40 bg-muted/30 cursor-not-allowed line-through"
                  }`}
                >
                  {slot.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {slots.length === 0 && !isLoading && (
        <p
          className="text-xs text-muted-foreground text-center py-1"
          data-ocid="home.no_slots.empty_state"
        >
          No slots available on this date
        </p>
      )}
    </div>
  );
}

// ── Chat state types ──────────────────────────────────────────────────────────
type ChatPhase =
  | { kind: "idle" }
  | { kind: "awaiting_date" }
  | { kind: "awaiting_slot"; date: string; slots: number[] }
  | { kind: "confirming"; date: string; slotIndex: number };

// ── Chat Panel ────────────────────────────────────────────────────────────────
function ChatPanel() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "init",
      role: "assistant",
      content:
        "Hi! I'm BookBot, your AI booking assistant. Tell me when you'd like to book a slot and I'll take care of the rest. What date works for you?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [phase, setPhase] = useState<ChatPhase>({ kind: "idle" });
  const [pendingDate, setPendingDate] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const { mutateAsync: createBooking, isPending: isBooking } =
    useCreateBooking();

  // Fetch available slots only when we have a pending date
  const { data: fetchedSlots, isLoading: slotsLoading } = useAvailableSlots(
    pendingDate ?? "",
  );

  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll on content change
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // When slots finish loading after a date was set, advance to slot-selection phase
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally fires only on slot data change
  useEffect(() => {
    if (!pendingDate || slotsLoading || phase.kind !== "awaiting_date") return;
    const available = (fetchedSlots ?? []).map(Number);
    if (available.length === 0) {
      addBotMessage(
        `Sorry, no slots are available on ${pendingDate}. Try another date!`,
      );
      setPhase({ kind: "idle" });
      setPendingDate(null);
    } else {
      setPhase({ kind: "awaiting_slot", date: pendingDate, slots: available });
      const labels = available
        .map((s) => SLOT_TIMES[s]?.label ?? `Slot ${s}`)
        .join("  •  ");
      addBotMessage(
        `Great! Here are the available slots for ${pendingDate}:\n\n${labels}\n\nClick a slot below to book it, or type the time you prefer.`,
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchedSlots, slotsLoading]);

  function addBotMessage(content: string) {
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        role: "assistant" as const,
        content,
        timestamp: new Date(),
      },
    ]);
    setIsTyping(false);
  }

  async function bookSlot(date: string, slotIndex: number) {
    setIsTyping(true);
    try {
      await createBooking({ date, slotIndex });
      const label = SLOT_TIMES[slotIndex]?.label ?? `Slot ${slotIndex}`;
      addBotMessage(
        `✅ Booked! Your slot on ${date} at ${label} is confirmed. See you then!`,
      );
      toast.success(`Booked ${label} on ${date}!`);
    } catch (err) {
      addBotMessage(
        `Sorry, I couldn't complete the booking: ${
          err instanceof Error ? err.message : "Unknown error"
        }. Please try again.`,
      );
      toast.error(err instanceof Error ? err.message : "Booking failed");
    } finally {
      setPhase({ kind: "idle" });
      setPendingDate(null);
    }
  }

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || isTyping || slotsLoading || isBooking) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: text,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    await new Promise((r) => setTimeout(r, 600 + Math.random() * 400));

    const lower = text.toLowerCase();

    // ── Phase: awaiting_slot — user may type a time ──
    if (phase.kind === "awaiting_slot") {
      // Match typed slot time to available slots
      const matched = phase.slots.find((s) => {
        const slotInfo = SLOT_TIMES[s];
        return (
          lower.includes(slotInfo.start) ||
          lower.includes(slotInfo.label.toLowerCase()) ||
          lower.includes(slotInfo.end)
        );
      });
      if (matched !== undefined) {
        setPhase({ kind: "idle" });
        await bookSlot(phase.date, matched);
        return;
      }
      // User may have provided a different date instead
      const newDate = parseDateFromMsg(text);
      if (newDate) {
        setPendingDate(newDate);
        setPhase({ kind: "awaiting_date" });
        addBotMessage(`Checking availability for ${newDate}…`);
        return;
      }
      addBotMessage(
        `Please choose one of the available slots: ${phase.slots
          .map((s) => SLOT_TIMES[s]?.label)
          .join(", ")}`,
      );
      return;
    }

    // ── Phase: idle / general intent detection ──
    if (hasBookingIntent(lower) || phase.kind === "awaiting_date") {
      const date = parseDateFromMsg(text);
      if (date) {
        setPendingDate(date);
        setPhase({ kind: "awaiting_date" });
        addBotMessage(`Checking availability for ${date}…`);
      } else {
        setPhase({ kind: "awaiting_date" });
        addBotMessage(
          "Sure! Which date would you like to book? You can say 'tomorrow', a day name like 'Monday', or type a date like 2026-06-10.",
        );
      }
      return;
    }

    // ── Fallback: general questions ──
    if (lower.includes("cancel")) {
      addBotMessage(
        "To cancel a booking, an admin can do that from the Admin Panel. Need help with anything else?",
      );
    } else if (
      lower.includes("hour") ||
      lower.includes("long") ||
      lower.includes("duration")
    ) {
      addBotMessage("Each session is 1.5 hours (90 minutes).");
    } else if (lower.includes("time") || lower.includes("slot")) {
      addBotMessage(
        "We have 4 daily slots: 9:00 AM, 12:00 PM, 2:30 PM, and 4:30 PM. Just tell me which date you want and I'll show you what's open!",
      );
    } else {
      addBotMessage(
        "I'm here to help you book a slot! Tell me a date (e.g. 'tomorrow' or 'Monday') and I'll check what's available.",
      );
    }
  };

  const quickPrompts = [
    "Book a slot for tomorrow",
    "What slots are available today?",
    "Book for Monday",
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-border">
        <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center">
          <Bot className="w-5 h-5 text-primary" />
        </div>
        <div>
          <p className="font-display font-bold text-sm text-foreground">
            BookBot AI
          </p>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs text-muted-foreground">Online</span>
          </div>
        </div>
        <Badge
          variant="outline"
          className="ml-auto text-xs border-primary/30 text-primary"
        >
          <Sparkles className="w-3 h-3 mr-1" /> AI
        </Badge>
      </div>

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0"
        data-ocid="home.chat.messages"
      >
        {messages.map((msg, i) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.25,
              delay: i === messages.length - 1 ? 0 : 0,
            }}
            className={`flex gap-2.5 ${
              msg.role === "user" ? "flex-row-reverse" : "flex-row"
            }`}
          >
            {msg.role === "assistant" && (
              <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                <Bot className="w-3.5 h-3.5 text-primary" />
              </div>
            )}
            <div
              className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-line ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground rounded-tr-sm"
                  : "bg-muted text-foreground rounded-tl-sm"
              }`}
            >
              {msg.content}
            </div>
          </motion.div>
        ))}

        {/* Slot picker buttons (shown while awaiting slot selection) */}
        {phase.kind === "awaiting_slot" && !isTyping && (
          <div
            className="flex flex-wrap gap-2 pl-9"
            data-ocid="home.chat.slot_picker"
          >
            {phase.slots.map((s) => (
              <button
                key={s}
                type="button"
                disabled={isBooking}
                onClick={() => void bookSlot(phase.date, s)}
                data-ocid={`home.chat.slot.${s + 1}`}
                className="rounded-full border border-primary/40 bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/15 hover:border-primary transition-colors"
              >
                {SLOT_TIMES[s]?.label ?? `Slot ${s}`}
              </button>
            ))}
          </div>
        )}

        {(isTyping || slotsLoading || isBooking) && (
          <div className="flex gap-2.5">
            <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
              <Bot className="w-3.5 h-3.5 text-primary" />
            </div>
            <div
              className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1"
              data-ocid="home.chat.loading_state"
            >
              {[0, 1, 2].map((j) => (
                <span
                  key={j}
                  className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce"
                  style={{ animationDelay: `${j * 0.15}s` }}
                />
              ))}
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Quick prompts */}
      <div className="px-4 pb-2 flex gap-2 overflow-x-auto scrollbar-hide">
        {quickPrompts.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => {
              setInput(p);
            }}
            className="whitespace-nowrap rounded-full border border-border bg-muted/50 px-3 py-1 text-xs text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors shrink-0"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="p-4 pt-2 flex gap-2 border-t border-border">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void sendMessage();
            }
          }}
          placeholder="Ask about bookings..."
          data-ocid="home.chat.input"
          className="flex-1 bg-input border-border text-sm"
          disabled={isBooking}
        />
        <Button
          size="icon"
          onClick={() => void sendMessage()}
          disabled={!input.trim() || isBooking}
          data-ocid="home.chat.send_button"
          className="shrink-0"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

// ── Feature cards data ────────────────────────────────────────────────────────
const features = [
  {
    icon: Zap,
    title: "Instant Booking",
    desc: "Reserve your slot in seconds. No login required — just pick a date and time.",
    color: "text-accent",
    bg: "bg-accent/10",
  },
  {
    icon: Calendar,
    title: "3-Week View",
    desc: "See the full availability picture across current and upcoming weeks at a glance.",
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    icon: CheckCircle,
    title: "4 Daily Slots",
    desc: "Morning, midday, afternoon, and end-of-day slots to fit every schedule.",
    color: "text-success",
    bg: "bg-success/10",
  },
  {
    icon: Clock,
    title: "1.5 Hour Sessions",
    desc: "Each slot is 90 minutes — enough time to get thorough work done.",
    color: "text-warning",
    bg: "bg-warning/10",
  },
];

// ── Main Page ─────────────────────────────────────────────────────────────────
export function HomePage() {
  return (
    <div className="pt-16">
      {/* Hero */}
      <section className="bg-card border-b border-border py-14 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-8 items-start">
            {/* Left: hero text + quick book */}
            <div>
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Badge
                  variant="outline"
                  className="mb-5 border-primary/30 text-primary text-xs font-mono"
                >
                  <Bot className="w-3 h-3 mr-1.5" /> AI-Powered Booking
                </Badge>
                <h1 className="font-display font-black text-4xl lg:text-5xl text-foreground leading-tight mb-4">
                  Book your slot,{" "}
                  <span className="text-primary">effortlessly</span>
                </h1>
                <p className="text-muted-foreground text-lg leading-relaxed mb-8">
                  Smart scheduling with an AI assistant. Pick a date, grab an
                  open slot, and you're done — no account needed.
                </p>

                <div className="flex gap-3 mb-10">
                  <Link to="/calendar">
                    <Button
                      size="lg"
                      className="gap-2"
                      data-ocid="home.calendar_button"
                    >
                      <Calendar className="w-4 h-4" /> View Calendar
                    </Button>
                  </Link>
                  <Button
                    size="lg"
                    variant="outline"
                    className="gap-2 border-border"
                    onClick={() =>
                      document
                        .getElementById("quick-book")
                        ?.scrollIntoView({ behavior: "smooth" })
                    }
                    data-ocid="home.quick_book_button"
                  >
                    Quick Book
                  </Button>
                </div>

                {/* Quick book widget */}
                <div
                  id="quick-book"
                  className="rounded-2xl border border-border bg-background p-5 shadow-card"
                  data-ocid="home.quick_book.panel"
                >
                  <p className="font-display font-bold text-sm text-foreground mb-4 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-primary" /> Quick Book a Slot
                  </p>
                  <QuickBook />
                </div>
              </motion.div>
            </div>

            {/* Right: AI Chat */}
            <motion.div
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="rounded-2xl border border-border bg-card shadow-card overflow-hidden flex flex-col"
              style={{ height: 520 }}
              data-ocid="home.chat.panel"
            >
              <ChatPanel />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-background py-14 px-4">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <h2 className="font-display font-black text-3xl text-foreground mb-3">
              Simple, smart booking
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Designed for teams who need fast, reliable scheduling without
              complexity.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((feat, i) => (
              <motion.div
                key={feat.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                data-ocid={`home.feature.${i + 1}`}
                className="rounded-xl border border-border bg-card p-5 shadow-card hover:border-primary/30 transition-colors"
              >
                <div
                  className={`w-10 h-10 rounded-lg ${feat.bg} flex items-center justify-center mb-4`}
                >
                  <feat.icon className={`w-5 h-5 ${feat.color}`} />
                </div>
                <h3 className="font-display font-bold text-foreground text-sm mb-1.5">
                  {feat.title}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {feat.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-muted/40 border-t border-border py-14 px-4">
        <div className="container mx-auto max-w-2xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-display font-black text-3xl text-foreground mb-3">
              Ready to book your slot?
            </h2>
            <p className="text-muted-foreground mb-7">
              Browse the 3-week calendar and pick the time that works for you.
            </p>
            <Link to="/calendar">
              <Button
                size="lg"
                className="gap-2"
                data-ocid="home.cta.calendar_button"
              >
                <Calendar className="w-4 h-4" /> Open Calendar
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
