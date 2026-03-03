import Link from "next/link";
import styles from "./header.module.css";

export function Header() {
	return (
		<header className={styles.header}>
			<nav className={styles.nav}>
				<Link href="/" className={styles.logo}>
					skillsafe
				</Link>
				<div className={styles.links}>
					<Link href="/docs">Docs</Link>
					<a
						href="https://github.com/voodootikigod/skillsafe"
						target="_blank"
						rel="noopener noreferrer"
					>
						GitHub
					</a>
				</div>
			</nav>
		</header>
	);
}
