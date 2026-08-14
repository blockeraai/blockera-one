<?php
/**
 * Base config API for Templates Builder type catalogs.
 *
 * @package blockera-one
 */

namespace Blockera\One\Theme\TemplateBuilder;

/**
 * Every template type (archive, single, home, …) ships one catalog class that
 * extends this base and returns its default variant pools. The variant builder
 * helpers only accept keys defined in
 * `packages/blockera-one/schemas/template-builder-catalog.schema.json`, so
 * hand-written pools stay schema-valid by construction.
 */
abstract class AbstractCatalog {

	/**
	 * Optional variant keys accepted by patternVariant().
	 */
	protected const PATTERN_ARGS = array( 'thumbnail', 'placement', 'areas', 'chromeLayout' );

	/**
	 * Optional variant keys accepted by templatePartVariant().
	 */
	protected const TEMPLATE_PART_ARGS = array( 'area', 'tagName', 'thumbnail', 'placement', 'chromeLayout' );

	/**
	 * Template type id this catalog provides pools for (kebab-case).
	 *
	 * @return string
	 */
	abstract public function type(): string;

	/**
	 * Default pools: pool id → ordered Variant[] (first item is the
	 * toggle-on default).
	 *
	 * @return array<string,array<int,array<string,mixed>>>
	 */
	abstract public function pools(): array;

	/**
	 * Build a pattern-kind variant (markup resolved from the core patterns
	 * store at runtime by patternSlug).
	 *
	 * @param string $id           Kebab-case variant id (stamp variant, e.g. section/{poolId}:{id}).
	 * @param string $label        Translated picker label.
	 * @param string $pattern_slug Registered pattern slug (namespace/name).
	 * @param array  $args         Optional keys: thumbnail, placement, areas, chromeLayout.
	 *
	 * @return array<string,mixed>
	 */
	protected function patternVariant( string $id, string $label, string $pattern_slug, array $args = array() ): array {
		$variant = array(
			'id'          => $id,
			'label'       => $label,
			'kind'        => 'pattern',
			'patternSlug' => $pattern_slug,
		);

		return $this->withArgs( $variant, $args, self::PATTERN_ARGS );
	}

	/**
	 * Build a templatePart-kind variant (JS renders a self-closing
	 * core/template-part comment from slug/area/tagName).
	 *
	 * @param string $id    Kebab-case variant id (stamp variant, e.g. section/{poolId}:{id}).
	 * @param string $label Translated picker label.
	 * @param string $slug  Theme template part slug (parts/<slug>.html).
	 * @param array  $args  Optional keys: area, tagName, thumbnail, placement, chromeLayout.
	 *
	 * @return array<string,mixed>
	 */
	protected function templatePartVariant( string $id, string $label, string $slug, array $args = array() ): array {
		$variant = array(
			'id'    => $id,
			'label' => $label,
			'kind'  => 'templatePart',
			'slug'  => $slug,
		);

		return $this->withArgs( $variant, $args, self::TEMPLATE_PART_ARGS );
	}

	/**
	 * Copy only allowed optional keys onto the variant (unknown keys are
	 * silently ignored so a typo cannot leak into the public payload).
	 *
	 * @param array $variant Base variant.
	 * @param array $args    Caller-provided optional keys.
	 * @param array $allowed Whitelisted key names.
	 *
	 * @return array<string,mixed>
	 */
	private function withArgs( array $variant, array $args, array $allowed ): array {
		foreach ( $allowed as $key ) {
			if ( array_key_exists( $key, $args ) ) {
				$variant[ $key ] = $args[ $key ];
			}
		}

		return $variant;
	}
}
