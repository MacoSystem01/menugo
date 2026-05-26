<?php

namespace App\Services;

use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * LogoProcessor — Optimiza imágenes de logos para el Slider de Menugo.
 *
 * Pipeline:
 *  1. Carga la imagen (JPEG, PNG, WebP, GIF)
 *  2. Auto-recorta márgenes transparentes o blancos
 *  3. Coloca el logo centrado sobre un fondo blanco cuadrado (400×400 px)
 *  4. [AI-enhanced] Aplica nitidez + realce de contraste
 *  5. Guarda como PNG optimizado en el disco 'public'
 *
 * Nota PHP 8.2+: imagedestroy() está deprecado; GdImage se gestiona mediante
 * el GC de PHP. Usamos unset() explícito para liberar memoria antes de que
 * el scope lo haga automáticamente.
 *
 * @throws \RuntimeException si la extensión GD no está disponible
 */
class LogoProcessor
{
    // Tamaño final cuadrado (px)
    private const OUTPUT_SIZE = 400;

    // Porcentaje del área que ocupa el logo (el resto es margen)
    private const FILL_RATIO = 0.78;

    // Calidad de compresión PNG (0=ninguna … 9=máxima)
    private const PNG_COMPRESSION = 7;

    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Procesa un logo que ya está almacenado en el disco 'public'.
     * Sobrescribe el archivo original (puede cambiar la extensión a .png).
     *
     * @param  string $diskPath   Ruta relativa en disk('public'), p.ej. "slider-logos/abc.jpg"
     * @param  bool   $aiEnhanced Aplicar nitidez/contraste adicional
     * @return string             Nueva ruta relativa (puede diferir si la extensión cambió)
     */
    public static function processInPlace(string $diskPath, bool $aiEnhanced = false): string
    {
        $disk    = Storage::disk('public');
        $content = $disk->get($diskPath);

        [$gd, $srcW, $srcH] = self::loadGd($content);
        $gd = self::autoCrop($gd, $srcW, $srcH);
        if ($aiEnhanced) {
            $gd = self::applyAiEnhancements($gd);
        }
        $output = self::buildSquare($gd);
        unset($gd);

        $pngPath = preg_replace('/\.[^.]+$/', '.png', $diskPath);
        $disk->put($pngPath, self::encodePng($output));
        unset($output);

        // Borrar original si la ruta cambió (extensión diferente)
        if ($pngPath !== $diskPath) {
            $disk->delete($diskPath);
        }

        return $pngPath;
    }

    /**
     * Toma una imagen de una ruta origen (advertising-requests/) y genera un
     * logo listo para el slider, guardándolo en "slider-logos/".
     *
     * @param  string $sourceDiskPath Ruta de la imagen original
     * @param  bool   $aiEnhanced
     * @return string                 Ruta del logo procesado en "slider-logos/"
     */
    public static function processForSlider(string $sourceDiskPath, bool $aiEnhanced = false): string
    {
        $disk    = Storage::disk('public');
        $content = $disk->get($sourceDiskPath);

        [$gd, $srcW, $srcH] = self::loadGd($content);
        $gd = self::autoCrop($gd, $srcW, $srcH);
        if ($aiEnhanced) {
            $gd = self::applyAiEnhancements($gd);
        }
        $output = self::buildSquare($gd);
        unset($gd);

        $destPath = 'slider-logos/' . Str::uuid() . '.png';
        $disk->put($destPath, self::encodePng($output));
        unset($output);

        return $destPath;
    }

    // ── Helpers privados ──────────────────────────────────────────────────────

    /**
     * Carga cualquier formato de imagen y retorna [GdImage, ancho, alto].
     */
    private static function loadGd(string $content): array
    {
        $gd = imagecreatefromstring($content);

        if ($gd === false) {
            throw new \RuntimeException('No se pudo leer la imagen. Asegúrate de que sea JPG, PNG o WebP.');
        }

        // Convertir a truecolor si es paleta, preservando el canal alpha
        if (imageistruecolor($gd) === false) {
            $tc = imagecreatetruecolor(imagesx($gd), imagesy($gd));
            imagealphablending($tc, false);
            imagesavealpha($tc, true);
            // Rellenar con transparencia para que imagecopy transfiera el alpha de paleta
            $transparent = imagecolorallocatealpha($tc, 255, 255, 255, 127);
            imagefill($tc, 0, 0, $transparent);
            imagecopy($tc, $gd, 0, 0, 0, 0, imagesx($gd), imagesy($gd));
            unset($gd);
            $gd = $tc;
        }

        return [$gd, imagesx($gd), imagesy($gd)];
    }

    /**
     * Auto-recorta bordes blancos o transparentes para dejar solo el logo.
     */
    private static function autoCrop(\GdImage $src, int $w, int $h): \GdImage
    {
        // Intentar recorte automático por contenido
        $cropped = imagecropauto($src, IMG_CROP_DEFAULT);

        if ($cropped !== false && imagesx($cropped) > 10 && imagesy($cropped) > 10) {
            unset($src);
            return $cropped;
        }

        // Fallback: recorte manual de bordes blancos/semitransparentes
        $tolerance = 245; // 0–255 (blanco = 255)
        $left   = 0;
        $top    = 0;
        $right  = $w - 1;
        $bottom = $h - 1;

        /**
         * En imágenes truecolor, imagecolorat() devuelve: (alpha << 24) | (R << 16) | (G << 8) | B
         * donde alpha: 0=opaco, 127=totalmente transparente.
         * Pixels con alpha > 64 se tratan como fondo (transparente) y se ignoran.
         */

        // Izquierda
        for ($x = 0; $x < $w; $x++) {
            for ($y = 0; $y < $h; $y++) {
                $rgb   = imagecolorat($src, $x, $y);
                $alpha = ($rgb >> 24) & 0x7F;
                if ($alpha > 64) continue;        // pixel mayormente transparente → fondo
                $r = ($rgb >> 16) & 0xFF;
                $g = ($rgb >> 8)  & 0xFF;
                $b =  $rgb        & 0xFF;
                if ($r < $tolerance || $g < $tolerance || $b < $tolerance) {
                    $left = $x; break 2;
                }
            }
        }
        // Derecha
        for ($x = $w - 1; $x >= $left; $x--) {
            for ($y = 0; $y < $h; $y++) {
                $rgb   = imagecolorat($src, $x, $y);
                $alpha = ($rgb >> 24) & 0x7F;
                if ($alpha > 64) continue;
                $r = ($rgb >> 16) & 0xFF;
                $g = ($rgb >> 8)  & 0xFF;
                $b =  $rgb        & 0xFF;
                if ($r < $tolerance || $g < $tolerance || $b < $tolerance) {
                    $right = $x; break 2;
                }
            }
        }
        // Arriba
        for ($y = 0; $y < $h; $y++) {
            for ($x = $left; $x <= $right; $x++) {
                $rgb   = imagecolorat($src, $x, $y);
                $alpha = ($rgb >> 24) & 0x7F;
                if ($alpha > 64) continue;
                $r = ($rgb >> 16) & 0xFF;
                $g = ($rgb >> 8)  & 0xFF;
                $b =  $rgb        & 0xFF;
                if ($r < $tolerance || $g < $tolerance || $b < $tolerance) {
                    $top = $y; break 2;
                }
            }
        }
        // Abajo
        for ($y = $h - 1; $y >= $top; $y--) {
            for ($x = $left; $x <= $right; $x++) {
                $rgb   = imagecolorat($src, $x, $y);
                $alpha = ($rgb >> 24) & 0x7F;
                if ($alpha > 64) continue;
                $r = ($rgb >> 16) & 0xFF;
                $g = ($rgb >> 8)  & 0xFF;
                $b =  $rgb        & 0xFF;
                if ($r < $tolerance || $g < $tolerance || $b < $tolerance) {
                    $bottom = $y; break 2;
                }
            }
        }

        $cropW = $right  - $left + 1;
        $cropH = $bottom - $top  + 1;

        if ($cropW < 10 || $cropH < 10) {
            return $src; // Si el resultado es demasiado pequeño, no recortar
        }

        $cropped = imagecreatetruecolor($cropW, $cropH);
        imagecopy($cropped, $src, 0, 0, $left, $top, $cropW, $cropH);
        unset($src);

        return $cropped;
    }

    /**
     * Aplica nitidez y realce de contraste (modo AI-enhanced).
     */
    private static function applyAiEnhancements(\GdImage $gd): \GdImage
    {
        // Matriz de nitidez (unsharp mask suave)
        $sharpen = [
            [ 0, -1,  0],
            [-1,  9, -1],
            [ 0, -1,  0],
        ];
        imageconvolution($gd, $sharpen, 5, 0);

        // Ligero realce de contraste
        imagefilter($gd, IMG_FILTER_CONTRAST, -8);

        // Ligero brillo para logos que quedan oscuros tras el recorte
        imagefilter($gd, IMG_FILTER_BRIGHTNESS, 5);

        return $gd;
    }

    /**
     * Crea el canvas cuadrado final con fondo blanco y el logo centrado.
     */
    private static function buildSquare(\GdImage $src): \GdImage
    {
        $size  = self::OUTPUT_SIZE;
        $srcW  = imagesx($src);
        $srcH  = imagesy($src);

        // Calcular dimensiones proporcionales dentro del área de fill
        $maxFill = (int)($size * self::FILL_RATIO);
        $ratio   = min($maxFill / $srcW, $maxFill / $srcH);
        $dstW    = (int)($srcW * $ratio);
        $dstH    = (int)($srcH * $ratio);

        $offsetX = (int)(($size - $dstW) / 2);
        $offsetY = (int)(($size - $dstH) / 2);

        $canvas = imagecreatetruecolor($size, $size);

        // Fondo blanco puro
        $white = imagecolorallocate($canvas, 255, 255, 255);
        imagefill($canvas, 0, 0, $white);

        // Resampling de alta calidad
        imagecopyresampled($canvas, $src, $offsetX, $offsetY, 0, 0, $dstW, $dstH, $srcW, $srcH);

        return $canvas;
    }

    /**
     * Codifica GdImage como PNG en memoria y retorna el string binario.
     * Usa archivo temporal porque imagepng() con output buffer requiere ob_start().
     */
    private static function encodePng(\GdImage $gd): string
    {
        $tmp  = tempnam(sys_get_temp_dir(), 'logo_');
        imagepng($gd, $tmp, self::PNG_COMPRESSION);
        $data = file_get_contents($tmp);
        unlink($tmp);
        return $data;
    }
}
