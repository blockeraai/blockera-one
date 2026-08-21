<?php
/**
 * Dev-mode-only Templates Builder catalog validator.
 *
 * @package blockera-one
 */

namespace Blockera\One\Theme\TemplateBuilder;

/**
 * Validates a catalog payload against
 * `packages/blockera-one/schemas/template-builder-catalog.schema.json` using
 * core's rest_validate_value_from_schema() (no extra validator dependency).
 *
 * Invalid variants are reported via _doing_it_wrong() and dropped so the
 * panel never renders a broken tile; a pool left empty after drops is
 * removed. The class is directly callable so tests/CI can run it regardless
 * of the runtime dev-mode gate in Catalog.
 */
class CatalogValidator {

	/**
	 * Hook name used in _doing_it_wrong() reports.
	 */
	private const REPORT_AS = 'blockera-one/template-builder/catalog';

	/**
	 * Kebab-case key pattern (mirrors the schema patternProperties keys).
	 */
	private const KEBAB_PATTERN = '/^[a-z0-9]+(?:-[a-z0-9]+)*$/';

	/**
	 * Decoded variant schema (oneOf pattern/templatePart), lazily loaded and
	 * shared across instances — the schema file never changes at runtime.
	 *
	 * @var array|null
	 */
	private static ?array $variant_schema = null;

	/**
	 * Validate and sanitize a full catalog payload.
	 *
	 * @param array $catalog Assembled catalog (after filters).
	 *
	 * @return array<string,array<string,array<int,array<string,mixed>>>> Sanitized catalog.
	 */
	public function validate( array $catalog ): array {
		$variant_schema = $this->getVariantSchema();

		if ( null === $variant_schema ) {
			// Schema file unreadable — report once, keep the payload as-is.
			$this->report( 'Could not load template-builder-catalog.schema.json; catalog validation skipped.' );

			return $catalog;
		}

		$clean = array();

		foreach ( $catalog as $type => $pools ) {
			// PHP casts numeric string keys (e.g. type id `404`) to integers.
			$type = (string) $type;
			if ( ! preg_match( self::KEBAB_PATTERN, $type ) || ! is_array( $pools ) ) {
				$this->report( sprintf( 'Catalog type "%s" must be a kebab-case key mapping to a pools array; dropped.', $type ) );
				continue;
			}

			$clean_pools = array();

			foreach ( $pools as $pool_id => $variants ) {
				$pool_id = (string) $pool_id;
				if ( ! preg_match( self::KEBAB_PATTERN, $pool_id ) || ! is_array( $variants ) ) {
					$this->report( sprintf( 'Pool "%s" in catalog type "%s" must be a kebab-case key mapping to a variant list; dropped.', $pool_id, $type ) );
					continue;
				}

				$clean_variants = $this->validatePool( $type, $pool_id, array_values( $variants ), $variant_schema );

				if ( array() === $clean_variants ) {
					$this->report( sprintf( 'Pool "%s" in catalog type "%s" has no valid variants left; pool removed.', $pool_id, $type ) );
					continue;
				}

				$clean_pools[ $pool_id ] = $clean_variants;
			}

			$clean[ $type ] = $clean_pools;
		}

		return $clean;
	}

	/**
	 * Validate one pool's variants: per-variant schema check + duplicate ids.
	 *
	 * @param string $type           Catalog type id (for reporting).
	 * @param string $pool_id        Pool id (for reporting).
	 * @param array  $variants       Variant list.
	 * @param array  $variant_schema oneOf schema for a single variant.
	 *
	 * @return array<int,array<string,mixed>>
	 */
	private function validatePool( string $type, string $pool_id, array $variants, array $variant_schema ): array {
		$clean    = array();
		$seen_ids = array();

		foreach ( $variants as $index => $variant ) {
			$param = sprintf( 'catalog.%s.%s[%d]', $type, $pool_id, $index );

			if ( ! is_array( $variant ) ) {
				$this->report( sprintf( '%s must be a variant array; dropped.', $param ) );
				continue;
			}

			$result = rest_validate_value_from_schema( $variant, $variant_schema, $param );

			if ( is_wp_error( $result ) ) {
				$this->report(
					sprintf(
						'Variant "%s" (%s) failed schema validation and was dropped: %s',
						isset( $variant['id'] ) && is_string( $variant['id'] ) ? $variant['id'] : '?',
						$param,
						$result->get_error_message()
					)
				);
				continue;
			}

			if ( isset( $seen_ids[ $variant['id'] ] ) ) {
				$this->report( sprintf( 'Duplicate variant id "%s" in %s.%s; the duplicate was dropped.', $variant['id'], $type, $pool_id ) );
				continue;
			}

			$seen_ids[ $variant['id'] ] = true;
			$clean[]                    = $variant;
		}

		return $clean;
	}

	/**
	 * Load the per-variant oneOf schema from the schema file (once).
	 *
	 * @return array|null Null when the schema file is missing/invalid.
	 */
	private function getVariantSchema(): ?array {
		if ( null !== self::$variant_schema ) {
			return self::$variant_schema;
		}

		$schema_file = dirname( __DIR__, 3 ) . '/schemas/template-builder-catalog.schema.json';

		if ( ! is_readable( $schema_file ) ) {
			return null;
		}

		$decoded = json_decode( (string) file_get_contents( $schema_file ), true );

		if ( ! isset( $decoded['definitions']['patternVariant'], $decoded['definitions']['templatePartVariant'], $decoded['definitions']['disabledVariant'] ) ) {
			return null;
		}

		// Definitions are fully inline (no $ref), so they can be fed straight
		// into rest_validate_value_from_schema().
		self::$variant_schema = array(
			'oneOf' => array(
				$decoded['definitions']['patternVariant'],
				$decoded['definitions']['templatePartVariant'],
				$decoded['definitions']['disabledVariant'],
			),
		);

		return self::$variant_schema;
	}

	/**
	 * Report a catalog authoring mistake to the developer.
	 *
	 * @param string $message Human-readable problem description.
	 *
	 * @return void
	 */
	private function report( string $message ): void {
		_doing_it_wrong( esc_html( self::REPORT_AS ), esc_html( $message ), '0.1.0' );
	}
}
