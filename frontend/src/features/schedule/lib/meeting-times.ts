import type { Meeting } from "../types";

const weekdays = ["M", "T", "W", "TH", "F", "S", "SU"];

// Summarize times independently of room/instructor records, which remain intact.
export function meetingTimes(meetings: Meeting[]) {
    const times = new Map<string, Set<string>>();
    for (const meeting of meetings) {
        const days = times.get(meeting.time) ?? new Set<string>();
        for (const day of meeting.days
            .split(",")
            .map((day) => day.trim())
            .filter(Boolean)) {
            days.add(day);
        }
        times.set(meeting.time, days);
    }
    return [...times].map(([time, days]) => ({
        time,
        days: [...days]
            .sort((a, b) => {
                const rank = (day: string) => {
                    const index = weekdays.indexOf(day);
                    return index < 0 ? weekdays.length : index;
                };
                return rank(a) - rank(b) || a.localeCompare(b);
            })
            .join(", "),
    }));
}

// Only combine room details when time, room, and instructor all agree.
export function meetingDetails(meetings: Meeting[]): Meeting[] {
    const groups = new Map<string, Meeting[]>();
    for (const meeting of meetings) {
        const key = JSON.stringify([
            meeting.time,
            meeting.room,
            meeting.instructor,
        ]);
        const group = groups.get(key) ?? [];
        group.push(meeting);
        groups.set(key, group);
    }
    return [...groups.values()].map((group) => ({
        ...group[0],
        days: meetingTimes(group)[0].days,
    }));
}
