import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, ExternalLink, HardDrive, Plus, Mail } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';

interface DriveAccount {
    id: number;
    email: string;
    name: string | null;
    is_active: boolean;
    created_at: string;
}

export default function DriveSettings({ accounts }: { accounts: DriveAccount[] }) {
    const handleDelete = (accountId: number) => {
        if (confirm('Yakin ingin menghapus akun Drive ini? Arsip yang sudah terunggah ke akun ini tidak akan terhapus dari Drive, namun Anda tidak bisa mengunggah file baru ke akun ini lagi.')) {
            router.delete(`/settings/drive/${accountId}`);
        }
    };

    return (
        <AppLayout breadcrumbs={[
            { title: 'Pengaturan', href: '/settings/profile' },
            { title: 'Google Drive', href: '/settings/drive' },
        ]}>
            <Head title="Pengaturan Google Drive" />
            <SettingsLayout>
                <div className="space-y-6">
                    <div>
                        <h3 className="text-lg font-medium">Google Drive Multi-Akun</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                            Tautkan satu atau lebih akun Google Drive untuk digunakan sebagai penyimpanan Arsip. 
                            Setiap kali ada user yang mengunggah arsip, mereka bisa memilih ingin menyimpannya ke Drive mana.
                        </p>
                    </div>

                    <div className="flex items-center gap-4">
                        <Button asChild>
                            <a href="/auth/google/redirect?link_drive=1">
                                <Plus className="w-4 h-4 mr-2" />
                                Tautkan Akun Drive Baru
                            </a>
                        </Button>
                    </div>

                    <div className="grid gap-4 mt-6">
                        {accounts.length === 0 ? (
                            <div className="text-center py-12 bg-muted/30 rounded-xl border border-dashed border-border/60">
                                <HardDrive className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-foreground">Belum ada akun tertaut</h3>
                                <p className="text-sm text-muted-foreground mt-1 mb-4">
                                    Tautkan akun Google Workspace atau Gmail Anda untuk mengaktifkan fitur penyimpanan.
                                </p>
                            </div>
                        ) : (
                            accounts.map((acc) => (
                                <Card key={acc.id} className="overflow-hidden">
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center p-6 gap-4">
                                        <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                                            <HardDrive className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-base font-semibold truncate">{acc.name || 'User Google'}</h4>
                                            <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-0.5">
                                                <Mail className="w-3.5 h-3.5" />
                                                <span className="truncate">{acc.email}</span>
                                            </div>
                                            <div className="text-xs text-muted-foreground mt-2">
                                                Ditautkan: {formatDistanceToNow(new Date(acc.created_at), { addSuffix: true, locale: id })}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 mt-4 sm:mt-0">
                                            <Button variant="outline" size="sm" asChild>
                                                <a href={`https://drive.google.com`} target="_blank" rel="noopener noreferrer">
                                                    <ExternalLink className="w-4 h-4 mr-1.5" />
                                                    Buka Drive
                                                </a>
                                            </Button>
                                            <Button variant="destructive" size="sm" onClick={() => handleDelete(acc.id)}>
                                                <Trash2 className="w-4 h-4 mr-1.5" />
                                                Hapus
                                            </Button>
                                        </div>
                                    </div>
                                </Card>
                            ))
                        )}
                    </div>
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
