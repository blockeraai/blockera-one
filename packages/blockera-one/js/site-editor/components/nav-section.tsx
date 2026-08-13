/**
 * Shared nav section wrapper (title + item list) for sidebar navigations.
 */

import type { ReactNode } from 'react';

export type NavSectionProps = {
	title?: string;
	children: ReactNode;
};

export default function NavSection({ title, children }: NavSectionProps) {
	return (
		<div className="blockera-site-editor-nav__section">
			{title ? (
				<h2 className="blockera-site-editor-nav__section-title">
					{title}
				</h2>
			) : null}
			<div className="blockera-site-editor-nav__items">{children}</div>
		</div>
	);
}
