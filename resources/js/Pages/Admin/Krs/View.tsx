import AppLayout from '@/layouts/app-layout';
import { Head, router, useForm } from '@inertiajs/react';
import * as XLSX from 'xlsx';
import {
    AlertCircle,
    ArrowRight,
    BookOpen,
    Calculator,
    Check,
    Clock,
    Download,
    Edit,
    MapPin,
    Play,
    RefreshCw,
    Search,
    Trash2,
    Upload,
    Users,
    Info,
    FileText,
    AlertTriangle, 
    CalendarDays, 
    CheckCircle2, 
    ChevronRight, 
    FileDown, 
    FileUp, 
    ListTodo, 
    Plus, 
    Settings, 
    Save,
} from 'lucide-react';
import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import TabMapel from './Tabs/TabMapel';
import TabPendidik from './Tabs/TabPendidik';
import TabRuangan from './Tabs/TabRuangan';
import TabMainDisplay from './Tabs/TabMainDisplay';

interface Plot {
    id: number;
    krs_matakuliah_id: number;
    krs_dosen_id: number | null;
    krs_ruang_id: number | null;
    krs_waktu_ids: number[] | null;
    hari: string | null;
    is_conflict: boolean;
    conflict_message: string | null;
    conflict_group_id?: number | null;
    matakuliah: { kode_mk: string; nama_mk: string; kelas: string; semester: number | null; sks: number };
    dosen?: { id: number; nama_dosen: string };
    ruang?: { id: number; nama_ruang: string };
    waktu_details?: { id: number; hari: string; jam_mulai: string; jam_selesai: string }[];
}

export default function KrsIndex({ periods, activePeriodId, plots, matakuliahs, dosens, ruangs, waktus, readiness_data }: any) {
    const {
        data: periodData,
        setData: setPeriodData,
        post: postPeriod,
    } = useForm({
        tahun_akademik: '',
        semester: 'Ganjil',
    });

    const {
        data: importData,
        setData: setImportData,
        post: postImport,
    } = useForm({
        type: 'matakuliah',
        file: null as File | null,
        period_id: activePeriodId,
    });

    const [editPlot, setEditPlot] = useState<Plot | null>(null);
    const {
        data: editData,
        setData: setEditData,
        put: putEdit,
    } = useForm({
        krs_dosen_id: '',
        krs_dosen_kedua_id: '',
        krs_ruang_id: '',
        hari: 'Senin',
        krs_waktu_ids: [] as number[],
        is_locked: false,
    });

    const [editTimes, setEditTimes] = useState<string[]>([]);
    const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const initialTab = urlParams ? (urlParams.get('tab') || 'main_display') : 'main_display';
    const [activeTab, setActiveTab] = useState(initialTab);

    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('Semua');


    // 🌟 GLOBAL SCROLL PRESERVER
    // Menyimpan posisi scroll halaman agar ketika edit matkul (rabu dll) tidak kembali ke atas
    useEffect(() => {
        // Coba kembalikan scroll setelah komponen mount
        const restoreScroll = () => {
            const savedScroll = sessionStorage.getItem('krs_scroll_position');
            if (savedScroll) {
                window.scrollTo({ top: parseInt(savedScroll, 10), behavior: 'instant' });
            }
        };

        // Tunggu sedikit agar DOM render selesai, lalu scroll
        const timer = setTimeout(restoreScroll, 100);

        // Simpan posisi scroll setiap kali user scrolling
        let scrollTimeout: NodeJS.Timeout;
        const handleScroll = () => {
            if (scrollTimeout) clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                sessionStorage.setItem('krs_scroll_position', window.scrollY.toString());
            }, 100);
        };

        window.addEventListener('scroll', handleScroll);
        
        // Simpan sebelum reload/unload (F5)
        const handleBeforeUnload = () => {
            sessionStorage.setItem('krs_scroll_position', window.scrollY.toString());
        };
        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            clearTimeout(timer);
            if (scrollTimeout) clearTimeout(scrollTimeout);
            window.removeEventListener('scroll', handleScroll);
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, []);

    const uniqueDosensList = React.useMemo(() => {
        if (!editPlot) return [];
        const uniqueDosensMap = new Map();
        if (editPlot.dosen) uniqueDosensMap.set(editPlot.dosen.nama_dosen, editPlot.dosen);
        if (editPlot.dosen_kedua) uniqueDosensMap.set(editPlot.dosen_kedua.nama_dosen, editPlot.dosen_kedua);
        dosens.forEach((d: any) => {
            if (!uniqueDosensMap.has(d.nama_dosen)) {
                uniqueDosensMap.set(d.nama_dosen, d);
            }
        });
        return Array.from(uniqueDosensMap.values());
    }, [editPlot, dosens]);

    // State for Aturan Batasan Waktu Khusus (saved in localStorage)
    const [ruleActive, setRuleActive] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('krs_rule_active') || 'false');
        } catch {
            return false;
        }
    });
    const [ruleStartSlot, setRuleStartSlot] = useState(() => {
        return parseInt(localStorage.getItem('krs_rule_start') || '3');
    });
    const [ruleEndSlot, setRuleEndSlot] = useState(() => {
        return parseInt(localStorage.getItem('krs_rule_end') || '8');
    });
    const [ruleMkCodes, setRuleMkCodes] = useState<string[]>(() => {
        try {
            return JSON.parse(localStorage.getItem('krs_rule_mks') || '[]');
        } catch {
            return [];
        }
    });

    const [rule2Active, setRule2Active] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('krs_rule2_active') || 'false');
        } catch {
            return false;
        }
    });
    const [rule2StartSlot, setRule2StartSlot] = useState(() => {
        return parseInt(localStorage.getItem('krs_rule2_start') || '1');
    });
    const [rule2EndSlot, setRule2EndSlot] = useState(() => {
        return parseInt(localStorage.getItem('krs_rule2_end') || '10');
    });
    const [rule2MkCodes, setRule2MkCodes] = useState<string[]>(() => {
        try {
            return JSON.parse(localStorage.getItem('krs_rule2_mks') || '[]');
        } catch {
            return [];
        }
    });

    const [rule3Active, setRule3Active] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('krs_rule3_active') || 'true');
        } catch {
            return true;
        }
    });

    const [ruleAbaikanJenis, setRuleAbaikanJenis] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('krs_rule_abaikan_jenis') || 'false');
        } catch {
            return false;
        }
    });

    const [ruleTanpaRuangan, setRuleTanpaRuangan] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('krs_rule_tanpa_ruangan') || 'false');
        } catch {
            return false;
        }
    });

    

    // Auto-select ruang based on class if editing manually and ruleTanpaRuangan is true
    React.useEffect(() => {
        if (editPlot && ruleTanpaRuangan) {
            // Only auto-select if it's not already selected (e.g. from a plot that already has a room)
            // or if we want to force it to match the class. In Tanpa Ruangan, room MUST match class.
            const classNameStr = editPlot.matakuliah.kelas.split(',')[0].trim().toLowerCase();
            const matchingRoom = ruangs?.find((r: any) => 
                r.nama_ruang.toLowerCase().trim() === classNameStr || 
                r.kode_ruang.toLowerCase().trim() === classNameStr
            );
            
            if (matchingRoom && (!editData.krs_ruang_id || editData.krs_ruang_id !== matchingRoom.id.toString())) {
                setEditData('krs_ruang_id', matchingRoom.id.toString());
            }
        }
    }, [editPlot, ruleTanpaRuangan, ruangs]);

    const [genJamMulai, setGenJamMulai] = useState('07:00');
    const [genDurasi, setGenDurasi] = useState(40);
    const [genSlot, setGenSlot] = useState(10);
    const [genIsIstirahat, setGenIsIstirahat] = useState(false);
    const [genIstirahatMulai, setGenIstirahatMulai] = useState('09:40');
    const [genIstirahatSelesai, setGenIstirahatSelesai] = useState('10:10');

    let finalTimeStr = '';
    if (genJamMulai && genDurasi > 0 && genSlot > 0) {
        let [h, m] = genJamMulai.split(':').map(Number);
        let totalMinutes = h * 60 + m;

        let istMulaiMins = 0;
        let istSelesaiMins = 0;
        if (genIsIstirahat && genIstirahatMulai && genIstirahatSelesai) {
            let [ih, im] = genIstirahatMulai.split(':').map(Number);
            istMulaiMins = ih * 60 + im;
            let [sh, sm] = genIstirahatSelesai.split(':').map(Number);
            istSelesaiMins = sh * 60 + sm;
        }

        for (let i = 0; i < genSlot; i++) {
            if (genIsIstirahat && istMulaiMins && istSelesaiMins) {
                if (totalMinutes >= istMulaiMins && totalMinutes < istSelesaiMins) {
                    totalMinutes = istSelesaiMins;
                }
            }
            totalMinutes += genDurasi;
        }

        const finalH = Math.floor(totalMinutes / 60) % 24;
        const finalM = totalMinutes % 60;
        finalTimeStr = `${finalH.toString().padStart(2, '0')}:${finalM.toString().padStart(2, '0')}`;
    }

    const sortedPlots = React.useMemo(() => {
        let sortableItems = [...(plots || [])];

        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            sortableItems = sortableItems.filter(
                (p: Plot) =>
                    p.matakuliah.kode_mk.toLowerCase().includes(q) ||
                    p.matakuliah.nama_mk.toLowerCase().includes(q) ||
                    (p.dosen?.nama_dosen || '').toLowerCase().includes(q) ||
                    (p.ruang?.nama_ruang || '').toLowerCase().includes(q),
            );
        }

        if (filterStatus === 'Konflik') {
            sortableItems = sortableItems.filter((p: Plot) => p.is_conflict);
        } else if (filterStatus === 'Aman') {
            sortableItems = sortableItems.filter((p: Plot) => !p.is_conflict && p.krs_dosen_id && p.krs_waktu_ids && p.krs_waktu_ids.length > 0);
        } else if (filterStatus === 'Belum Diplot') {
            sortableItems = sortableItems.filter((p: Plot) => !p.is_conflict && (!p.krs_waktu_ids || p.krs_waktu_ids.length === 0));
        }

        if (sortConfig !== null) {
            sortableItems.sort((a, b) => {
                let aValue: any, bValue: any;
                switch (sortConfig.key) {
                    case 'kode_mk':
                        aValue = a.matakuliah.kode_mk;
                        bValue = b.matakuliah.kode_mk;
                        break;
                    case 'nama_mk':
                        aValue = a.matakuliah.nama_mk;
                        bValue = b.matakuliah.nama_mk;
                        break;
                    case 'kelas':
                        aValue = a.matakuliah.kelas;
                        bValue = b.matakuliah.kelas;
                        break;
                    case 'sks':
                        aValue = a.matakuliah.sks;
                        bValue = b.matakuliah.sks;
                        break;
                    case 'dosen':
                        aValue = a.dosen?.nama_dosen || '';
                        bValue = b.dosen?.nama_dosen || '';
                        break;
                    case 'ruang':
                        aValue = a.ruang?.nama_ruang || '';
                        bValue = b.ruang?.nama_ruang || '';
                        break;
                    case 'jadwal':
                        aValue = a.hari || '';
                        bValue = b.hari || '';
                        break;
                    case 'status':
                        aValue = a.is_conflict ? 1 : a.krs_waktu_ids ? 0 : -1;
                        bValue = b.is_conflict ? 1 : b.krs_waktu_ids ? 0 : -1;
                        break;
                    default:
                        return 0;
                }

                if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return sortableItems;
    }, [plots, sortConfig, searchQuery, filterStatus]);

    const requestSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const uniqueWaktuStrings = Array.from(new Set(waktus?.map((w: any) => `${w.jam_mulai} - ${w.jam_selesai}`) || [])) as string[];

    const handleCreatePeriod = (e: React.FormEvent) => {
        e.preventDefault();
        postPeriod(route('admin.krs.period.store'), {
            preserveScroll: true,
            onSuccess: () => alert('Periode berhasil dibuat!'),
        });
    };

    const isMatakuliahUploaded = matakuliahs && matakuliahs.length > 0;

    const handleImport = (e: React.FormEvent) => {
        e.preventDefault();
        if (!importData.file) return alert('Pilih file CSV');
        postImport(route('admin.krs.import'), {
            preserveScroll: true,
            onSuccess: () => {
                setImportData('file', null);
            },
        });
    };

    const getCookie = (name: string) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return decodeURIComponent(parts.pop()?.split(';').shift() || '');
        return '';
    };

    const handlePlot = async () => {
        if (!confirm('Lakukan ploting otomatis (Iteratif Ruin & Recreate)? Proses ini mungkin memakan waktu beberapa detik.')) {
            return;
        }

        setIsPlotting(true);
        setPlotLogs([]);

        try {
            const response = await fetch(route('admin.krs.plot-stream'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-XSRF-TOKEN': getCookie('XSRF-TOKEN'),
                },
                body: JSON.stringify({
                    period_id: activePeriodId,
                    batasan_waktu: {
                        aktif: ruleActive,
                        start_slot: ruleStartSlot,
                        end_slot: ruleEndSlot,
                        kode_mps: ruleMkCodes,
                    },
                    batasan_waktu_2: {
                        aktif: rule2Active,
                        start_slot: rule2StartSlot,
                        end_slot: rule2EndSlot,
                        kode_mps: rule2MkCodes,
                    },
                    batasan_waktu_3: {
                        aktif: rule3Active,
                    },
                    batasan_ruangan: {
                        abaikan_jenis: ruleAbaikanJenis,
                        tanpa_ruangan: ruleTanpaRuangan,
                    },
                })
            });

            if (!response.body) throw new Error('No readable stream');

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                
                const parts = buffer.split('\n\n');
                buffer = parts.pop() || '';

                for (const part of parts) {
                    if (part.startsWith('data: ')) {
                        try {
                            const data = JSON.parse(part.substring(6));
                            setPlotLogs(prev => [...prev, data]);
                            if (data.done) {
                                setTimeout(() => {
                                    setIsPlotting(false);
                                    router.reload({ preserveScroll: true });
                                }, 1500);
                            }
                        } catch (e) {
                            console.error('SSE parse error:', e);
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Streaming error', error);
            setIsPlotting(false);
            alert('Terjadi kesalahan saat memproses streaming plotting.');
        }
    };

    const handleResetPlot = () => {
        if (confirm('Reset hanya hasil plot (hapus dosen, ruang, waktu)?')) {
            router.post(route('admin.krs.reset'), { period_id: activePeriodId }, { preserveScroll: true });
        }
    };

    const handleResetAll = () => {
        if (confirm('AWAS! Hapus seluruh hasil plotting BESERTA Master Data Mapel dan Dosen dari database?')) {
            router.post(route('admin.krs.reset_all'), { period_id: activePeriodId }, { preserveScroll: true });
        }
    };

    const importJadwalInputRef = React.useRef<HTMLInputElement>(null);

    const handleImportJadwalClick = () => {
        if (importJadwalInputRef.current) {
            importJadwalInputRef.current.click();
        }
    };

    const handleImportJadwalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !activePeriodId) return;

        if (!confirm('Anda yakin ingin mengupdate plotting jadwal dari file Excel ini?')) {
            e.target.value = '';
            return;
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('period_id', activePeriodId.toString());

        router.post(route('admin.krs.import_jadwal'), formData, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                e.target.value = '';
            },
            onError: (errors) => {
                alert('Gagal mengupload: ' + JSON.stringify(errors));
                e.target.value = '';
            }
        });
    };

    const handleExport = () => {
        if (!plots || plots.length === 0) {
            return alert('Tidak ada data jadwal untuk diexport.');
        }

        const wb = XLSX.utils.book_new();
        const date = new Date().toISOString().split('T')[0];

        // Standard format: Hari, Jam Mulai, Jam Akhir dipisah.
        const header = ["Kode MP", "Nama MP", "Kelas", "SKS", "Pendidik", "Semester", "Hari", "Jam Mulai", "Jam Akhir", "Ruang", "Jenis Ruang", "Status", "Pesan Konflik"];

        if (activeTab === 'mapel' || activeTab === 'main_display') {
            const wsData = [header];
            sortedPlots.forEach(p => {
                const pendidik = [p.dosen?.nama_dosen, p.dosenKedua?.nama_dosen].filter(Boolean).join(' & ') || 'Belum Diplot';
                const ruang = p.ruang ? `${p.ruang.nama_ruang} (${p.ruang.kapasitas || '-'})` : '-';
                const jamMulai = p.waktu_details && p.waktu_details.length ? p.waktu_details[0].jam_mulai : '-';
                const jamAkhir = p.waktu_details && p.waktu_details.length ? p.waktu_details[p.waktu_details.length - 1].jam_selesai : '-';
                wsData.push([
                    p.matakuliah?.kode_mk || '-',
                    p.matakuliah?.nama_mk || '-',
                    p.matakuliah?.kelas || '-',
                    p.matakuliah?.sks || '-',
                    pendidik,
                    p.matakuliah?.semester || '-',
                    p.hari || '-',
                    jamMulai,
                    jamAkhir,
                    ruang,
                    p.matakuliah?.jenis_ruang || '-',
                    p.is_conflict ? 'Konflik' : (p.hari ? 'Aman' : 'Belum Diplot'),
                    p.conflict_message || '-'
                ]);
            });
            const ws = XLSX.utils.aoa_to_sheet(wsData);
            XLSX.utils.book_append_sheet(wb, ws, "Mapel");
            XLSX.writeFile(wb, `Jadwal_Berdasarkan_Mapel_${date}.xlsx`);
        } 
        else if (activeTab === 'dosen') {
            const wsData = [header];
            const groups = new Map();
            dosens.forEach(d => {
                const name = d.nama_dosen?.trim();
                if (name) groups.set(name, { nama_dosen: name, plots: [] });
            });
            groups.set('Belum Ditentukan', { nama_dosen: 'Belum Ditentukan', plots: [] });
            
            plots.forEach(p => {
                let assigned = false;
                const assign = (dosenObj: any) => {
                    const name = dosenObj ? dosenObj.nama_dosen?.trim() : 'Belum Ditentukan';
                    if (!groups.has(name)) groups.set(name, { nama_dosen: name, plots: [] });
                    groups.get(name).plots.push(p);
                    assigned = true;
                };
                if (p.dosen || p.krs_dosen_id) assign(p.dosen || dosens.find((d: any) => d.id === p.krs_dosen_id));
                if (p.dosenKedua || p.krs_dosen_kedua_id) assign(p.dosenKedua || dosens.find((d: any) => d.id === p.krs_dosen_kedua_id));
                if (!assigned) assign(null);
            });

            groups.forEach((g) => {
                if (g.plots.length === 0) {
                    wsData.push(["-", "Belum ada kelas", "-", "-", g.nama_dosen, "-", "-", "-", "-", "-", "-", "-", "-"]);
                } else {
                    g.plots.forEach((p: any) => {
                        const pendidik = [p.dosen?.nama_dosen, p.dosenKedua?.nama_dosen].filter(Boolean).join(' & ') || 'Belum Diplot';
                        const ruang = p.ruang ? `${p.ruang.nama_ruang} (${p.ruang.kapasitas || '-'})` : '-';
                        const jamMulai = p.waktu_details && p.waktu_details.length ? p.waktu_details[0].jam_mulai : '-';
                        const jamAkhir = p.waktu_details && p.waktu_details.length ? p.waktu_details[p.waktu_details.length - 1].jam_selesai : '-';
                        wsData.push([
                            p.matakuliah?.kode_mk || '-',
                            p.matakuliah?.nama_mk || '-',
                            p.matakuliah?.kelas || '-',
                            p.matakuliah?.sks || '-',
                            pendidik,
                            p.matakuliah?.semester || '-',
                            p.hari || '-',
                            jamMulai,
                            jamAkhir,
                            ruang,
                            p.matakuliah?.jenis_ruang || '-',
                            p.is_conflict ? 'Konflik' : (p.hari ? 'Aman' : 'Belum Diplot'),
                            p.conflict_message || '-'
                        ]);
                    });
                }
            });
            const ws = XLSX.utils.aoa_to_sheet(wsData);
            XLSX.utils.book_append_sheet(wb, ws, "Pendidik");
            XLSX.writeFile(wb, `Jadwal_Berdasarkan_Pendidik_${date}.xlsx`);
        }
        else if (activeTab === 'ruang') {
            const wsData = [header];
            const rGroups = new Map();
            ruangs.forEach((r: any) => {
                const name = r.nama_ruang?.trim();
                if (name) rGroups.set(name, { ruang: r, plots: [] });
            });
            rGroups.set('Belum Ditentukan', { ruang: { nama_ruang: 'Belum Ditentukan', kapasitas: '-' }, plots: [] });
            
            plots.forEach(p => {
                const name = p.ruang ? p.ruang.nama_ruang?.trim() : 'Belum Ditentukan';
                if (!rGroups.has(name)) rGroups.set(name, { ruang: { nama_ruang: name, kapasitas: '-' }, plots: [] });
                rGroups.get(name).plots.push(p);
            });

            rGroups.forEach((g) => {
                if (g.plots.length === 0) {
                    wsData.push(["-", "Belum ada kelas", "-", "-", "-", "-", "-", "-", "-", g.ruang.nama_ruang, "-", "-", "-"]);
                } else {
                    const sorted = [...g.plots].sort((a,b) => (a.hari||'').localeCompare(b.hari||''));
                    sorted.forEach(p => {
                        const pendidik = [p.dosen?.nama_dosen, p.dosenKedua?.nama_dosen].filter(Boolean).join(' & ') || 'Belum Diplot';
                        const ruang = p.ruang ? `${p.ruang.nama_ruang} (${p.ruang.kapasitas || '-'})` : '-';
                        const jamMulai = p.waktu_details && p.waktu_details.length ? p.waktu_details[0].jam_mulai : '-';
                        const jamAkhir = p.waktu_details && p.waktu_details.length ? p.waktu_details[p.waktu_details.length - 1].jam_selesai : '-';
                        wsData.push([
                            p.matakuliah?.kode_mk || '-',
                            p.matakuliah?.nama_mk || '-',
                            p.matakuliah?.kelas || '-',
                            p.matakuliah?.sks || '-',
                            pendidik,
                            p.matakuliah?.semester || '-',
                            p.hari || '-',
                            jamMulai,
                            jamAkhir,
                            ruang,
                            p.matakuliah?.jenis_ruang || '-',
                            p.is_conflict ? 'Konflik' : (p.hari ? 'Aman' : 'Belum Diplot'),
                            p.conflict_message || '-'
                        ]);
                    });
                }
            });
            const ws = XLSX.utils.aoa_to_sheet(wsData);
            XLSX.utils.book_append_sheet(wb, ws, "Ruangan");
            XLSX.writeFile(wb, `Jadwal_Berdasarkan_Ruangan_${date}.xlsx`);
        }
        else if (activeTab === 'hari') {
            const wsData = [header];
            const hGroups = new Map();
            const hariList = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
            hariList.forEach(h => hGroups.set(h, []));
            hGroups.set('Belum Diplot', []);

            plots.forEach(p => {
                const h = p.hari || 'Belum Diplot';
                if (!hGroups.has(h)) hGroups.set(h, []);
                hGroups.get(h).push(p);
            });

            hGroups.forEach((plotsArr, hari) => {
                if (plotsArr.length === 0) return;
                const sorted = [...plotsArr].sort((a: any, b: any) => {
                    if (!a.waktu_details?.length) return 1;
                    if (!b.waktu_details?.length) return -1;
                    return a.waktu_details[0].jam_mulai.localeCompare(b.waktu_details[0].jam_mulai);
                });
                sorted.forEach((p: any) => {
                    const pendidik = [p.dosen?.nama_dosen, p.dosenKedua?.nama_dosen].filter(Boolean).join(' & ') || 'Belum Diplot';
                    const ruang = p.ruang ? `${p.ruang.nama_ruang} (${p.ruang.kapasitas || '-'})` : '-';
                    const jamMulai = p.waktu_details && p.waktu_details.length ? p.waktu_details[0].jam_mulai : '-';
                    const jamAkhir = p.waktu_details && p.waktu_details.length ? p.waktu_details[p.waktu_details.length - 1].jam_selesai : '-';
                    wsData.push([
                        p.matakuliah?.kode_mk || '-',
                        p.matakuliah?.nama_mk || '-',
                        p.matakuliah?.kelas || '-',
                        p.matakuliah?.sks || '-',
                        pendidik,
                        p.matakuliah?.semester || '-',
                        hari,
                        jamMulai,
                        jamAkhir,
                        ruang,
                        p.matakuliah?.jenis_ruang || '-',
                        p.is_conflict ? 'Konflik' : (p.hari ? 'Aman' : 'Belum Diplot'),
                        p.conflict_message || '-'
                    ]);
                });
            });

            const ws = XLSX.utils.aoa_to_sheet(wsData);
            XLSX.utils.book_append_sheet(wb, ws, "Hari");
            XLSX.writeFile(wb, `Jadwal_Berdasarkan_Hari_${date}.xlsx`);
        }
    };

    const submitEdit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editPlot) {
            putEdit(route('admin.krs.plot.update', editPlot.id), {
                preserveScroll: true,
                onSuccess: () => {
                    alert('Plot diperbarui');
                    setEditPlot(null);
                },
            });
        }
    };

    

    return (
        <AppLayout breadcrumbs={[
            { title: 'Ploting Jadwal', href: '/admin/krs' },
            { title: 'View Jadwal', href: '#' },
        ]}>
            <Head title="View Jadwal" />

            <div className="mx-auto w-full space-y-6 p-6">
                {/* Header & Navigation */}
                <div className="bg-card text-card-foreground border-border flex items-center justify-between rounded-xl border p-6 shadow-sm">
                    <div>
                        <h1 className="text-2xl font-bold">View Jadwal</h1>
                        <p className="text-muted-foreground text-sm">Anda sedang melihat jadwal akademik.</p>
                    </div>

                    <div className="flex gap-4">
                        <a
                            href={route('admin.krs.index', { period_id: activePeriodId })}
                            className="rounded border border-border px-4 py-2 font-semibold text-foreground hover:bg-muted"
                        >
                            &larr; Kembali ke Dashboard
                        </a>
                        <button
                            onClick={handleExport}
                            className="flex items-center gap-2 rounded bg-green-600 px-4 py-2 font-medium text-white shadow-sm transition-colors hover:bg-green-700"
                        >
                            <Download className="h-4 w-4" /> Export ke Excel
                        </button>
                    </div>
                </div>

                {activePeriodId && (
                    <>
                        {/* Custom Tabs */}
                        <div className="border-border mb-6 flex gap-6 border-b">
                            <a
                                href={route('admin.krs.view', { tab: 'main_display', period_id: activePeriodId })}
                                className={`pb-2 font-semibold transition-colors ${activeTab === 'main_display' ? 'border-primary text-primary border-b-2' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                Main Display
                            </a>
                            <a
                                href={route('admin.krs.view', { tab: 'ruang', period_id: activePeriodId })}
                                className={`pb-2 font-semibold transition-colors ${activeTab === 'ruang' ? 'border-primary text-primary border-b-2' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                Berdasarkan Ruangan
                            </a>
                            <a
                                href={route('admin.krs.view', { tab: 'dosen', period_id: activePeriodId })}
                                className={`pb-2 font-semibold transition-colors ${activeTab === 'dosen' ? 'border-primary text-primary border-b-2' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                Berdasarkan Pendidik
                            </a>
                            <a
                                href={route('admin.krs.view', { tab: 'mapel', period_id: activePeriodId })}
                                className={`pb-2 font-semibold transition-colors ${activeTab === 'mapel' ? 'border-primary text-primary border-b-2' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                Berdasarkan Kelas/Mapel
                            </a>
                        </div>
                        
                        {/* Table or Grouped View */}
                        {activeTab === 'mapel' && (
                            <TabMapel
                                searchQuery={searchQuery}
                                setSearchQuery={setSearchQuery}
                                filterStatus={filterStatus}
                                setFilterStatus={setFilterStatus}
                                sortConfig={sortConfig}
                                requestSort={requestSort}
                                sortedPlots={sortedPlots}
                                setEditPlot={setEditPlot}
                                setEditData={setEditData}
                                setEditTimes={setEditTimes}
                            />
                        )}

                        {activeTab === 'dosen' && (
                            <TabPendidik
                                dosens={dosens}
                                plots={plots}
                                rule3Active={false}
                                setEditPlot={setEditPlot}
                                setEditData={setEditData}
                                setEditTimes={setEditTimes}
                            />
                        )}

                        {activeTab === 'ruang' && (
                            <TabRuangan
                                ruangs={ruangs}
                                plots={plots}
                                waktus={waktus}
                                setEditPlot={setEditPlot}
                                setEditData={setEditData}
                                setEditTimes={setEditTimes}
                            />
                        )}

                        {activeTab === 'main_display' && (
                            <TabMainDisplay
                                plots={plots}
                                waktus={waktus}
                                rule3Active={false}
                                setEditPlot={setEditPlot}
                                setEditData={setEditData}
                                setEditTimes={setEditTimes}
                            />
                        )}
                    </>
                )}
            
                {/* Edit Modal */}
                {editPlot &&
                    typeof document !== 'undefined' &&
                    createPortal(
                        <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/50 p-4">
                            <div className="bg-card text-card-foreground border-border relative flex max-h-[90vh] w-full max-w-4xl flex-col rounded-xl border p-6 shadow-2xl">
                                <h3 className="mb-2 text-xl font-bold">Edit Plot Manual</h3>
                                <p className="text-muted-foreground mb-6 text-sm">
                                    Mapel:{' '}
                                    <span className="text-foreground font-bold">
                                        {editPlot.matakuliah.kode_mk} - {editPlot.matakuliah.nama_mk} ({editPlot.matakuliah.sks} PJ)
                                    </span>
                                </p>

                                <form onSubmit={submitEdit} className="flex-1 overflow-y-auto pr-2">
                                    <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                                        {/* Left Column: Form Inputs */}
                                        <div className="space-y-5">
                                            <div>
                                                <label className="mb-1.5 block text-sm font-medium">Pendidik Utama (Bisa Diubah)</label>
                                                <select
                                                    className="border-input focus:ring-primary w-full rounded-md border bg-white p-2.5 text-slate-900 shadow-sm focus:ring-2 dark:bg-slate-950 dark:text-slate-50"
                                                    value={editData.krs_dosen_id}
                                                    onChange={(e) => setEditData('krs_dosen_id', e.target.value)}
                                                >
                                                    <option value="">-- Pendidik Belum Diplot --</option>
                                                    {uniqueDosensList.map((d: any) => (
                                                        <option key={d.id} value={d.id}>
                                                            {d.nama_dosen}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="mb-1.5 block text-sm font-medium">Pendidik Pendamping (Opsional)</label>
                                                <select
                                                    className="border-input focus:ring-primary w-full rounded-md border bg-white p-2.5 text-slate-900 shadow-sm focus:ring-2 dark:bg-slate-950 dark:text-slate-50"
                                                    value={editData.krs_dosen_kedua_id}
                                                    onChange={(e) => setEditData('krs_dosen_kedua_id', e.target.value)}
                                                >
                                                    <option value="">-- Tidak Ada --</option>
                                                    {uniqueDosensList.map((d: any) => (
                                                        <option key={d.id} value={d.id}>
                                                            {d.nama_dosen}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="mb-1.5 block text-sm font-medium">Ruang</label>
                                                <select
                                                    className="border-input focus:ring-primary w-full rounded-md border bg-white p-2.5 text-slate-900 shadow-sm focus:ring-2 dark:bg-slate-950 dark:text-slate-50"
                                                    value={editData.krs_ruang_id}
                                                    onChange={(e) => setEditData('krs_ruang_id', e.target.value)}
                                                >
                                                    <option value="">-- Pilih Ruang --</option>
                                                    {ruangs.map((r: any) => (
                                                        <option key={r.id} value={r.id}>
                                                            {r.nama_ruang}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="mb-1.5 block text-sm font-medium">Hari</label>
                                                <div className="flex flex-wrap gap-2">
                                                    {['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'].map((hariStr) => {
                                                        const isSelected = editData.hari === hariStr;
                                                        return (
                                                            <button
                                                                key={hariStr}
                                                                type="button"
                                                                onClick={() => setEditData('hari', hariStr)}
                                                                className={`rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${isSelected ? 'bg-primary text-primary-foreground border-primary' : 'bg-background border-input hover:bg-muted text-foreground'}`}
                                                            >
                                                                {hariStr}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                            <div className="pt-2 border-t mt-4">
                                                <label className="flex cursor-pointer items-start gap-2 font-semibold">
                                                    <input
                                                        type="checkbox"
                                                        className="mt-1 h-5 w-5 rounded text-indigo-600 focus:ring-indigo-500"
                                                        checked={editData.is_locked}
                                                        onChange={(e) => setEditData('is_locked', e.target.checked)}
                                                    />
                                                    <div>
                                                        <span>Kunci Jadwal Ini (Lock)</span>
                                                        <p className="text-xs font-normal text-muted-foreground mt-0.5">
                                                            Jika dikunci, jadwal ini tidak akan digeser/direset oleh proses Auto Plotting.
                                                        </p>
                                                    </div>
                                                </label>
                                            </div>
                                        </div>

                                        {/* Right Column: Time Grid */}
                                        <div>
                                            <div className="mb-3 flex items-center justify-between">
                                                <label className="block text-sm font-medium">
                                                    Pilih Waktu (Butuh {editPlot.matakuliah.sks} Slot)
                                                </label>
                                                <span className="text-muted-foreground text-xs">Klik slot untuk memilih</span>
                                            </div>

                                            <div className="grid max-h-[300px] grid-cols-2 gap-2 overflow-y-auto p-1">
                                                {uniqueWaktuStrings.map((timeStr: string) => {
                                                    const [mulai, selesai] = timeStr.split(' - ');
                                                    const matchedWaktu = waktus.find((w: any) => w.jam_mulai === mulai && w.jam_selesai === selesai);

                                                    let takenDosen = false;
                                                    let takenRuang = false;

                                                    if (matchedWaktu && editData.hari) {
                                                        for (const p of plots) {
                                                            if (p.id === editPlot.id) continue;
                                                            if (p.hari !== editData.hari) continue;
                                                            if (!p.krs_waktu_ids || !p.krs_waktu_ids.includes(matchedWaktu.id)) continue;

                                                            if (editData.krs_dosen_id && (p.krs_dosen_id == editData.krs_dosen_id || p.krs_dosen_kedua_id == editData.krs_dosen_id)) takenDosen = true;
                                                            if (editData.krs_dosen_kedua_id && (p.krs_dosen_id == editData.krs_dosen_kedua_id || p.krs_dosen_kedua_id == editData.krs_dosen_kedua_id)) takenDosen = true;
                                                            if (editData.krs_ruang_id && p.krs_ruang_id == editData.krs_ruang_id) takenRuang = true;
                                                        }
                                                    }

                                                    const isSelected = editTimes.includes(timeStr);

                                                    let btnClass = 'border border-input bg-background hover:border-primary/50 text-foreground';
                                                    let isJumatanSlot = false;
                                                    if (editData.hari === 'Jumat') {
                                                        const m = mulai.length === 5 ? mulai + ':00' : mulai;
                                                        const s = selesai.length === 5 ? selesai + ':00' : selesai;
                                                        if (m <= '12:19:00' && s >= '11:41:00') {
                                                            isJumatanSlot = true;
                                                        }
                                                    }

                                                    let btnContent: any = timeStr;
                                                    let isDisabled = false;

                                                    if (isJumatanSlot) {
                                                        btnClass = 'border-red-300 bg-red-100 text-red-800 dark:bg-red-900/40 dark:border-red-800 dark:text-red-300 cursor-not-allowed font-semibold';
                                                        btnContent = (
                                                            <>
                                                                <span className="line-through opacity-70">{timeStr}</span> <br />
                                                                <span className="text-[10px]">Jumatan</span>
                                                            </>
                                                        );
                                                        isDisabled = true;
                                                    } else if (isSelected) {
                                                        if (takenDosen || takenRuang) {
                                                            btnClass = 'border-red-500 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 ring-2 ring-red-500 ring-offset-1';
                                                        } else {
                                                            btnClass = 'border-primary bg-primary text-primary-foreground ring-2 ring-primary ring-offset-1';
                                                        }
                                                    } else if (takenDosen && takenRuang) {
                                                        btnClass = 'border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-900 text-red-600 dark:text-red-400 opacity-60';
                                                    } else if (takenDosen) {
                                                        btnClass = 'border-orange-200 bg-orange-50 dark:bg-orange-950 dark:border-orange-900 text-orange-600 dark:text-orange-400 opacity-70';
                                                    } else if (takenRuang) {
                                                        btnClass = 'border-amber-200 bg-amber-50 dark:bg-amber-950 dark:border-amber-900 text-amber-600 dark:text-amber-400 opacity-70';
                                                    }

                                                    return (
                                                        <button
                                                            key={timeStr}
                                                            type="button"
                                                            onClick={() => {
                                                                if (isDisabled) return;
                                                                let newTimes = [...editTimes];
                                                                const isSelected = newTimes.includes(timeStr);

                                                                if (!isSelected && (takenDosen || takenRuang)) {
                                                                    const msg = [];
                                                                    if (takenDosen) msg.push('Pendidik');
                                                                    if (takenRuang) msg.push('Ruang');
                                                                    if (!confirm(`${msg.join(' dan ')} sudah terpakai pada jam ini.\n\nYakin ingin tetap memilih (menimbulkan bentrok)?`)) {
                                                                        return;
                                                                    }
                                                                }

                                                                if (!isSelected) {
                                                                    if (editPlot?.matakuliah?.sks) {
                                                                        const sks = editPlot.matakuliah.sks;
                                                                        const clickedIndex = uniqueWaktuStrings.indexOf(timeStr);
                                                                        if (clickedIndex !== -1) {
                                                                            const tempTimes = [];
                                                                            let currentIndex = clickedIndex;
                                                                            while (
                                                                                tempTimes.length < sks &&
                                                                                currentIndex < uniqueWaktuStrings.length
                                                                            ) {
                                                                                const tStr = uniqueWaktuStrings[currentIndex];
                                                                                const [mStr, sStr] = tStr.split(' - ');
                                                                                const mt = mStr.length === 5 ? mStr + ':00' : mStr;
                                                                                const st = sStr.length === 5 ? sStr + ':00' : sStr;
                                                                                if (!(editData.hari === 'Jumat' && mt <= '12:19:00' && st >= '11:41:00')) {
                                                                                    tempTimes.push(tStr);
                                                                                }
                                                                                currentIndex++;
                                                                            }
                                                                            newTimes = tempTimes;
                                                                        }
                                                                    } else {
                                                                        newTimes.push(timeStr);
                                                                    }
                                                                } else {
                                                                    newTimes = newTimes.filter((t) => t !== timeStr);
                                                                }

                                                                setEditTimes(newTimes);
                                                                const resolvedIds = newTimes
                                                                    .map((ts) => {
                                                                        const [m, s] = ts.split(' - ');
                                                                        const matched = waktus.find(
                                                                            (w: any) => w.jam_mulai === m && w.jam_selesai === s,
                                                                        );
                                                                        return matched ? matched.id : null;
                                                                    })
                                                                    .filter((id) => id !== null);
                                                                setEditData('krs_waktu_ids', resolvedIds as number[]);
                                                            }}
                                                            disabled={isDisabled}
                                                            className={`rounded-md p-2 text-left text-xs transition-all ${btnClass}`}
                                                        >
                                                            <div className="flex items-center justify-between font-semibold">{btnContent}</div>
                                                            {!isJumatanSlot && (
                                                                <div className="mt-1 text-[10px] leading-tight">
                                                                    {takenDosen && takenRuang
                                                                        ? 'Pendidik & Ruang Terpakai'
                                                                        : takenDosen
                                                                          ? 'Pendidik Mengajar'
                                                                          : takenRuang
                                                                            ? 'Ruang Terpakai'
                                                                            : 'Tersedia'}
                                                                </div>
                                                            )}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="border-border mt-8 flex justify-end gap-2 border-t pt-4">
                                        <button
                                            type="button"
                                            onClick={() => setEditPlot(null)}
                                            className="border-input hover:bg-muted text-foreground rounded border px-4 py-2 font-medium transition-colors"
                                        >
                                            Batal
                                        </button>
                                        <button
                                            type="submit"
                                            className="rounded bg-blue-600 px-6 py-2 font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
                                        >
                                            Simpan Jadwal
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>,
                        document.body,
                    )}
            </div>
        </AppLayout>
    );
}
