import Map "mo:core/Map";
import Time "mo:core/Time";
import AccessControl "mo:caffeineai-authorization/access-control";
import MixinAuthorization "mo:caffeineai-authorization/MixinAuthorization";
import Types "types";
import Migration "migration";

(with migration = Migration.run)
actor MechBook {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // ---- State ----
  let bookings = Map.empty<Nat, Types.Booking>();
  let state = { var nextId : Nat = 1 };

  // ---- Slot helpers ----

  // slot 0 = 09:00-10:30, slot 1 = 12:00-13:30, slot 2 = 14:30-16:00, slot 3 = 16:30-18:00
  let slotStartTimes : [Text] = ["09:00", "12:00", "14:30", "16:30"];
  let slotEndTimes   : [Text] = ["10:30", "13:30", "16:00", "18:00"];

  func isValidDate(date : Text) : Bool {
    // Expect YYYY-MM-DD (10 chars), with '-' at positions 4 and 7
    if (date.size() != 10) return false;
    var i = 0;
    var dashCount = 0;
    for (c in date.chars()) {
      if (i == 4 or i == 7) {
        if (c != '-') return false;
        dashCount += 1;
      };
      i += 1;
    };
    dashCount == 2;
  };

  // ---- Public API ----

  public func createBooking(date : Text, slotIndex : Nat) : async { #ok : Types.Booking; #err : Text } {
    if (slotIndex > 3) {
      return #err("slotIndex must be 0-3");
    };
    if (not isValidDate(date)) {
      return #err("Invalid date format. Use YYYY-MM-DD");
    };
    // Conflict check: slot already taken for that date
    let taken = bookings.values().any(
      func(b) {
        b.status == #active and b.date == date and b.slotIndex == slotIndex;
      }
    );
    if (taken) {
      return #err("Slot already booked for this date");
    };
    let id = state.nextId;
    state.nextId += 1;
    let booking : Types.Booking = {
      id;
      date;
      slotIndex;
      startTime = slotStartTimes[slotIndex];
      endTime   = slotEndTimes[slotIndex];
      status    = #active;
      createdAt = Time.now();
    };
    bookings.add(id, booking);
    #ok booking;
  };

  public query func getBookings(startDate : Text, endDate : Text) : async [Types.Booking] {
    bookings.values()
      .filter(func(b) {
        b.status == #active and b.date >= startDate and b.date <= endDate;
      })
      .toArray();
  };

  public query func getAvailableSlots(date : Text) : async [Nat] {
    var available : [Nat] = [];
    for (i in [0, 1, 2, 3].values()) {
      let taken = bookings.values().any(
        func(b) { b.status == #active and b.date == date and b.slotIndex == i }
      );
      if (not taken) {
        available := available.concat([i]);
      };
    };
    available;
  };

  public shared ({ caller }) func cancelBooking(id : Nat) : async { #ok : (); #err : Text } {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      return #err("Unauthorized: admin only");
    };
    switch (bookings.get(id)) {
      case null #err("Booking not found");
      case (?booking) {
        bookings.add(id, { booking with status = #cancelled });
        #ok ();
      };
    };
  };

};
