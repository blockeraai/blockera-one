<?php

define('BLOCKERA_SB_PATH', trailingslashit($root_dir));
define('BLOCKERA_SB_FILE', BLOCKERA_SB_PATH . 'blockera.php');
define('BLOCKERA_SB_VERSION', $_ENV['VERSION'] ?? getenv('VERSION'));
define('BLOCKERA_SB_URI', trailingslashit(content_url('themes/blockera-one')));
define('BLOCKERA_SB_TESTING', true);

switch_theme('blockera-one');

blockera_add_icon_style_definitions();
blockera_register_core_icon_navigation_hooks();

global $blockera_block_supports;
$blockera_block_supports = blockera_get_available_block_supports();

// Use blockera_load so later theme boot (functions.php → blockera.php) does not re-include hooks.
blockera_load('bootstrap.hooks', BLOCKERA_SB_PATH);
