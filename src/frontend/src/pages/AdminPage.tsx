import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, ShieldOff, XCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { BookingStatus } from "../backend";
import { useBookings, useCancelBooking, useIsAdmin } from "../hooks/useQueries";
import { SLOT_TIMES } from "../types";
import type { Booking } from "../types";

// ── Helpers ──────────────────────────────────────────────────────────────────
function toDateString(d: Date) {
  return d.toISOString().slice(0, 10);
}

function addDays(d: Date, n: number) {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + n);
  return copy;
}

function formatDate(iso: string) {
  const parts = iso.split("-").map(Number);
  return new Date(parts[0], parts[1] - 1, parts[2]).toLocaleDateString(
    "en-US",
    {
      weekday: "short",
      month: "short",
      day: "numeric",
    },
  );
}

function slotLabel(slotIndex: number): string {
  const slot = SLOT_TIMES[slotIndex];
  if (!slot) return `Slot ${slotIndex}`;
  return `${slot.start} – ${slot.end}`;
}

// ── Admin Page ────────────────────────────────────────────────────────────────
export function AdminPage() {
  const today = toDateString(new Date());
  const defaultEnd = toDateString(addDays(new Date(), 21));

  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(defaultEnd);
  const [confirmId, setConfirmId] = useState<bigint | null>(null);

  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();
  const { data: bookings, isLoading: bookingsLoading } = useBookings(
    startDate,
    endDate,
  );
  const cancelMutation = useCancelBooking();

  const activeBookings = (bookings ?? []).filter(
    (b: Booking) => b.status === BookingStatus.active,
  );

  async function handleConfirmCancel() {
    if (confirmId === null) return;
    try {
      await cancelMutation.mutateAsync(confirmId);
      toast.success("Booking cancelled");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to cancel");
    } finally {
      setConfirmId(null);
    }
  }

  if (adminLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Skeleton className="h-8 w-48 rounded-lg" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div
        data-ocid="admin.unauthorized"
        className="flex-1 flex flex-col items-center justify-center gap-4 py-24 px-4"
      >
        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
          <ShieldOff className="w-8 h-8 text-destructive" />
        </div>
        <h2 className="font-display font-black text-2xl text-foreground">
          Not Authorized
        </h2>
        <p className="text-muted-foreground text-center max-w-xs">
          This area is restricted to administrators only.
        </p>
      </div>
    );
  }

  return (
    <div
      data-ocid="admin.page"
      className="max-w-5xl mx-auto w-full px-4 pt-20 pb-10"
    >
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Calendar className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="font-display font-black text-2xl text-primary leading-none">
            Admin Panel
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            View and manage all server bookings
          </p>
        </div>
      </div>

      <div
        data-ocid="admin.filter.section"
        className="flex flex-wrap items-end gap-4 mb-8 p-5 rounded-xl border border-border bg-card"
      >
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="start-date"
            className="text-xs font-semibold text-muted-foreground uppercase tracking-wide"
          >
            From
          </label>
          <input
            id="start-date"
            data-ocid="admin.start_date.input"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="h-9 rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="end-date"
            className="text-xs font-semibold text-muted-foreground uppercase tracking-wide"
          >
            To
          </label>
          <input
            id="end-date"
            data-ocid="admin.end_date.input"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="h-9 rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <p className="text-xs text-muted-foreground self-end pb-2">
          Showing active bookings in selected range
        </p>
      </div>

      {bookingsLoading ? (
        <div className="space-y-3" data-ocid="admin.bookings.loading_state">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </div>
      ) : activeBookings.length === 0 ? (
        <div
          data-ocid="admin.bookings.empty_state"
          className="py-16 text-center rounded-xl border border-dashed border-border"
        >
          <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-30" />
          <p className="font-display font-bold text-foreground mb-1">
            No active bookings
          </p>
          <p className="text-sm text-muted-foreground">
            No active bookings found in the selected date range.
          </p>
        </div>
      ) : (
        <div
          data-ocid="admin.bookings.table"
          className="rounded-xl border border-border bg-card overflow-hidden"
        >
          <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-4 px-5 py-3 bg-muted/40 border-b border-border">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Date
            </span>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Time Slot
            </span>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Booking ID
            </span>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Action
            </span>
          </div>
          <div className="divide-y divide-border">
            {activeBookings.map((booking: Booking, idx: number) => (
              <div
                key={booking.id.toString()}
                data-ocid={`admin.booking.item.${idx + 1}`}
                className="grid grid-cols-[1fr_1fr_1fr_auto] gap-4 items-center px-5 py-4 hover:bg-muted/20 transition-colors"
              >
                <span className="text-sm text-foreground font-medium">
                  {formatDate(booking.date)}
                </span>
                <span className="text-sm text-foreground">
                  {slotLabel(Number(booking.slotIndex))}
                </span>
                <span className="text-sm font-mono text-muted-foreground">
                  #{booking.id.toString()}
                </span>
                <Button
                  data-ocid={`admin.booking.delete_button.${idx + 1}`}
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive h-8 gap-1.5"
                  onClick={() => setConfirmId(booking.id)}
                >
                  <XCircle className="w-3.5 h-3.5" />
                  Cancel
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      <AlertDialog
        open={confirmId !== null}
        onOpenChange={(open) => !open && setConfirmId(null)}
      >
        <AlertDialogContent
          data-ocid="admin.cancel.dialog"
          className="bg-card border-border"
        >
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display font-black">
              Cancel Booking?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently cancel booking{" "}
              <span className="font-mono text-foreground">
                #{confirmId?.toString()}
              </span>
              . This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              data-ocid="admin.cancel.cancel_button"
              className="bg-muted border-border"
            >
              Keep Booking
            </AlertDialogCancel>
            <AlertDialogAction
              data-ocid="admin.cancel.confirm_button"
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleConfirmCancel}
            >
              Yes, Cancel It
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
