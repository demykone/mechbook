import Map "mo:core/Map";
import Types "types";

module {
  // Old types defined inline (copied from .old/src/backend/types.mo)
  type OldRole = { #admin; #mechanic };

  type OldMechanic = {
    id : Nat;
    principal : Principal;
    name : Text;
    role : OldRole;
    createdAt : Int;
  };

  type OldBookingStatus = { #active; #cancelled; #completed };

  type OldServerBooking = {
    id : Nat;
    mechanicId : Principal;
    mechanicName : Text;
    startTime : Int;
    endTime : Int;
    purpose : Text;
    jobId : ?Nat;
    status : OldBookingStatus;
    createdAt : Int;
  };

  type OldJobStatus = { #todo; #inProgress; #done };
  type OldJobPriority = { #low; #medium; #high };

  type OldJob = {
    id : Nat;
    title : Text;
    description : Text;
    vehicleInfo : ?Text;
    assignedTo : ?Principal;
    assigneeName : ?Text;
    priority : OldJobPriority;
    status : OldJobStatus;
    linkedBookingId : ?Nat;
    createdBy : Principal;
    createdAt : Int;
    updatedAt : Int;
  };

  type OldState = {
    var nextMechanicId : Nat;
    var nextBookingId : Nat;
    var nextJobId : Nat;
  };

  type OldActor = {
    mechanics : Map.Map<Principal, OldMechanic>;
    bookings : Map.Map<Nat, OldServerBooking>;
    jobs : Map.Map<Nat, OldJob>;
    state : OldState;
  };

  type NewActor = {
    bookings : Map.Map<Nat, Types.Booking>;
    state : { var nextId : Nat };
  };

  public func run(old : OldActor) : NewActor {
    // Old bookings used epoch timestamps + mechanicId — incompatible with new
    // date+slotIndex model. Drop old bookings and start fresh.
    // Carry forward the nextId counter so IDs never collide.
    let newBookings = Map.empty<Nat, Types.Booking>();
    {
      bookings = newBookings;
      state = { var nextId = old.state.nextBookingId };
    };
  };
};
