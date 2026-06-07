module {
  public type BookingStatus = { #active; #cancelled };

  public type Booking = {
    id : Nat;
    date : Text;       // YYYY-MM-DD
    slotIndex : Nat;   // 0-3
    startTime : Text;  // e.g. "09:00"
    endTime : Text;    // e.g. "10:30"
    status : BookingStatus;
    createdAt : Int;   // nanoseconds
  };
};
