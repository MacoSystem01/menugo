<?php
$file = 'storage/logs/laravel.log';
$lines = file($file);
echo implode('', array_slice($lines, -20));
