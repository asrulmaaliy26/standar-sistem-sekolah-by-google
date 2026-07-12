<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AppSetting extends Model
{
    protected $table = 'app_settings';

    protected $fillable = ['key', 'value', 'description'];

    /**
     * Helper statis: ambil nilai setting berdasarkan key.
     */
    public static function get(string $key, mixed $default = null): mixed
    {
        $setting = static::where('key', $key)->first();
        return $setting ? $setting->value : $default;
    }

    /**
     * Helper statis: set / upsert nilai setting.
     */
    public static function set(string $key, mixed $value): void
    {
        static::updateOrCreate(
            ['key' => $key],
            ['value' => $value]
        );
    }

    /**
     * Cek apakah kartu santri aktif.
     */
    public static function kartuSantriAktif(): bool
    {
        return (bool) static::get('kartu_santri_aktif', '1');
    }
}
