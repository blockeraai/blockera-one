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

/** WC `client/blocks/.../icons/library/sparkles.tsx` */
function WooComingSoonIcon({ size = 20 }: WooIconProps) {
	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 24 24"
			xmlns="http://www.w3.org/2000/svg"
		>
			<path d="M11.9995 3.5C13.0971 3.5 14.1475 3.71257 15.1128 4.0957C15.1625 4.11508 15.2119 4.13493 15.2613 4.15527C15.2976 4.1705 15.3336 4.18644 15.3697 4.20215C16.3299 4.61395 17.2294 5.2084 18.0103 5.98926C18.7776 6.75658 19.3639 7.63864 19.7749 8.58008C19.8013 8.63948 19.8281 8.6987 19.8531 8.75879C19.8633 8.78381 19.8733 8.80889 19.8833 8.83398C20.2799 9.81383 20.4995 10.8823 20.4995 12C20.4995 13.1034 20.284 14.1583 19.897 15.1279C19.8831 15.1633 19.8704 15.1992 19.856 15.2344C19.8308 15.295 19.8044 15.3551 19.7779 15.415C19.3667 16.3584 18.779 17.242 18.0103 18.0107C17.2326 18.7883 16.3371 19.3803 15.3814 19.792C15.3382 19.8109 15.295 19.8295 15.2515 19.8477C15.2064 19.8662 15.1611 19.8837 15.1158 19.9014C14.1494 20.2854 13.0984 20.5 11.9995 20.5C10.9362 20.4999 9.91821 20.2986 8.97806 19.9375C8.89606 19.9066 8.81412 19.8754 8.73294 19.8418C8.71493 19.8342 8.69718 19.8261 8.67923 19.8184C7.70052 19.4058 6.784 18.8049 5.98978 18.0107C5.56918 17.5901 5.14818 17.0491 4.78763 16.5684C4.60737 16.1477 4.66751 15.6067 5.02786 15.3662C5.5086 15.126 5.98964 15.2459 6.23001 15.6064C6.53047 16.0271 6.83137 16.448 7.19193 16.8086C7.38101 16.9977 7.57964 17.172 7.7847 17.334H7.79739C8.30446 17.7348 8.86965 18.0654 9.47708 18.3105C11.0921 18.9509 12.9069 18.9508 14.522 18.3105C16.2501 17.6146 17.6307 16.2276 18.3199 14.4961C18.9495 12.8883 18.947 11.0853 18.3111 9.47949C17.6152 7.75044 16.228 6.36796 14.4956 5.67871C13.6961 5.36559 12.8485 5.2081 12.0005 5.20801V5.2002H11.9995C11.4897 5.20024 10.9791 5.28514 10.4693 5.37012H10.2993C9.8748 5.36986 9.53484 5.11495 9.44974 4.69043C9.36483 4.26561 9.70467 3.84003 10.1294 3.66992C10.7243 3.58494 11.4046 3.50004 11.9995 3.5ZM11.9995 7.75C12.5094 7.75 12.85 8.08983 12.8501 8.59961V11.6602L15.1451 13.9551C15.4849 14.295 15.4847 14.8046 15.1451 15.1445C14.9752 15.3144 14.7203 15.4003 14.5503 15.4004C14.3803 15.4004 14.1246 15.3145 13.9546 15.1445L11.4048 12.5947C11.235 12.4248 11.1499 12.2549 11.1499 12V8.59961C11.1501 8.08996 11.4899 7.75018 11.9995 7.75ZM3.64603 10.3779C3.70612 9.95727 4.18676 9.59676 4.66751 9.7168C5.14834 9.83701 5.44885 10.2574 5.32864 10.7383C5.20844 11.5797 5.20844 12.4213 5.32864 13.2627C5.32864 13.5031 5.26872 13.8041 5.08841 13.9844C4.9683 14.1045 4.84767 14.2241 4.66751 14.2842C4.12671 14.3441 3.70612 14.0438 3.64603 13.5029C3.46576 12.4813 3.46577 11.3996 3.64603 10.3779ZM7.23978 4.94531C7.57978 4.69034 8.17521 4.77619 8.43021 5.20117C8.68483 5.626 8.59995 6.13566 8.17532 6.39062C7.49533 6.90062 6.90016 7.49579 6.39017 8.17578C6.22027 8.34568 5.96532 8.51541 5.71048 8.51562C5.54048 8.51562 5.36974 8.51566 5.19974 8.43066C4.77489 8.09066 4.68986 7.58022 5.02982 7.15527C5.6248 6.30535 6.38984 5.54027 7.23978 4.94531Z" />
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
