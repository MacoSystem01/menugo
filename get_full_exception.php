<?php
$lines = file('storage/logs/laravel.log');
$lastErrorIndex = 0;
for ($i = count($lines) - 1; $i >= 0; $i--) {
    if (strpos($lines[$i], 'local.ERROR:') !== false) {
        $lastErrorIndex = $i;
        break;
    }
}
for ($i = max(0, $lastErrorIndex - 2); $i < min($lastErrorIndex + 50, count($lines)); $i++) {
    echo $lines[$i];
}
