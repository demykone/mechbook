import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight, Clock, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import {
  useAvailableSlots,
  useBookings,
  useCreateBooking,
} from "../hooks/useQueries";
import { SLOT_TIMES } from "../types";

// ── Date helpers ──────────────────────────────────────────────────────────────
function startOfWeek(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function addDays(d: Date, n: number): Date {
  const date = new Date(d);
  date.setDate(date.getDate() + n);
  return date;
}

function toDateStr(d: Date): string {
  return d.toISOString().split("T")[0];
}

function formatHeader(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

// Generates Mon–Fri for 3 consecutive weeks starting from weekStart
function buildWeeks(weekStart: Date): Date[][] {
  return [0, 1, 2].map((week) =>
    [0, 1, 2, 3, 4].map((day) => addDays(weekStart, week * 7 + day)),
  );
}

// ── Slot cell ─────────────────────────────────────────────────────────────────
interface SlotCellProps {
  date: Date;
  weekIdx: number;
  dayIdx: number;
  onSelect: (date: string, slotIndex: number) => void;
}

function SlotCell({ date, weekIdx, dayIdx, onSelect }: SlotCellProps) {
  const dateStr = toDateStr(date);
  const isToday = dateStr === toDateStr(new Date());
  const isPast = date < new Date(new Date().setHours(0, 0, 0, 0));

  const { data: slots = [], isLoading } = useAvailableSlots(
    isPast ? "" : dateStr,
  );
  const availableSet = new Set(slots.map((s) => Number(s)));

  return (
    <div
      data-ocid={`calendar.cell.${weekIdx + 1}.${dayIdx + 1}`}
      className={`min-h-[120px] rounded-xl border p-2 flex flex-col gap-1 ${
        isToday
          ? "border-primary/60 bg-primary/5"
          : isPast
            ? "border-border/30 bg-muted/10 opacity-50"
            : "border-border bg-card hover:border-border/80 transition-colors"
      }`}
    >
      {/* Date header */}
      <div className={`text-center mb-1 ${isToday ? "" : ""}`}>
        <span
          className={`font-display font-bold text-sm ${
            isToday
              ? "text-primary"
              : isPast
                ? "text-muted-foreground/50"
                : "text-foreground"
          }`}
        >
          {date.getDate()}
        </span>
      </div>

      {/* Slots */}
      {isPast ? null : isLoading ? (
        <>
          <Skeleton className="h-6 rounded bg-muted" />
          <Skeleton className="h-6 rounded bg-muted" />
        </>
      ) : (
        Object.entries(SLOT_TIMES).map(([idx, slot]) => {
          const slotNum = Number(idx);
          const available = availableSet.has(slotNum);
          return (
            <button
              key={idx}
              type="button"
              disabled={!available}
              onClick={() => available && onSelect(dateStr, slotNum)}
              data-ocid={`calendar.slot.${weekIdx + 1}.${dayIdx + 1}.${slotNum + 1}`}
              className={`w-full rounded-md px-1.5 py-1 text-[11px] font-medium transition-all ${
                available
                  ? "bg-primary/15 text-primary hover:bg-primary/30 border border-primary/30"
                  : "bg-muted/30 text-muted-foreground/40 border border-transparent cursor-not-allowed line-through"
              }`}
            >
              {slot.label}
            </button>
          );
        })
      )}
    </div>
  );
}

// ── Booking confirmation modal ─────────────────────────────────────────────────
interface BookingModalProps {
  date: string;
  slotIndex: number;
  onConfirm: () => void;
  onCancel: () => void;
  isPending: boolean;
}

function BookingModal({
  date,
  slotIndex,
  onConfirm,
  onCancel,
  isPending,
}: BookingModalProps) {
  const slot = SLOT_TIMES[slotIndex];
  const formatted = new Date(`${date}T12:00:00`).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onCancel}
      data-ocid="calendar.booking.dialog"
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.92, opacity: 0 }}
        className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-display font-black text-foreground text-lg">
              Confirm Booking
            </h3>
            <p className="text-muted-foreground text-sm mt-0.5">
              Review your slot details
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            data-ocid="calendar.booking.close_button"
            className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="rounded-xl border border-border bg-background p-4 mb-5 space-y-2">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Date</p>
              <p className="font-display font-bold text-foreground text-sm">
                {formatted}
              </p>
            </div>
          </div>
          <div className="h-px bg-border" />
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Time</p>
              <p className="font-display font-bold text-foreground text-sm">
                {slot.label} – {slot.end}
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onCancel}
            disabled={isPending}
            data-ocid="calendar.booking.cancel_button"
          >
            Cancel
          </Button>
          <Button
            className="flex-1"
            onClick={onConfirm}
            disabled={isPending}
            data-ocid="calendar.booking.confirm_button"
          >
            {isPending ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                Booking...
              </span>
            ) : (
              "Confirm Booking"
            )}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Main Calendar Page ────────────────────────────────────────────────────────
export function CalendarPage() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [weekOffset, setWeekOffset] = useState(0);
  const weekStart = addDays(startOfWeek(today), weekOffset * 7);
  const weeks = buildWeeks(weekStart);

  const startDate = toDateStr(weekStart);
  const endDate = toDateStr(addDays(weekStart, 20));
  const { data: bookings = [] } = useBookings(startDate, endDate);

  const [pending, setPending] = useState<{
    date: string;
    slotIndex: number;
  } | null>(null);
  const { mutateAsync: createBooking, isPending } = useCreateBooking();

  const headerMonths = Array.from(
    new Set(weeks.flat().map((d) => formatHeader(d))),
  ).join(" – ");

  const handleConfirm = async () => {
    if (!pending) return;
    try {
      await createBooking(pending);
      toast.success(
        `Booked ${SLOT_TIMES[pending.slotIndex].label} on ${pending.date}!`,
      );
      setPending(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Booking failed");
    }
  };

  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri"];

  return (
    <div className="pt-16 min-h-screen bg-background">
      <div className="container mx-auto max-w-6xl px-4 py-8">
        {/* Page header */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-6 gap-4 flex-wrap"
        >
          <div>
            <h1 className="font-display font-black text-2xl text-foreground">
              Booking Calendar
            </h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              {headerMonths}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setWeekOffset((o) => o - 1)}
              disabled={weekOffset === 0}
              data-ocid="calendar.pagination_prev"
              className="h-9 w-9"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Badge
              variant="outline"
              className="border-border text-muted-foreground text-xs font-mono px-3 py-1.5"
            >
              3 weeks
            </Badge>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setWeekOffset((o) => o + 1)}
              data-ocid="calendar.pagination_next"
              className="h-9 w-9"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </motion.div>

        {/* Bookings summary */}
        {bookings.length > 0 && (
          <div className="mb-5 p-3 rounded-xl border border-border bg-card flex items-center gap-3">
            <Badge
              variant="outline"
              className="border-primary/40 text-primary text-xs"
            >
              {bookings.filter((b) => b.status === "active").length} active
            </Badge>
            <span className="text-xs text-muted-foreground">
              bookings in this 3-week window
            </span>
          </div>
        )}

        {/* Day headers */}
        <div className="grid grid-cols-5 gap-2 mb-2">
          {weekDays.map((day) => (
            <div key={day} className="text-center">
              <span className="text-xs text-muted-foreground font-mono uppercase tracking-wider">
                {day}
              </span>
            </div>
          ))}
        </div>

        {/* Calendar grid — 3 weeks */}
        <div className="space-y-2" data-ocid="calendar.grid">
          {weeks.map((week, weekIdx) => (
            <div key={toDateStr(week[0])} className="grid grid-cols-5 gap-2">
              {week.map((date, dayIdx) => (
                <SlotCell
                  key={toDateStr(date)}
                  date={date}
                  weekIdx={weekIdx}
                  dayIdx={dayIdx}
                  onSelect={(date, slotIndex) =>
                    setPending({ date, slotIndex })
                  }
                />
              ))}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="mt-6 flex items-center gap-6 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-primary/20 border border-primary/30" />
            <span className="text-xs text-muted-foreground">Available</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-muted/30" />
            <span className="text-xs text-muted-foreground">
              Booked / Unavailable
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded border border-primary/60 bg-primary/5" />
            <span className="text-xs text-muted-foreground">Today</span>
          </div>
        </div>
      </div>

      {/* Booking confirmation modal */}
      <AnimatePresence>
        {pending && (
          <BookingModal
            date={pending.date}
            slotIndex={pending.slotIndex}
            onConfirm={() => void handleConfirm()}
            onCancel={() => setPending(null)}
            isPending={isPending}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
