<?php
/**
 * Tests for the Templates Builder PHP catalog.
 *
 * @package blockera-one
 */

namespace Blockera\One\Tests\Theme;

use Blockera\One\Tests\TestCase;
use Blockera\One\Theme\TemplateBuilder;
use Blockera\One\Theme\TemplateBuilder\ArchiveCatalog;
use Blockera\One\Theme\TemplateBuilder\Catalog;
use Blockera\One\Theme\TemplateBuilder\CatalogValidator;

/**
 * Covers Catalog assembly, the child-theme filters, the dev-mode validator
 * (run unconditionally here — runtime gating is dev-mode-only), and the
 * site-editor inline payload.
 */
class TemplateBuilderTest extends TestCase {

	/**
	 * _doing_it_wrong "function" name used by the validator.
	 */
	private const REPORT_AS = 'blockera-one/template-builder/catalog';

	/**
	 * Clean up filters/screen between scenarios.
	 *
	 * @return void
	 */
	public function tear_down(): void {
		remove_all_filters( 'blockera-one/template-builder/catalog' );
		remove_all_filters( 'blockera-one/template-builder/catalog/archive' );
		unset( $GLOBALS['current_screen'] );

		parent::tear_down();
	}

	/**
	 * A minimal valid pattern-kind variant for validator scenarios.
	 *
	 * @param array $overrides Keys to add/replace.
	 *
	 * @return array
	 */
	private function makeVariant( array $overrides = array() ): array {
		return array_merge(
			array(
				'id'          => 'magazine',
				'label'       => 'Magazine',
				'kind'        => 'pattern',
				'patternSlug' => 'my-child/builder-archive-listing-magazine',
			),
			$overrides
		);
	}

	/**
	 * Default catalog must match the shared JSON fixture (consumed by the
	 * JS schema-sync test too) — catches drift when pools are edited.
	 *
	 * @return void
	 */
	public function test_default_catalog_matches_shared_fixture(): void {
		$fixture_file = dirname( __DIR__ ) . '/fixtures/template-builder-catalog.json';
		$this->assertFileExists( $fixture_file );

		$fixture = json_decode(
			str_replace(
				'{{theme_file_uri}}',
				get_template_directory_uri(),
				(string) file_get_contents( $fixture_file )
			),
			true
		);

		$this->assertSame( $fixture, ( new Catalog() )->get() );
	}

	/**
	 * Default pools must pass the schema validator without warnings.
	 *
	 * @return void
	 */
	public function test_default_catalog_is_schema_valid(): void {
		$catalog = array( 'archive' => ( new ArchiveCatalog() )->pools() );

		$this->assertSame( $catalog, ( new CatalogValidator() )->validate( $catalog ) );
	}

	/**
	 * @return void
	 */
	public function test_per_type_filter_can_add_and_mutate_variants(): void {
		add_filter(
			'blockera-one/template-builder/catalog/archive',
			function ( array $pools ): array {
				$pools['posts-listing'][] = $this->makeVariant();
				// Relabel + remove (child-theme style mutations).
				$pools['pagination'][0]['label'] = 'Numbers';
				unset( $pools['posts-listing'][2] ); // grid-3.

				return $pools;
			}
		);

		$catalog = ( new Catalog() )->get();
		$listing = $catalog['archive']['posts-listing'];
		$ids     = array_column( $listing, 'id' );

		$this->assertSame( array( 'list', 'grid-2', 'full-width', 'magazine' ), $ids );
		$this->assertSame( 'Numbers', $catalog['archive']['pagination'][0]['label'] );
	}

	/**
	 * @return void
	 */
	public function test_global_catalog_filter_runs_after_type_filters(): void {
		$seen_types = null;

		add_filter(
			'blockera-one/template-builder/catalog',
			static function ( array $catalog ) use ( &$seen_types ): array {
				$seen_types = array_keys( $catalog );
				unset( $catalog['archive']['footer'] );

				return $catalog;
			}
		);

		$catalog = ( new Catalog() )->get();

		$this->assertSame( array( 'archive' ), $seen_types );
		$this->assertArrayNotHasKey( 'footer', $catalog['archive'] );
	}

	/**
	 * A child-theme filter adding one valid and one invalid variant: the
	 * valid one survives, the invalid one is dropped with a warning.
	 *
	 * The validator is invoked directly — runtime gating is dev-mode-only
	 * (see test_should_validate_matches_dev_mode_gate), so CI validates
	 * unconditionally regardless of the environment's build flag.
	 *
	 * @return void
	 */
	public function test_invalid_filtered_variant_is_dropped_but_valid_survives(): void {
		$this->setExpectedIncorrectUsage( self::REPORT_AS );

		add_filter(
			'blockera-one/template-builder/catalog/archive',
			function ( array $pools ): array {
				$pools['posts-listing'][] = $this->makeVariant();
				// Pattern kind without patternSlug — schema violation.
				$pools['posts-listing'][] = array(
					'id'    => 'broken',
					'label' => 'Broken',
				);

				return $pools;
			}
		);

		$clean = ( new CatalogValidator() )->validate( ( new Catalog() )->get() );
		$ids   = array_column( $clean['archive']['posts-listing'], 'id' );

		$this->assertContains( 'magazine', $ids );
		$this->assertNotContains( 'broken', $ids );
	}

	/**
	 * @return void
	 */
	public function test_validator_drops_variant_with_unknown_key(): void {
		$this->setExpectedIncorrectUsage( self::REPORT_AS );

		$catalog = array(
			'archive' => array(
				'posts-listing' => array(
					$this->makeVariant( array( 'unknownKey' => 'nope' ) ),
					$this->makeVariant( array( 'id' => 'kept' ) ),
				),
			),
		);

		$ids = array_column(
			( new CatalogValidator() )->validate( $catalog )['archive']['posts-listing'],
			'id'
		);

		$this->assertSame( array( 'kept' ), $ids );
	}

	/**
	 * @return void
	 */
	public function test_validator_drops_pattern_variant_missing_pattern_slug(): void {
		$this->setExpectedIncorrectUsage( self::REPORT_AS );

		$variant = $this->makeVariant();
		unset( $variant['patternSlug'] );

		$catalog = array(
			'archive' => array(
				'posts-listing' => array(
					$variant,
					$this->makeVariant( array( 'id' => 'kept' ) ),
				),
			),
		);

		$ids = array_column(
			( new CatalogValidator() )->validate( $catalog )['archive']['posts-listing'],
			'id'
		);

		$this->assertSame( array( 'kept' ), $ids );
	}

	/**
	 * @return void
	 */
	public function test_validator_drops_bad_placement_position(): void {
		$this->setExpectedIncorrectUsage( self::REPORT_AS );

		$catalog = array(
			'archive' => array(
				'posts-listing' => array(
					$this->makeVariant(
						array(
							'placement' => array(
								'relativeTo' => 'main',
								'position'   => 'middle',
							),
						)
					),
					$this->makeVariant( array( 'id' => 'kept' ) ),
				),
			),
		);

		$ids = array_column(
			( new CatalogValidator() )->validate( $catalog )['archive']['posts-listing'],
			'id'
		);

		$this->assertSame( array( 'kept' ), $ids );
	}

	/**
	 * @return void
	 */
	public function test_validator_drops_non_kebab_variant_id(): void {
		$this->setExpectedIncorrectUsage( self::REPORT_AS );

		$catalog = array(
			'archive' => array(
				'posts-listing' => array(
					$this->makeVariant( array( 'id' => 'Bad_Id' ) ),
					$this->makeVariant( array( 'id' => 'kept' ) ),
				),
			),
		);

		$ids = array_column(
			( new CatalogValidator() )->validate( $catalog )['archive']['posts-listing'],
			'id'
		);

		$this->assertSame( array( 'kept' ), $ids );
	}

	/**
	 * @return void
	 */
	public function test_validator_drops_duplicate_variant_id_in_pool(): void {
		$this->setExpectedIncorrectUsage( self::REPORT_AS );

		$catalog = array(
			'archive' => array(
				'posts-listing' => array(
					$this->makeVariant( array( 'label' => 'First' ) ),
					$this->makeVariant( array( 'label' => 'Duplicate' ) ),
				),
			),
		);

		$clean = ( new CatalogValidator() )->validate( $catalog )['archive']['posts-listing'];

		$this->assertCount( 1, $clean );
		$this->assertSame( 'First', $clean[0]['label'] );
	}

	/**
	 * @return void
	 */
	public function test_validator_removes_pool_left_empty_after_drops(): void {
		$this->setExpectedIncorrectUsage( self::REPORT_AS );

		$catalog = array(
			'archive' => array(
				'posts-listing' => array(
					array(
						'id'    => 'broken',
						'label' => 'Broken',
					),
				),
				'pagination'    => array( $this->makeVariant() ),
			),
		);

		$clean = ( new CatalogValidator() )->validate( $catalog );

		$this->assertArrayNotHasKey( 'posts-listing', $clean['archive'] );
		$this->assertArrayHasKey( 'pagination', $clean['archive'] );
	}

	/**
	 * The runtime gate follows the environment: on when the repo build flag
	 * is `development` (theme checkout), otherwise deferred to the
	 * WordPress `wp_is_development_mode( 'theme' )` opt-in — never on for
	 * plain production sites.
	 *
	 * @return void
	 */
	public function test_should_validate_matches_dev_mode_gate(): void {
		if ( defined( 'BLOCKERA_SB_MODE' ) && 'development' === BLOCKERA_SB_MODE ) {
			$this->assertTrue( Catalog::shouldValidate() );

			return;
		}

		$this->assertSame( wp_is_development_mode( 'theme' ), Catalog::shouldValidate() );
	}

	/**
	 * @return void
	 */
	public function test_enqueue_prints_payload_on_site_editor_screen_only(): void {
		$module = new TemplateBuilder();

		// Not the site editor — nothing printed.
		set_current_screen( 'edit-post' );
		$module->enqueueCatalog();
		$this->assertFalse( wp_scripts()->get_data( 'wp-core-data', 'before' ) );

		set_current_screen( 'site-editor' );
		$module->enqueueCatalog();

		$before = wp_scripts()->get_data( 'wp-core-data', 'before' );
		$this->assertIsArray( $before );

		$inline = implode( '', array_filter( $before ) );
		$this->assertStringContainsString( 'window.blockeraOneTemplateBuilder', $inline );
		$this->assertStringContainsString( '"catalog"', $inline );
		$this->assertStringContainsString( 'builder-archive-listing-list', $inline );
	}
}
