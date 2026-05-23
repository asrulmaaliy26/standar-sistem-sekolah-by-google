import { CalendarEvent } from '@/types/calendar';

export const MONTH_NAMES = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

export const DOW_NAMES = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
export const GRID_ROWS = 6;
export const GRID_COLS = 7;

export const COLOR_PALETTE = [
    '#4285F4', '#0F9D58', '#DB4437', '#F4B400',
    '#00ACC1', '#8E24AA', '#7986CB', '#F4511E',
];

export const pad = (n: number) => String(n).padStart(2, '0');

export function startOfDay(d: Date): Date {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
}

export function addDays(date: Date, days: number): Date {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
}

export function formatDateTimeLocal(dateStr: string): string {
    if (!dateStr) return '';
    let d: Date;
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        d = new Date(dateStr + 'T00:00:00');
    } else {
        d = new Date(dateStr);
    }
    if (isNaN(d.getTime())) return '';
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function nowLocalString(): string {
    const now = new Date();
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

export function buildGoogleCalUrl(title: string, desc: string, location: string, start: Date, end: Date): string {
    const fmt = (d: Date) =>
        d.getUTCFullYear() +
        pad(d.getUTCMonth() + 1) +
        pad(d.getUTCDate()) + 'T' +
        pad(d.getUTCHours()) +
        pad(d.getUTCMinutes()) +
        pad(d.getUTCSeconds()) + 'Z';

    const params = new URLSearchParams({
        action: 'TEMPLATE',
        text: title,
        dates: `${fmt(start)}/${fmt(end)}`,
        details: desc || '',
        location: location || '',
    });

    return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export interface Strip {
    ev: CalendarEvent;
    row: number;
    colStart: number;
    widthDays: number;
    tier: number;
}

export function buildStrips(events: CalendarEvent[], gridStart: Date): Strip[] {
    const strips: Strip[] = [];
    const rowTiers: { tier: number; start: number; end: number }[][] =
        Array.from({ length: GRID_ROWS }, () => []);

    const sorted = [...events].sort((a, b) => {
        const aS = new Date(a.realStart || a.start || a.start_at || '').getTime();
        const bS = new Date(b.realStart || b.start || b.start_at || '').getTime();
        if (aS !== bS) return aS - bS;
        return new Date(b.realEnd || b.end || b.end_at || '').getTime() - new Date(a.realEnd || a.end || a.end_at || '').getTime();
    });

    sorted.forEach(ev => {
        const startDay = startOfDay(new Date(ev.realStart || ev.start || ev.start_at || ''));
        const endExclDay = startOfDay(new Date(ev.realEnd || ev.end || ev.end_at || ''));

        const msDay = 86400000;
        const startIdx = Math.floor((startDay.getTime() - gridStart.getTime()) / msDay);
        const endExclIdx = Math.floor((endExclDay.getTime() - gridStart.getTime()) / msDay);

        const spanStart = Math.max(0, startIdx);
        const spanEnd = Math.min(GRID_ROWS * GRID_COLS, Math.max(endExclIdx, startIdx + 1));

        if (spanEnd <= spanStart) return;

        let current = spanStart;
        while (current < spanEnd) {
            const row = Math.floor(current / GRID_COLS);
            if (row >= GRID_ROWS) break;
            const rowEnd = (row + 1) * GRID_COLS;
            const pieceStart = current;
            const pieceEnd = Math.min(spanEnd, rowEnd);
            const colStart = pieceStart % GRID_COLS;
            const widthDays = pieceEnd - pieceStart;

            let tier = 0;
            while (rowTiers[row].some(item =>
                item.tier === tier &&
                !(pieceEnd <= item.start || pieceStart >= item.end)
            )) { tier++; }

            rowTiers[row].push({ tier, start: pieceStart, end: pieceEnd });
            strips.push({ ev, row, colStart, widthDays, tier });
            current = pieceEnd;
        }
    });

    return strips;
}
