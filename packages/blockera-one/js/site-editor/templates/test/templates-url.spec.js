/**
 * @jest-environment jsdom
 */

/**
 * Internal dependencies
 */
import {
	getTemplatesUrlState,
	parseBlockeraBuilder,
	serializeBlockeraBuilder,
} from '../templates-url';
import { FILTER_IDS } from '../filter-ids';

describe('parseBlockeraBuilder', () => {
	test('returns all-templates when the param is missing', () => {
		expect(
			parseBlockeraBuilder(
				'https://site.test/wp-admin/site-editor.php?p=/template'
			)
		).toEqual({
			filter: FILTER_IDS.all,
			partsArea: null,
			optionsPanel: [],
		});
	});

	test('parses a purpose filter and nested stack', () => {
		expect(
			parseBlockeraBuilder(
				'https://site.test/wp-admin/site-editor.php?p=/wp_template/x&blockera-builder=archive/posts-loop/post-title'
			)
		).toEqual({
			filter: 'archive',
			partsArea: null,
			optionsPanel: ['posts-loop', 'post-title'],
		});
	});

	test('parses children filters with a colon', () => {
		expect(
			parseBlockeraBuilder(
				'https://site.test/wp-admin/site-editor.php?blockera-builder=children:category'
			)
		).toEqual({
			filter: 'children:category',
			partsArea: null,
			optionsPanel: [],
		});
	});

	test('parses a parts hub and nested stack', () => {
		expect(
			parseBlockeraBuilder(
				'https://site.test/wp-admin/site-editor.php?blockera-builder=sidebar/widgets'
			)
		).toEqual({
			filter: FILTER_IDS.all,
			partsArea: 'sidebar',
			optionsPanel: ['widgets'],
		});
	});
});

describe('serializeBlockeraBuilder', () => {
	test('omits the param for all templates', () => {
		expect(
			serializeBlockeraBuilder({
				filter: FILTER_IDS.all,
				partsArea: null,
				optionsPanel: [],
			})
		).toBeUndefined();
	});

	test('serializes purpose plus nested stack', () => {
		expect(
			serializeBlockeraBuilder({
				filter: 'archive',
				optionsPanel: ['posts-loop', 'post-title'],
			})
		).toBe('archive/posts-loop/post-title');
	});

	test('serializes a parts hub first', () => {
		expect(
			serializeBlockeraBuilder({
				filter: 'archive',
				partsArea: 'header',
				optionsPanel: ['design'],
			})
		).toBe('header/design');
	});
});

describe('getTemplatesUrlState', () => {
	test('reads path from p and builder from blockera-builder', () => {
		expect(
			getTemplatesUrlState(
				'https://site.test/wp-admin/site-editor.php?p=/wp_template/blockera-one//archive&blockera-builder=archive/posts-loop'
			)
		).toEqual({
			filter: 'archive',
			partsArea: null,
			optionsPanel: ['posts-loop'],
			path: '/wp_template/blockera-one//archive',
		});
	});
});
