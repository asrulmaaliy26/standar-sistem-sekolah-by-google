export interface CalendarEventFile {
    id: number;
    name: string;
    url: string;
    description?: string;
}

export interface CalendarEvent {
    id: number;
    title: string;
    description?: string | null;
    tempat?: string | null;
    location?: string | null;
    start?: string;
    end?: string;
    realStart?: string;
    realEnd?: string;
    start_at?: string;
    end_at?: string;
    color?: string;
    status: string;
    created_by: string;
    files?: CalendarEventFile[];
}

export interface ModalState {
    open: boolean;
    mode: 'add' | 'edit' | 'view';
    event: CalendarEvent | null;
}
