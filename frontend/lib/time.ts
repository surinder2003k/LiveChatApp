import { format, isToday, isYesterday, differenceInSeconds, differenceInMinutes, differenceInHours, differenceInDays } from "date-fns";

/** WhatsApp-style message timestamp: "3:45 PM", "Yesterday", "12/28/24" */
export function formatMessageTime(date: Date | string): string {
    const d = new Date(date);
    if (isToday(d)) return format(d, "h:mm a");
    if (isYesterday(d)) return "Yesterday";
    return format(d, "dd/MM/yy");
}

/** Precise format for tooltip on hover: "3:45:22 PM, 28 Jan 2025" */
export function formatPreciseTime(date: Date | string): string {
    const d = new Date(date);
    return formatMessageTime(d);
}

/** WhatsApp-style last seen: "Last seen today at 3:45 PM" */
export function formatLastSeen(lastSeen: Date | string | null | undefined): string {
    if (!lastSeen) return "Offline";
    const d = new Date(lastSeen);
    // Sanity check - if invalid date, fallback
    if (isNaN(d.getTime())) return "Offline";
    const now = new Date();
    const secs = differenceInSeconds(now, d);
    const mins = differenceInMinutes(now, d);
    const days = differenceInDays(now, d);

    if (secs < 60) return "Last seen just now";
    if (mins < 60) return `Last seen ${mins}m ago`;
    if (isToday(d)) return `Last seen today at ${format(d, "h:mm a")}`;
    if (isYesterday(d)) return `Last seen yesterday at ${format(d, "h:mm a")}`;
    if (days < 7) return `Last seen ${days} days ago`;
    return `Last seen ${format(d, "dd/MM/yy")}`;
}
