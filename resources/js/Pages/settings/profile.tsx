import { type BreadcrumbItem, type SharedData } from '@/types';
import { Transition } from '@headlessui/react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { FormEventHandler } from 'react';

import DeleteUser from '@/components/delete-user';
import HeadingSmall from '@/components/heading-small';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { School, CheckCircle2, AlertCircle, BookOpen, Home } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Profile settings',
        href: '/settings/profile',
    },
];

type ProfileForm = {
    name: string;
    email: string;
}

export default function Profile({ mustVerifyEmail, status }: { mustVerifyEmail: boolean; status?: string }) {
    const { auth } = usePage<SharedData>().props;

    const { data, setData, patch, errors, processing, recentlySuccessful } = useForm<Required<ProfileForm>>({
        name: auth.user.name,
        email: auth.user.email,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        patch(route('profile.update'), {
            preserveScroll: true,
        });
    };

    const user = auth.user as any;
    const isMurid = user?.roles?.includes('murid') || user?.active_mode?.value === 'murid';

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Profile settings" />

            <SettingsLayout>
                <div className="space-y-6">
                    {/* Data 3 Pilar Santri (Khusus Murid) */}
                    {isMurid && (
                        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-5">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
                                        <School className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-extrabold text-foreground">Identitas Terpadu Santri</h3>
                                        <p className="text-xs text-muted-foreground">3 Dimensi Santri: Sekolah Formal, Asrama Pondok, dan Madrasah Diniyah</p>
                                    </div>
                                </div>

                                <span className={`text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5 ${
                                    user.is_verified
                                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                                        : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                                }`}>
                                    {user.is_verified ? (
                                        <>
                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                            <span>Terverifikasi</span>
                                        </>
                                    ) : (
                                        <>
                                            <AlertCircle className="w-3.5 h-3.5" />
                                            <span>Belum Verifikasi</span>
                                        </>
                                    )}
                                </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                                {/* 1. Formal */}
                                <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/40">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900/50 text-blue-600 flex items-center justify-center">
                                            <School className="w-4 h-4" />
                                        </div>
                                        <span className="text-xs font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wide">1. Kelas Formal</span>
                                    </div>
                                    <p className="text-base font-extrabold text-foreground">
                                        {user.rombel?.name ?? user.rombel_name ?? 'Belum memilih'}
                                    </p>
                                    {!user.rombel_id && (
                                        <button
                                            type="button"
                                            onClick={() => window.dispatchEvent(new CustomEvent('open-rombel-popup'))}
                                            className="mt-2 inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-colors cursor-pointer"
                                        >
                                            <BookOpen className="w-3 h-3" />
                                            Pilih Kelas
                                        </button>
                                    )}
                                </div>

                                {/* 2. Kamar Pondok */}
                                <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 flex items-center justify-center">
                                            <Home className="w-4 h-4" />
                                        </div>
                                        <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wide">2. Kamar Pondok</span>
                                    </div>
                                    <p className="text-base font-extrabold text-foreground">
                                        {user.kamar ? user.kamar.nama_kamar : <span className="text-muted-foreground text-sm font-normal italic">Belum diploting</span>}
                                    </p>
                                    {user.kamar?.gedung && (
                                        <p className="text-xs text-muted-foreground mt-0.5">{user.kamar.gedung}</p>
                                    )}
                                </div>

                                {/* 3. Madin */}
                                <div className="p-4 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/60 dark:border-purple-900/40">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-7 h-7 rounded-lg bg-purple-100 dark:bg-purple-900/50 text-purple-600 flex items-center justify-center">
                                            <BookOpen className="w-4 h-4" />
                                        </div>
                                        <span className="text-xs font-bold text-purple-700 dark:text-purple-300 uppercase tracking-wide">3. Kelas Madin</span>
                                    </div>
                                    <p className="text-base font-extrabold text-foreground">
                                        {user.madin_kelas ? user.madin_kelas.nama_kelas : <span className="text-muted-foreground text-sm font-normal italic">Belum diploting</span>}
                                    </p>
                                    {user.madin_kelas?.tingkat && (
                                        <p className="text-xs text-muted-foreground mt-0.5">Tingkat {user.madin_kelas.tingkat}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    <HeadingSmall title="Profile information" description="Update your name and email address" />

                    <form onSubmit={submit} className="space-y-6">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Name</Label>

                            <Input
                                id="name"
                                className="mt-1 block w-full"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                required
                                autoComplete="off"
                                placeholder="Full name"
                            />

                            <InputError className="mt-2" message={errors.name} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="email">Email address</Label>

                            <Input
                                id="email"
                                type="email"
                                className="mt-1 block w-full"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                required
                                autoComplete="off"
                                placeholder="Email address"
                            />

                            <InputError className="mt-2" message={errors.email} />
                        </div>

                        {mustVerifyEmail && auth.user.email_verified_at === null && (
                            <div>
                                <p className="text-muted-foreground -mt-4 text-sm">
                                    Your email address is unverified.{' '}
                                    <Link
                                        href={route('verification.send')}
                                        method="post"
                                        as="button"
                                        className="text-foreground underline decoration-neutral-300 underline-offset-4 transition-colors duration-300 ease-out hover:decoration-current! dark:decoration-neutral-500"
                                    >
                                        Click here to resend the verification email.
                                    </Link>
                                </p>

                                {status === 'verification-link-sent' && (
                                    <div className="mt-2 text-sm font-medium text-green-600">
                                        A new verification link has been sent to your email address.
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="flex items-center gap-4">
                            <Button disabled={processing}>Save</Button>

                            <Transition
                                show={recentlySuccessful}
                                enter="transition ease-in-out"
                                enterFrom="opacity-0"
                                leave="transition ease-in-out"
                                leaveTo="opacity-0"
                            >
                                <p className="text-sm text-neutral-600">Saved</p>
                            </Transition>
                        </div>
                    </form>
                </div>

                <DeleteUser />
            </SettingsLayout>
        </AppLayout>
    );
}
