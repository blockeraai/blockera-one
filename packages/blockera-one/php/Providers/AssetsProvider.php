<?php

namespace BlockeraOne\Setup\Providers;

use BlockeraOne\Setup\BlockeraOne;
use Blockera\Bootstrap\Application;
use Blockera\WordPress\AssetsLoader;
use Blockera\Bootstrap\ServiceProvider;
use Illuminate\Contracts\Container\BindingResolutionException;

/**
 * Class AssetsProvider providing all assets.
 *
 * @since 1.0.0
 */
class AssetsProvider extends ServiceProvider {

	/**
	 * Hold handler name.
	 *
	 * @var string $handler the handler name.
	 */
	protected string $handler = '@blockera/blockera-one';

	/**
	 * Register any application services.
	 *
	 * @return void
	 */
	public function register(): void {

		$this->app->bind(
			AssetsLoader::class,
			function ( Application $app ) {

				return new AssetsLoader(
					$app,
					blockera_one_config( 'assets.list' ),
					[
						'root'          => [
							'url'  => blockera_one_config( 'app.root_url' ),
							'path' => blockera_one_config( 'app.root_path' ),
						],
						'debug-mode'    => blockera_one_config( 'app.debug' ),
						'packages-deps' => blockera_one_config( 'assets.with-deps' ),
					]
				);
			}
		);
	}

	/**
	 * Bootstrap any application services.
	 *
	 * @throws BindingResolutionException Binding resolution exception error handle.
	 * @return void
	 */
	public function boot(): void {

		$this->app->make( AssetsLoader::class );

	}

}
