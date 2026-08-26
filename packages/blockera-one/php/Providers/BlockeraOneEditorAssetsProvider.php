<?php

namespace Blockera\One\Providers;

use Blockera\Setup\Providers\EditorAssetsProvider;
use Illuminate\Contracts\Container\BindingResolutionException;

/**
 * Loads theme `*-one` package assets when a companion owns Blockera.
 *
 * Companion plugins already register {@see EditorAssetsProvider}. This provider
 * is an extra loader (unique id) so theme dist files resolve without stealing
 * Pro's fallback path.
 *
 * @since 0.1.0
 */
class BlockeraOneEditorAssetsProvider extends EditorAssetsProvider {

	/**
	 * Store loader identifier.
	 *
	 * @return string the loader identifier.
	 */
	public function getId(): string {

		return 'blockera-one-assets-loader';
	}

	/**
	 * Bootstrap theme `*-one` editor assets.
	 *
	 * Do not call parent::boot() — that would duplicate companion canvas CSS,
	 * generated styles, and l10n. This loader only enqueues theme packages.
	 *
	 * @throws BindingResolutionException Binding resolution exception error handle.
	 * @return void
	 */
	public function boot(): void {

		$this->app->make(
			$this->getId(),
			[
				'assets'     => $this->getAssets(),
				'extra-args' => [
					'fallback'             => $this->getFallbackArgs(),
					'enqueue-block-assets' => true,
					'packages-deps'        => $this->getDependencies(),
				],
			]
		);
	}

	/**
	 * Theme packages matching `*-one` (e.g. blockera-one, blockera-one-styles).
	 *
	 * Unlike Pro, this is not spliced into the companion list: a second loader
	 * is required so AssetsLoader can resolve files from the theme dist.
	 *
	 * @return array the blockera editor assets.
	 */
	protected function getAssets(): array {

		return blockera_one_get_one_named_editor_assets();
	}

	/**
	 * @return string the theme root URL.
	 */
	protected function getURL(): string {

		return blockera_one_get_theme_root_url();
	}

	/**
	 * @return string the theme root PATH.
	 */
	protected function getPATH(): string {

		return blockera_one_get_theme_root_path();
	}

	/**
	 * Get fallback arguments.
	 *
	 * @return array the fallback arguments.
	 */
	protected function getFallbackArgs(): array {

		return [
			'url'        => $this->getURL(),
			'path'       => $this->getPATH(),
			'debug-mode' => $this->getDebugMode(),
		];
	}
}
