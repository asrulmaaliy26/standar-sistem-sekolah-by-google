<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\CalendarEvent;
use App\Models\CalendarEventFile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class CalendarController extends Controller
{
    /**
     * Render the Calendar page via Inertia.
     */
    public function index()
    {
        return Inertia::render('Admin/Calendar');
    }

    /**
     * Render the Calendar Recap page.
     */
    public function recap(Request $request)
    {
        $user = Auth::user();
        if (!$user->hasRole('superadmin')) {
            abort(403, 'Unauthorized action.');
        }

        $year = $request->query('year');
        $query = CalendarEvent::with(['creator:id,name', 'files'])->orderBy('start_at', 'desc');

        if ($year) {
            $query->whereYear('start_at', $year);
        }

        $events = $query->get()->map(function ($ev) {
            return [
                'id'          => $ev->id,
                'title'       => $ev->title,
                'description' => $ev->description,
                'location'    => $ev->location,
                'start_at'    => $ev->start_at->format('Y-m-d H:i'),
                'end_at'      => $ev->end_at->format('Y-m-d H:i'),
                'status'      => $ev->status,
                'created_by'  => $ev->creator?->name ?? 'Admin',
                'files'       => $ev->files->map(function ($file) {
                    return [
                        'id' => $file->id,
                        'name' => $file->file_name,
                        'url' => str_starts_with($file->file_path, 'gdrive:') 
                            ? 'https://drive.google.com/file/d/' . substr($file->file_path, 7) . '/view' 
                            : asset('storage/' . $file->file_path),
                    ];
                }),
            ];
        });

        $availableYears = CalendarEvent::pluck('start_at')
            ->map(fn($date) => $date->format('Y'))
            ->unique()
            ->values()
            ->sortDesc()
            ->toArray();

        return Inertia::render('Admin/CalendarRecap', [
            'events' => $events,
            'availableYears' => $availableYears,
            'currentYear' => $year,
        ]);
    }

    /**
     * API: Fetch events for a given date range.
     * GET /admin/calendar/events?start=...&end=...
     */
    public function fetchEvents(Request $request)
    {
        $start = $request->query('start');
        $end   = $request->query('end');

        $query = CalendarEvent::with(['creator:id,name', 'files'])
            ->where('status', 'approved');

        if ($start) {
            $query->where('end_at', '>=', $start);
        }
        if ($end) {
            $query->where('start_at', '<=', $end);
        }

        $events = $query->orderBy('start_at')->get()->map(function ($ev) {
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
                'files'       => $ev->files->map(function ($file) {
                    return [
                        'id' => $file->id,
                        'name' => $file->file_name,
                        'url' => str_starts_with($file->file_path, 'gdrive:') 
                            ? 'https://drive.google.com/file/d/' . substr($file->file_path, 7) . '/view' 
                            : asset('storage/' . $file->file_path),
                        'description' => $file->description,
                    ];
                }),
            ];
        });

        return response()->json($events);
    }

    /**
     * API: Store a new event.
     * POST /admin/calendar/events
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title'       => 'required|string|max:255',
            'description' => 'nullable|string',
            'location'    => 'nullable|string|max:255',
            'start'       => 'required|date',
            'end'         => 'required|date|after_or_equal:start',
            'color'       => 'nullable|string|max:20',
            'files.*'     => 'nullable|file|max:10240', // max 10MB per file
            'file_descriptions.*' => 'nullable|string',
        ]);

        $user = Auth::user();
        $isAdmin = $user->hasRole('superadmin');
        $isGuru = $user->hasRole('guru');

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

        $this->handleFileUploads($request, $event, $validated);

        return response()->json([
            'status'  => 'success',
            'message' => $isAdmin ? 'Kegiatan berhasil disimpan.' : 'Kegiatan berhasil diajukan, menunggu persetujuan.',
            'id'      => $event->id,
        ]);
    }

    /**
     * API: Update an existing event.
     * PUT /admin/calendar/events/{event}
     * Note: Form method spoofing (POST with _method=PUT) is often used for files.
     */
    public function update(Request $request, CalendarEvent $event)
    {
        $user = Auth::user();
        $isAdmin = $user->hasRole('superadmin');

        if (!$isAdmin && $event->created_by !== $user->id) {
            return response()->json(['status' => 'error', 'message' => 'Tidak diizinkan.'], 403);
        }

        $validated = $request->validate([
            'title'       => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'location'    => 'nullable|string|max:255',
            'start'       => 'sometimes|required|date',
            'end'         => 'sometimes|required|date',
            'color'       => 'nullable|string|max:20',
            'files.*'     => 'nullable|file|max:10240',
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

        $this->handleFileUploads($request, $event, $validated);

        return response()->json(['status' => 'success', 'message' => 'Kegiatan berhasil diperbarui.']);
    }

    /**
     * API: Upload additional files to an existing event.
     * POST /admin/calendar/events/{event}/files
     */
    public function uploadFiles(Request $request, CalendarEvent $event)
    {
        $user = Auth::user();
        $isAdmin = $user->hasRole('superadmin');

        if (!$isAdmin && $event->created_by !== $user->id) {
            return response()->json(['status' => 'error', 'message' => 'Tidak diizinkan.'], 403);
        }

        $validated = $request->validate([
            'files.*' => 'required|file|max:10240',
            'file_descriptions.*' => 'nullable|string',
        ]);

        $this->handleFileUploads($request, $event, $validated);

        return response()->json([
            'status' => 'success',
            'message' => 'File berhasil ditambahkan.'
        ]);
    }

    /**
     * API: Delete an event.
     * DELETE /admin/calendar/events/{event}
     */
    public function destroy(CalendarEvent $event)
    {
        $user = Auth::user();
        $isAdmin = $user->hasRole('superadmin');

        if (!$isAdmin && $event->created_by !== $user->id) {
            return response()->json(['status' => 'error', 'message' => 'Tidak diizinkan.'], 403);
        }

        foreach ($event->files as $file) {
            if (str_starts_with($file->file_path, 'gdrive:')) {
                $driveService = new \App\Services\GoogleDriveService();
                $driveService->deleteFile($user, substr($file->file_path, 7));
            } else {
                Storage::disk('public')->delete($file->file_path);
            }
        }

        $event->delete();

        return response()->json(['status' => 'success', 'message' => 'Kegiatan berhasil dihapus.']);
    }

    /**
     * API: Delete a specific file.
     * DELETE /admin/calendar/files/{file}
     */
    public function deleteFile(CalendarEventFile $file)
    {
        $user = Auth::user();
        $isAdmin = $user->hasRole('superadmin');

        if (!$isAdmin && $file->event->created_by !== $user->id) {
            return response()->json(['status' => 'error', 'message' => 'Tidak diizinkan.'], 403);
        }

        if (str_starts_with($file->file_path, 'gdrive:')) {
            $driveService = new \App\Services\GoogleDriveService();
            $driveService->deleteFile($user, substr($file->file_path, 7));
        } else {
            Storage::disk('public')->delete($file->file_path);
        }
        $file->delete();

        return response()->json(['status' => 'success', 'message' => 'File berhasil dihapus.']);
    }

    private function handleFileUploads(Request $request, CalendarEvent $event, array $validated)
    {
        if ($request->hasFile('files')) {
            $year = date('Y', strtotime($event->start_at));
            $safeTitle = preg_replace('/[^a-zA-Z0-9_\-]/', '_', $event->title);
            $dir = "calendar_files/{$year}/{$safeTitle}";
            $driveService = new \App\Services\GoogleDriveService();

            foreach ($request->file('files') as $index => $file) {
                if ($file->isValid()) {
                    $originalName = $file->getClientOriginalName();
                    
                    $uploadResult = $driveService->uploadFile(
                        Auth::user(),
                        'calendar_files', 
                        $file,
                        time() . '_' . $originalName,
                        "{$year}/{$safeTitle}"
                    );

                    if ($uploadResult) {
                        CalendarEventFile::create([
                            'calendar_event_id' => $event->id,
                            'file_name'         => $originalName,
                            'file_path'         => 'gdrive:' . $uploadResult['drive_file_id'],
                            'description'       => $request->input("file_descriptions.{$index}"),
                        ]);
                    } else {
                        // Fallback ke penyimpanan lokal jika Google Drive gagal
                        $path = $file->storeAs($dir, time() . '_' . $originalName, 'public');
                        CalendarEventFile::create([
                            'calendar_event_id' => $event->id,
                            'file_name'         => $originalName,
                            'file_path'         => $path,
                            'description'       => $request->input("file_descriptions.{$index}"),
                        ]);
                    }
                }
            }
        }
    }
}
