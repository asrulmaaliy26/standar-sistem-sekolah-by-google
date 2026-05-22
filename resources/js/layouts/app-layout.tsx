import AppLayoutTemplate from '@/layouts/app/app-sidebar-layout';
import { type BreadcrumbItem } from '@/types';
import { type ReactNode, useState, useEffect, useRef } from 'react';
import { usePage, Link } from '@inertiajs/react';

interface AppLayoutProps {
    children: ReactNode;
    breadcrumbs?: BreadcrumbItem[];
}

function ImpersonateBanner() {
    const { auth } = usePage().props as any;
    if (!auth?.is_impersonating) return null;

    const [position, setPosition] = useState({ x: -1000, y: -1000 }); // hidden initially to avoid flash
    const [isDragging, setIsDragging] = useState(false);
    const [hasDragged, setHasDragged] = useState(false);
    const dragRef = useRef<HTMLDivElement>(null);
    const posRef = useRef({ x: 0, y: 0 });

    useEffect(() => {
        // Init position bottom right (around bottom 5%, right 5%)
        const initialX = Math.max(20, window.innerWidth - 280);
        const initialY = Math.max(20, window.innerHeight - 100);
        setPosition({ x: initialX, y: initialY });
        posRef.current = { x: initialX, y: initialY };
    }, []);

    const handlePointerDown = (e: React.PointerEvent) => {
        setIsDragging(true);
        setHasDragged(false);
        e.currentTarget.setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (isDragging) {
            setHasDragged(true);
            
            // Constrain to window bounds
            const newX = Math.min(Math.max(0, posRef.current.x + e.movementX), window.innerWidth - 250);
            const newY = Math.min(Math.max(0, posRef.current.y + e.movementY), window.innerHeight - 60);
            
            posRef.current = { x: newX, y: newY };
            setPosition(posRef.current);
        }
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        setIsDragging(false);
        e.currentTarget.releasePointerCapture(e.pointerId);
    };

    return (
        <div
            ref={dragRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            style={{
                position: 'fixed',
                left: `${position.x}px`,
                top: `${position.y}px`,
                zIndex: 99999,
                touchAction: 'none'
            }}
            className={`flex items-center gap-3 px-4 py-2 bg-amber-500 text-white rounded-full shadow-2xl cursor-grab active:cursor-grabbing transition-transform ${isDragging ? 'scale-105 shadow-amber-500/50' : 'hover:scale-105'}`}
        >
            <div className="flex flex-col select-none pointer-events-none">
                <span className="text-[10px] font-bold uppercase tracking-wider opacity-90">Bypass Mode</span>
                <span className="text-sm font-bold truncate max-w-[120px]">{auth.user.name}</span>
            </div>
            
            <Link
                href="/leave-impersonate"
                method="post"
                as="button"
                onPointerDown={(e) => e.stopPropagation()}
                className="ml-2 p-2 bg-amber-600 hover:bg-amber-700 rounded-full transition-colors shadow-inner"
                title="Kembali ke Admin"
            >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5v0a5.5 5.5 0 0 1-5.5 5.5H11"/></svg>
            </Link>
        </div>
    );
}

export default ({ children, breadcrumbs, ...props }: AppLayoutProps) => (
    <AppLayoutTemplate breadcrumbs={breadcrumbs} {...props}>
        {children}
        <ImpersonateBanner />
    </AppLayoutTemplate>
);
