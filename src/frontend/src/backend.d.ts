import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Booking {
    id: bigint;
    startTime: string;
    status: BookingStatus;
    endTime: string;
    date: string;
    createdAt: bigint;
    slotIndex: bigint;
}
export enum BookingStatus {
    active = "active",
    cancelled = "cancelled"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    cancelBooking(id: bigint): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    createBooking(date: string, slotIndex: bigint): Promise<{
        __kind__: "ok";
        ok: Booking;
    } | {
        __kind__: "err";
        err: string;
    }>;
    getAvailableSlots(date: string): Promise<Array<bigint>>;
    getBookings(startDate: string, endDate: string): Promise<Array<Booking>>;
    getCallerUserRole(): Promise<UserRole>;
    isCallerAdmin(): Promise<boolean>;
}
