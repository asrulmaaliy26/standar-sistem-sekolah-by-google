<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\CalendarEvent;
use App\Models\CalendarEventFile;
use App\Services\GoogleDriveService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class CalendarController extends Controller
{
    /**
     * GoogleDriveService di-inject melalui constructor (Dependency Injection),
     * bukan di-instantiate langsung di dalam method, sehingga mudah di-mock saat testing.
     */
    public function __construct(private readonly GoogleDriveService $driveService)
    {
    }

    /**
     * Render halaman Calendar via Inertia.
     */
    public function index()
    {
        return Inertia::render('Admin/Calendar');
    }

    /**
     * Render halaman Rekap Kalender (khusus superadmin).
     */
    public function recap(Request $request)
    {
        $user = Auth::user();
        if (!$user->hasRole('superadmin')) {
            abort(403, 'Unauthorized action.');
        }

        $year  = $request->query('year');
        $query = CalendarEvent::with(['creator:id,name', 'files'])->orderBy('start_at', 'desc');

        if ($year) {
            $query->whereYear('start_at', $year);
        }

        $events = $query->get()->map(fn($ev) => $this->formatEventForRecap($ev));

        $availableYears = CalendarEvent::pluck('start_at')
            ->map(fn($date) => $date->format('Y'))
            ->unique()
            ->values()
            ->sortDesc()
            ->toArray();

        return Inertia::render('Admin/CalendarRecap', [
            'events'         => $events,
            'availableYears' => $availableYears,
            'currentYear'    => $year,
        ]);
    }

    /**
     * API: Ambil event untuk rentang tanggal tertentu.
     * GET /calendar/events?start=...&end=...
     */
    public function fetchEvents(Request $request)
    {
        $start = $request->query('start');
        $end   = $request->query('end');

        $query = CalendarEvent::with(['creator:id,name', 'files'])
            ->where('status', 'approved');

        if ($start) $query->where('end_at', '>=', $start);
        if ($end)   $query->where('start_at', '<=', $end);

        $events = $query->orderBy('start_at')->get()->map(fn($ev) => $this->formatEventForCalendar($ev));

        return response()->json($events);
    }

    /**
     * API: Buat event baru.
     * POST /calendar/events
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title'                => 'required|string|max:255',
            'description'          => 'nullable|string',
            'location'             => 'nullable|string|max:255',
            'start'                => 'required|date',
            'end'                  => 'required|date|after_or_equal:start',
            'color'                => 'nullable|string|max:20',
            'files.*'              => 'nullable|file|max:10240', // max 10 MB per file
            'file_descriptions.*'  => 'nullable|string',
        ]);

        $user    = Auth::user();
        $isAdmin = $user->hasRole('superadmin');
        $isGuru  = $user->hasRole('guru');

        if (!$isAdmin && !$isGuru) {
            return response()->json(['status' => 'error', 'message' => 'Tidak diizinkan membuat kegiatan.'], 403);
        }

        $event = CalendarEvent::create([
            'title'       => $validated['title'],
            'description' => $validated['description'] ?? null,
            'location'    => $validated['location'] ?? null,
            'start_at'    => $validated['start'],
            'end_at'      => $validated['end'],
            'color'       => $validated['color'] ?? '#4e73df',
            'status'      => $isAdmin ? 'approved' : 'pending',
            'created_by'  => $user->id,
        ]);

        $this->handleFileUploads($request, $event);

        return response()->json([
            'status'  => 'success',
            'message' => $isAdmin ? 'Kegiatan berhasil disimpan.' : 'Kegiatan berhasil diajukan, menunggu persetujuan.',
            'id'      => $event->id,
        ]);
    }

    /**
     * API: Perbarui event yang sudah ada.
     * PUT /calendar/events/{event}
     */
    public function update(Request $request, CalendarEvent $event)
    {
        $user    = Auth::user();
        $isAdmin = $user->hasRole('superadmin');

        if (!$isAdmin && $event->created_by !== $user->id) {
            return response()->json(['status' => 'error', 'message' => 'Tidak diizinkan.'], 403);
        }

        $validated = $request->validate([
            'title'               => 'sometimes|required|string|max:255',
            'description'         => 'nullable|string',
            'location'            => 'nullable|string|max:255',
            'start'               => 'sometimes|required|date',
            'end'                 => 'sometimes|required|date',
            'color'               => 'nullable|string|max:20',
            'files.*'             => 'nullable|file|max:10240',
            'file_descriptions.*' => 'nullable|string',
        ]);

        $event->update([
            'title'       => $validated['title']       ?? $event->title,
            'description' => $validated['description'] ?? $event->description,
            'location'    => $validated['location']    ?? $event->location,
            'start_at'    => $validated['start']       ?? $event->start_at,
            'end_at'      => $validated['end']         ?? $event->end_at,
            'color'       => $validated['color']       ?? $event->color,
        ]);

        $this->handleFileUploads($request, $event);

        return response()->json(['status' => 'success', 'message' => 'Kegiatan berhasil diperbarui.']);
    }

    /**
     * API: Upload file tambahan ke event yang sudah ada.
     * POST /calendar/events/{event}/files
     */
    public function uploadFiles(Request $request, CalendarEvent $event)
    {
        $user    = Auth::user();
        $isAdmin = $user->hasRole('superadmin');

        if (!$isAdmin && $event->created_by !== $user->id) {
            return response()->json(['status' => 'error', 'message' => 'Tidak diizinkan.'], 403);
        }

        $request->validate([
            'files.*'             => 'required|file|max:10240',
            'file_descriptions.*' => 'nullable|string',
        ]);

        $this->handleFileUploads($request, $event);

        return response()->json(['status' => 'success', 'message' => 'File berhasil ditambahkan.']);
    }

    /**
     * API: Hapus event beserta seluruh file-nya.
     * DELETE /calendar/events/{event}
     */
    public function destroy(CalendarEvent $event)
    {
        $user    = Auth::user();
        $isAdmin = $user->hasRole('superadmin');

        if (!$isAdmin && $event->created_by !== $user->id) {
            return response()->json(['status' => 'error', 'message' => 'Tidak diizinkan.'], 403);
        }

        foreach ($event->files as $file) {
            $this->removeFileFromStorage($file);
        }

        $event->delete();

        return response()->json(['status' => 'success', 'message' => 'Kegiatan berhasil dihapus.']);
    }

    /**
     * API: Hapus satu file dari event.
     * DELETE /calendar/files/{file}
     */
    public function deleteFile(CalendarEventFile $file)
    {
        // Saat dipanggil via route (argumen dari model binding),
        // $file adalah instance CalendarEventFile. Perlu cek otorisasi.
        $user    = Auth::user();
        $isAdmin = $user->hasRole('superadmin');

        if (!$isAdmin && $file->event->created_by !== $user->id) {
            return response()->json(['status' => 'error', 'message' => 'Tidak diizinkan.'], 403);
        }

        $this->removeFileFromStorage($file);
        $file->delete();

        return response()->json(['status' => 'success', 'message' => 'File berhasil dihapus.']);
    }

    // =========================================================================
    // Private Helpers
    // =========================================================================

    /**
     * Format data event untuk endpoint rekap (Admin/CalendarRecap).
     * Gunakan accessor $file->url dari model CalendarEventFile.
     */
    private function formatEventForRecap(CalendarEvent $ev): array
    {
        return [
            'id'          => $ev->id,
            'title'       => $ev->title,
            'description' => $ev->description,
            'location'    => $ev->location,
            'start_at'    => $ev->start_at->format('Y-m-d H:i'),
            'end_at'      => $ev->end_at->format('Y-m-d H:i'),
            'status'      => $ev->status,
            'created_by'  => $ev->creator?->name ?? 'Admin',
            'files'       => $ev->files->map(fn($file) => [
                'id'   => $file->id,
                'name' => $file->file_name,
                'url'  => $file->url,   // menggunakan accessor model
            ]),
        ];
    }

    /**
     * Format data event untuk endpoint calendar (FullCalendar).
     * Gunakan accessor $file->url dari model CalendarEventFile.
     */
    private function formatEventForCalendar(CalendarEvent $ev): array
    {
        return [
            'id'          => $ev->id,
            'title'       => $ev->title,
            'description' => $ev->description,
            'tempat'      => $ev->location,
            'start'       => $ev->start_at->format('Y-m-d\TH:i:s'),
            'end'         => $ev->end_at->format('Y-m-d\TH:i:s'),
            'realStart'   => $ev->start_at->format('Y-m-d\TH:i:s'),
            'realEnd'     => $ev->end_at->format('Y-m-d\TH:i:s'),
            'color'       => $ev->color,
            'status'      => $ev->status,
            'created_by'  => $ev->creator?->name ?? 'Admin',
            'files'       => $ev->files->map(fn($file) => [
                'id'          => $file->id,
                'name'        => $file->file_name,
                'url'         => $file->url,   // menggunakan accessor model
                'description' => $file->description,
            ]),
        ];
    }

    /**
     * Upload seluruh file dari request ke Google Drive (dengan fallback ke storage lokal).
     * Dipanggil oleh store(), update(), dan uploadFiles().
     */
    private function handleFileUploads(Request $request, CalendarEvent $event): void
    {
        if (!$request->hasFile('files')) {
            return;
        }

        $year      = date('Y', strtotime($event->start_at));
        $safeTitle = preg_replace('/[^a-zA-Z0-9_\-]/', '_', $event->title);
        $dir       = "calendar_files/{$year}/{$safeTitle}";

        foreach ($request->file('files') as $index => $file) {
            if (!$file->isValid()) continue;

            $originalName = $file->getClientOriginalName();
            $storedName   = time() . '_' . $originalName;

            $uploadResult = $this->driveService->uploadFile(
                Auth::user(),
                'calendar_files',
                $file,
                $storedName,
                "{$year}/{$safeTitle}"
            );

            if ($uploadResult) {
                // Simpan di Google Drive
                CalendarEventFile::create([
                    'calendar_event_id' => $event->id,
                    'file_name'         => $originalName,
                    'file_path'         => 'gdrive:' . $uploadResult['drive_file_id'],
                    'description'       => $request->input("file_descriptions.{$index}"),
                ]);
            } else {
                // Fallback ke penyimpanan lokal jika Google Drive gagal
                $path = $file->storeAs($dir, $storedName, 'public');
                CalendarEventFile::create([
                    'calendar_event_id' => $event->id,
                    'file_name'         => $originalName,
                    'file_path'         => $path,
                    'description'       => $request->input("file_descriptions.{$index}"),
                ]);
            }
        }
    }

    /**
     * Hapus file dari Google Drive atau storage lokal.
     * Method internal ini hanya mengurus storage — bukan model deletion.
     */
    private function removeFileFromStorage(CalendarEventFile $file): void
    {
        if (str_starts_with($file->file_path, 'gdrive:')) {
            $this->driveService->deleteFile(Auth::user(), substr($file->file_path, 7));
        } else {
            Storage::disk('public')->delete($file->file_path);
        }
    }
}
