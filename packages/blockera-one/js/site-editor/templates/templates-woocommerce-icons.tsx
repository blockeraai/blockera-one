/**
 * WooCommerce icons vendored for Templates purpose-nav.
 *
 * Source (Blockera local clone):
 * - source-codes/woocommerce/plugins/woocommerce/client/blocks/assets/js/icons/library/*
 * - source-codes/woocommerce/plugins/woocommerce/assets/images/icons/*
 *
 * Paths use currentColor so they inherit the sidebar icon color.
 */

import type { ReactElement } from '@wordpress/element';
import { Path, SVG } from '@wordpress/primitives';

import type { NavIcon } from './templates-nav-config';

type WooIconProps = {
	size?: number;
};

/** WC `assets/images/icons/store.svg` */
function WooStoreIcon({ size = 20 }: WooIconProps) {
	return (
		<SVG
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 24 24"
			width={size}
			height={size}
			fill="none"
		>
			<Path
				fillRule="evenodd"
				clipRule="evenodd"
				fill="currentColor"
				d="M19.75 11H21V8.667L19.875 4H4.125L3 8.667V11h1.25v8.75h15.5zm-1.5 0H5.75v7.25H10V13h4v5.25h4.25zm-5.5-5.5h2.067l.485 3.24.029.76H12.75zm-3.567 0h2.067v4H8.67l.028-.76zm7.615 3.1l-.464-3.1h2.36l.806 3.345V9.5h-2.668zM7.666 5.5h-2.36L4.5 8.845V9.5h2.668l.034-.9z"
			/>
		</SVG>
	);
}

/** WC `client/blocks/.../icons/library/bag.tsx` */
function WooBagIcon({ size = 20 }: WooIconProps) {
	return (
		<SVG
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 32 32"
			width={size}
			height={size}
			fill="none"
		>
			<Path
				fillRule="evenodd"
				clipRule="evenodd"
				fill="currentColor"
				d="M12.4444 14.2222C12.9354 14.2222 13.3333 14.6202 13.3333 15.1111C13.3333 15.8183 13.6143 16.4966 14.1144 16.9967C14.6145 17.4968 15.2927 17.7778 16 17.7778C16.7072 17.7778 17.3855 17.4968 17.8856 16.9967C18.3857 16.4966 18.6667 15.8183 18.6667 15.1111C18.6667 14.6202 19.0646 14.2222 19.5555 14.2222C20.0465 14.2222 20.4444 14.6202 20.4444 15.1111C20.4444 16.2898 19.9762 17.4203 19.1427 18.2538C18.3092 19.0873 17.1787 19.5555 16 19.5555C14.8212 19.5555 13.6908 19.0873 12.8573 18.2538C12.0238 17.4203 11.5555 16.2898 11.5555 15.1111C11.5555 14.6202 11.9535 14.2222 12.4444 14.2222Z"
			/>
			<Path
				fillRule="evenodd"
				clipRule="evenodd"
				fill="currentColor"
				d="M11.2408 6.68254C11.4307 6.46089 11.7081 6.33333 12 6.33333H20C20.2919 6.33333 20.5693 6.46089 20.7593 6.68254L24.7593 11.3492C25.0134 11.6457 25.0717 12.0631 24.9085 12.4179C24.7453 12.7727 24.3905 13 24 13H8.00001C7.60948 13 7.25469 12.7727 7.0915 12.4179C6.92832 12.0631 6.9866 11.6457 7.24076 11.3492L11.2408 6.68254ZM12.4599 8.33333L10.1742 11H21.8258L19.5401 8.33333H12.4599Z"
			/>
			<Path
				fillRule="evenodd"
				clipRule="evenodd"
				fill="currentColor"
				d="M7 12C7 11.4477 7.44772 11 8 11H24C24.5523 11 25 11.4477 25 12V25.3333C25 25.8856 24.5523 26.3333 24 26.3333H8C7.44772 26.3333 7 25.8856 7 25.3333V12ZM9 13V24.3333H23V13H9Z"
			/>
		</SVG>
	);
}

/** WC `client/blocks/.../icons/library/cart.tsx` */
function WooCartIcon({ size = 20 }: WooIconProps) {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 24 24"
			width={size}
			height={size}
			fill="currentColor"
		>
			<path d="M15.6357 12.7997C16.2355 12.7997 16.7633 12.4718 17.0352 11.976L19.8981 6.7859C20.194 6.25809 19.8101 5.60234 19.2024 5.60234H7.36675L6.61503 4.00293H4V5.60234H5.59941L8.47834 11.6721L7.39874 13.6234C6.81495 14.695 7.58267 15.9985 8.79822 15.9985H18.3947V14.3991H8.79822L9.67789 12.7997H15.6357ZM8.12647 7.20174H17.8429L15.6357 11.2003H10.0218L8.12647 7.20174ZM8.79822 16.7982C7.91854 16.7982 7.20681 17.5179 7.20681 18.3976C7.20681 19.2773 7.91854 19.997 8.79822 19.997C9.67789 19.997 10.3976 19.2773 10.3976 18.3976C10.3976 17.5179 9.67789 16.7982 8.79822 16.7982ZM16.7952 16.7982C15.9156 16.7982 15.2038 17.5179 15.2038 18.3976C15.2038 19.2773 15.9156 19.997 16.7952 19.997C17.6749 19.997 18.3947 19.2773 18.3947 18.3976C18.3947 17.5179 17.6749 16.7982 16.7952 16.7982Z" />
		</svg>
	);
}

/**
 * Same icon as Checkout Order Summary block
 * (`woocommerce/checkout-order-summary-block` → `@woocommerce/icons` `totals`).
 * Source: `client/blocks/.../icons/library/totals.tsx`
 */
function WooCheckoutIcon({ size = 20 }: WooIconProps) {
	return (
		<SVG
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 24 24"
			width={size}
			height={size}
			fill="none"
		>
			<Path
				stroke="currentColor"
				strokeWidth="1.5"
				fill="none"
				d="M6 3.75h12c.69 0 1.25.56 1.25 1.25v14c0 .69-.56 1.25-1.25 1.25H6c-.69 0-1.25-.56-1.25-1.25V5c0-.69.56-1.25 1.25-1.25z"
			/>
			<Path
				fill="currentColor"
				fillRule="evenodd"
				clipRule="evenodd"
				d="M6.9 7.5A1.1 1.1 0 018 6.4h8a1.1 1.1 0 011.1 1.1v2a1.1 1.1 0 01-1.1 1.1H8a1.1 1.1 0 01-1.1-1.1v-2zm1.2.1v1.8h7.8V7.6H8.1z"
			/>
			<Path
				fill="currentColor"
				d="M8.5 12h1v1h-1v-1zM8.5 14h1v1h-1v-1zM8.5 16h1v1h-1v-1zM11.5 12h1v1h-1v-1zM11.5 14h1v1h-1v-1zM11.5 16h1v1h-1v-1zM14.5 12h1v1h-1v-1zM14.5 14h1v1h-1v-1zM14.5 16h1v1h-1v-1z"
			/>
		</SVG>
	);
}

/**
 * Same icon as WC Order Summary block (`woocommerce/order-confirmation-summary`),
 * which uses `@wordpress/icons` `receipt`.
 * Source: block-editor `packages/icons/src/library/receipt.svg`
 */
function WooOrderIcon({ size = 20 }: WooIconProps) {
	return (
		<SVG
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 24 24"
			width={size}
			height={size}
			fill="currentColor"
		>
			<Path
				fillRule="evenodd"
				clipRule="evenodd"
				d="M16.83 6.342l.602.3.625-.25.443-.176v12.569l-.443-.178-.625-.25-.603.301-1.444.723-2.41-.804-.475-.158-.474.158-2.41.803-1.445-.722-.603-.3-.625.25-.443.177V6.215l.443.178.625.25.603-.301 1.444-.722 2.41.803.475.158.474-.158 2.41-.803 1.445.722zM20 4l-1.5.6-1 .4-2-1-3 1-3-1-2 1-1-.4L5 4v17l1.5-.6 1-.4 2 1 3-1 3 1 2-1 1 .4 1.5.6V4zm-3.5 6.25v-1.5h-8v1.5h8zm0 3v-1.5h-8v1.5h8zm-8 3v-1.5h8v1.5h-8z"
			/>
		</SVG>
	);
}

/** WC `assets/images/icons/search.svg` */
function WooProductSearchIcon({ size = 20 }: WooIconProps) {
	return (
		<SVG
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 24 24"
			width={size}
			height={size}
			aria-hidden="true"
		>
			<Path
				fill="currentColor"
				d="M13 5c-3.3 0-6 2.7-6 6 0 1.4.5 2.7 1.3 3.7l-3.8 3.8 1.1 1.1 3.8-3.8c1 .8 2.3 1.3 3.7 1.3 3.3 0 6-2.7 6-6S16.3 5 13 5zm0 10.5c-2.5 0-4.5-2-4.5-4.5s2-4.5 4.5-4.5 4.5 2 4.5 4.5-2 4.5-4.5 4.5z"
			/>
		</SVG>
	);
}

/** WC `client/blocks/.../icons/library/sparkles.tsx` */
function WooComingSoonIcon({ size = 20 }: WooIconProps) {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 24 24"
			width={size}
			height={size}
			fill="currentColor"
		>
			<path d="M12 3.5C16.675 3.5 20.5 7.325 20.5 12C20.5 16.675 16.675 20.5 12 20.5C7.325 20.5 3.5 16.675 3.5 12C3.5 11.405 3.58492 10.7249 3.66992 10.1299C3.83994 9.70492 4.26545 9.3652 4.69043 9.4502C5.20002 9.62026 5.45492 10.0449 5.37012 10.4697C5.28512 10.9797 5.2002 11.49 5.2002 12C5.2002 15.74 8.26 18.7998 12 18.7998C15.74 18.7998 18.7998 15.74 18.7998 12C18.7998 8.26 15.74 5.2002 12 5.2002C11.49 5.2002 10.9797 5.28512 10.4697 5.37012H10.2998C9.87505 5.37004 9.53533 5.11509 9.4502 4.69043C9.3652 4.26545 9.70492 3.83994 10.1299 3.66992C10.7249 3.58492 11.405 3.5 12 3.5ZM12 7.75C12.5099 7.75001 12.8494 8.08983 12.8496 8.59961V11.6602L15.1445 13.9551C15.4845 14.2951 15.4845 14.8045 15.1445 15.1445C14.9745 15.3145 14.7198 15.4004 14.5498 15.4004C14.3798 15.4003 14.125 15.3145 13.9551 15.1445L11.4053 12.5947C11.2353 12.4247 11.1504 12.255 11.1504 12V8.59961C11.1506 8.08983 11.4901 7.75 12 7.75ZM7.24023 4.94531C7.58029 4.69062 8.17477 4.77631 8.42969 5.20117C8.68456 5.62614 8.59975 6.13566 8.1748 6.39062C7.49484 6.90061 6.89963 7.49581 6.38965 8.17578C6.21965 8.34571 5.96486 8.51562 5.70996 8.51562C5.54002 8.51562 5.37014 8.5156 5.2002 8.43066C4.7752 8.09066 4.69027 7.58027 5.03027 7.15527C5.62523 6.30545 6.39038 5.54021 7.24023 4.94531Z" />
		</svg>
	);
}

const WOOCOMMERCE_NAV_ICONS: Partial<
	Record<NavIcon, (props: WooIconProps) => ReactElement>
> = {
	store: WooStoreIcon,
	product: WooBagIcon,
	cart: WooCartIcon,
	checkout: WooCheckoutIcon,
	order: WooOrderIcon,
	'product-search': WooProductSearchIcon,
	'coming-soon': WooComingSoonIcon,
};

export function isWooCommerceNavIcon(icon: NavIcon): boolean {
	return Object.prototype.hasOwnProperty.call(WOOCOMMERCE_NAV_ICONS, icon);
}

export function renderWooCommerceNavIcon(
	icon: NavIcon,
	size = 20
): ReactElement | null {
	const Component = WOOCOMMERCE_NAV_ICONS[icon];
	if (!Component) {
		return null;
	}
	return <Component size={size} />;
}
