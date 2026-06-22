import { motion } from 'framer-motion';
import { useAppearance } from '@/hooks/use-appearance';
import { useEffect, useState } from 'react';

export function GalaxyBackground() {
    const { appearance } = useAppearance();
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        const checkDark = () => document.documentElement.classList.contains('dark');
        setIsDark(checkDark());
        
        // Observer to detect dark mode toggles if appearance is system
        const observer = new MutationObserver(() => {
            setIsDark(checkDark());
        });
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        return () => observer.disconnect();
    }, [appearance]);

    return (
        <div className={`fixed inset-0 pointer-events-none z-[-1] transition-opacity duration-1000 ${isDark ? 'opacity-100' : 'opacity-20'}`}>
            {/* Base Background (Greenish tint for dark mode, subtle for light) */}
            {isDark ? (
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#061f12] via-[#030b06] to-[#0a0a0a] opacity-80" />
            ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-emerald-100/50 opacity-50" />
            )}

            {/* 3D Glowing Galaxy Rings (Only visible in dark mode for full effect) */}
            {isDark && (
                <div className="absolute inset-0 flex items-center justify-center perspective-[1000px] overflow-hidden">
                    <motion.div 
                        animate={{ rotateZ: 360, rotateX: [70, 75, 70], rotateY: [10, -10, 10] }}
                        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                        className="absolute w-[80vw] h-[80vw] max-w-[1200px] max-h-[1200px] rounded-full border border-[#00ff88]/10"
                        style={{ boxShadow: '0 0 60px #00ff8811, inset 0 0 60px #00ff8811' }}
                    />
                    <motion.div 
                        animate={{ rotateZ: -360, rotateX: [65, 60, 65], rotateY: [-15, 15, -15] }}
                        transition={{ duration: 35, repeat: Infinity, ease: "linear" }}
                        className="absolute w-[60vw] h-[60vw] max-w-[900px] max-h-[900px] rounded-full border-[2px] border-[#00ff88]/20"
                        style={{ boxShadow: '0 0 40px #00ff8822, inset 0 0 40px #00ff8822' }}
                    />
                    <motion.div 
                        animate={{ rotateZ: 360, rotateX: [75, 80, 75], rotateY: [5, -5, 5] }}
                        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                        className="absolute w-[40vw] h-[40vw] max-w-[600px] max-h-[600px] rounded-full border-[3px] border-[#00ffaa]/30"
                        style={{ boxShadow: '0 0 80px #00ffaa44, inset 0 0 80px #00ffaa44' }}
                    />
                    <motion.div 
                        animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
                        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute w-32 h-32 rounded-full bg-[#00ffaa] blur-[120px]"
                    />
                </div>
            )}

            {/* CSS Stars Background */}
            <div 
                className={`absolute inset-0 ${isDark ? 'opacity-40' : 'opacity-10 brightness-0'}`} 
                style={{ background: 'transparent url("data:image/svg+xml,%3Csvg width=\'100\' height=\'100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Ccircle cx=\'5\' cy=\'5\' r=\'1\' fill=\'%23ffffff\' opacity=\'0.5\'/%3E%3Ccircle cx=\'85\' cy=\'20\' r=\'1.5\' fill=\'%2300ffaa\' opacity=\'0.8\'/%3E%3Ccircle cx=\'40\' cy=\'70\' r=\'1\' fill=\'%23ffffff\' opacity=\'0.3\'/%3E%3C/svg%3E") repeat' }} 
            />
        </div>
    );
}
