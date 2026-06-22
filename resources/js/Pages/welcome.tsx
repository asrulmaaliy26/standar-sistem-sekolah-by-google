import { type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { BookOpen, GraduationCap, LayoutDashboard, LogIn, ArrowRight } from 'lucide-react';

export default function Welcome() {
    const { auth } = usePage<SharedData>().props;

    return (
        <>
            <Head title="Selamat Datang - Smart LPI Al-Hidayah">
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;700;900&family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />
            </Head>

            <div className="relative min-h-screen w-full bg-[#030b06] overflow-hidden font-['Inter'] text-white selection:bg-[#00ff88] selection:text-black">
                {/* --- Galaxy Background --- */}
                {/* Deep background gradient */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#061f12] via-[#030b06] to-black opacity-80" />

                {/* 3D Glowing Galaxy Rings */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none perspective-[1000px]">
                    {/* Ring 1 - Outer */}
                    <motion.div 
                        animate={{ rotateZ: 360, rotateX: [70, 75, 70], rotateY: [10, -10, 10] }}
                        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                        className="absolute w-[80vw] h-[80vw] max-w-[1200px] max-h-[1200px] rounded-full border border-[#00ff88]/20"
                        style={{ boxShadow: '0 0 80px #00ff8822, inset 0 0 80px #00ff8822' }}
                    />
                    {/* Ring 2 - Middle */}
                    <motion.div 
                        animate={{ rotateZ: -360, rotateX: [65, 60, 65], rotateY: [-15, 15, -15] }}
                        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                        className="absolute w-[60vw] h-[60vw] max-w-[900px] max-h-[900px] rounded-full border-[2px] border-[#00ff88]/40"
                        style={{ boxShadow: '0 0 60px #00ff8844, inset 0 0 60px #00ff8844' }}
                    />
                    {/* Ring 3 - Inner glowing core */}
                    <motion.div 
                        animate={{ rotateZ: 360, rotateX: [75, 80, 75], rotateY: [5, -5, 5] }}
                        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                        className="absolute w-[40vw] h-[40vw] max-w-[600px] max-h-[600px] rounded-full border-[4px] border-[#00ffaa]/60"
                        style={{ boxShadow: '0 0 100px #00ffaa, inset 0 0 100px #00ffaa' }}
                    />
                    {/* Central Core Light */}
                    <motion.div 
                        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute w-32 h-32 rounded-full bg-[#00ffaa] blur-[100px]"
                    />
                </div>

                {/* --- Content Overlay --- */}
                <div className="relative z-10 flex flex-col min-h-screen">
                    {/* Header / Navbar */}
                    <header className="w-full p-6 lg:px-12 flex justify-between items-center backdrop-blur-md bg-black/10 border-b border-[#00ff88]/20">
                        <motion.div 
                            initial={{ opacity: 0, x: -50 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className="flex items-center gap-3"
                        >
                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#00ffaa] to-[#0088ff] flex items-center justify-center shadow-[0_0_20px_#00ffaa66]">
                                <GraduationCap className="w-6 h-6 text-black" />
                            </div>
                            <h1 className="font-['Orbitron'] font-bold text-xl tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-white to-[#00ffaa] hidden sm:block">
                                SMART LPI AL-HIDAYAH
                            </h1>
                        </motion.div>

                        <motion.nav 
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                            className="flex items-center gap-4"
                        >
                            <a
                                href="https://script.google.com/macros/s/AKfycbxd1nxUABDpNmyGALc3EOm5W_VaGlWCf54pPgJHJccj0-LFoRkZa1XdB5mg9d5NtRKC/exec"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group flex items-center gap-2 rounded-full border border-[#00ff88]/50 bg-black/30 px-4 sm:px-5 py-2 text-sm font-medium text-white backdrop-blur-md transition-all hover:bg-[#00ffaa]/20 hover:border-[#00ffaa] hover:shadow-[0_0_15px_#00ffaa66]"
                            >
                                <BookOpen className="w-4 h-4 text-[#00ffaa] group-hover:text-white transition-colors" />
                                <span className="hidden sm:inline">Pelanggaran</span>
                            </a>

                            {auth.user ? (
                                <Link
                                    href={route('dashboard')}
                                    className="flex items-center gap-2 rounded-full bg-[#00ffaa] px-4 sm:px-5 py-2 text-sm font-bold text-black transition-all hover:bg-white hover:shadow-[0_0_20px_#00ffaa]"
                                >
                                    <LayoutDashboard className="w-4 h-4" />
                                    Dashboard
                                </Link>
                            ) : (
                                <>
                                    <Link
                                        href={route('login')}
                                        className="hidden lg:flex items-center gap-2 px-5 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors"
                                    >
                                        Log in
                                    </Link>
                                    <Link
                                        href={route('register')}
                                        className="flex items-center gap-2 rounded-full bg-[#00ffaa] px-4 sm:px-5 py-2 text-sm font-bold text-black transition-all hover:bg-white hover:shadow-[0_0_20px_#00ffaa]"
                                    >
                                        <LogIn className="w-4 h-4" />
                                        Register
                                    </Link>
                                </>
                            )}
                        </motion.nav>
                    </header>

                    {/* Main Hero */}
                    <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                        <motion.div
                            initial={{ opacity: 0, y: 50, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ duration: 1, ease: "easeOut", delay: 0.4 }}
                            className="max-w-4xl"
                        >
                            <h2 className="font-['Orbitron'] text-5xl md:text-7xl font-black mb-6 leading-tight tracking-tight uppercase">
                                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-400">
                                    Revolusi Pendidikan
                                </span>
                                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-[#00ffaa] to-[#00b8ff] drop-shadow-[0_0_25px_rgba(0,255,170,0.5)]">
                                    Era Digital
                                </span>
                            </h2>
                            
                            <p className="text-lg md:text-xl text-gray-400 mb-10 max-w-2xl mx-auto font-light">
                                Menggabungkan nilai-nilai Islami dengan teknologi mutakhir untuk menciptakan generasi unggul yang siap menghadapi masa depan.
                            </p>

                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                <Link href={route('register')} className="group relative inline-flex items-center justify-center px-8 py-4 font-bold text-black bg-[#00ffaa] rounded-full overflow-hidden transition-all hover:scale-105 hover:shadow-[0_0_30px_#00ffaa]">
                                    <span className="absolute w-0 h-0 transition-all duration-500 ease-out bg-white rounded-full group-hover:w-56 group-hover:h-56 opacity-10"></span>
                                    <span className="relative flex items-center gap-2">
                                        Mulai Sekarang <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                    </span>
                                </Link>
                                <a href="#features" className="inline-flex items-center justify-center px-8 py-4 font-medium text-white border border-[#00ffaa]/50 rounded-full hover:bg-[#00ffaa]/10 backdrop-blur-sm transition-all hover:border-[#00ffaa]">
                                    Pelajari Lebih Lanjut
                                </a>
                            </div>
                        </motion.div>
                    </main>

                    {/* Bottom Features Bar */}
                    <footer className="w-full p-6 border-t border-[#00ffaa]/20 bg-black/20 backdrop-blur-xl mt-auto">
                        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
                            <motion.div 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8, delay: 0.8 }}
                                className="flex items-center gap-3"
                            >
                                <div className="w-2 h-2 rounded-full bg-[#00ffaa] shadow-[0_0_10px_#00ffaa] animate-pulse" />
                                <span className="text-sm font-medium tracking-widest text-[#00ffaa] uppercase">Kurikulum Modern</span>
                            </motion.div>
                            <motion.div 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8, delay: 1.0 }}
                                className="flex items-center gap-3"
                            >
                                <div className="w-2 h-2 rounded-full bg-[#00b8ff] shadow-[0_0_10px_#00b8ff] animate-pulse" />
                                <span className="text-sm font-medium tracking-widest text-[#00b8ff] uppercase">Sistem Terpadu</span>
                            </motion.div>
                            <motion.div 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8, delay: 1.2 }}
                                className="flex items-center gap-3"
                            >
                                <div className="w-2 h-2 rounded-full bg-purple-400 shadow-[0_0_10px_#c084fc] animate-pulse" />
                                <span className="text-sm font-medium tracking-widest text-purple-400 uppercase">Prestasi Global</span>
                            </motion.div>
                        </div>
                    </footer>
                </div>

                {/* Floating CSS Stars */}
                <div className="absolute inset-0 pointer-events-none z-0 opacity-50" style={{ background: 'transparent url("data:image/svg+xml,%3Csvg width=\'100\' height=\'100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Ccircle cx=\'5\' cy=\'5\' r=\'1\' fill=\'%23ffffff\' opacity=\'0.5\'/%3E%3Ccircle cx=\'85\' cy=\'20\' r=\'1.5\' fill=\'%2300ffaa\' opacity=\'0.8\'/%3E%3Ccircle cx=\'40\' cy=\'70\' r=\'1\' fill=\'%23ffffff\' opacity=\'0.3\'/%3E%3C/svg%3E") repeat' }} />
            </div>
        </>
    );
}
