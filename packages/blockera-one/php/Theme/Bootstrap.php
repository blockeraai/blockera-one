<?php
/**
 * Boots Blockera One theme setup modules.
 *
 * @package blockera-one
 */

namespace Blockera\One\Theme;

/**
 * Main theme bootstrap — registers all theme setup modules.
 */
class Bootstrap {

	/**
	 * Whether theme modules have already been registered.
	 *
	 * @var bool
	 */
	private static bool $booted = false;

	/**
	 * Register theme setup modules (idempotent).
	 *
	 * @return void
	 */
	public static function boot(): void {
		if ( self::$booted ) {
			return;
		}

		self::$booted = true;

		( new EditorStyles() )->register();
		( new FrontStyles() )->register();
		( new BlockStyles() )->register();
		( new Patterns() )->register();
		( new Performance() )->register();
		( new TemplateSettings() )->register();
		( new TemplateBuilder() )->register();
		( new ResetTheme() )->register();
	}
}
