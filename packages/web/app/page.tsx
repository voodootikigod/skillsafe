import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { Hero } from "@/components/hero";
import { Problem } from "@/components/problem";
import { Quickstart } from "@/components/quickstart";

const jsonLd = {
	"@context": "https://schema.org",
	"@type": "SoftwareApplication",
	name: "skillsafe",
	applicationCategory: "DeveloperApplication",
	operatingSystem: "Any",
	description:
		"Quality & integrity layer for AI Agent Skills — like npm outdated for skill knowledge. Scan SKILL.md files, detect stale product-versions, and generate staleness reports.",
	url: "https://skillsafe.sh",
	downloadUrl: "https://www.npmjs.com/package/skillsafe",
	softwareVersion: "1.0.0",
	author: {
		"@type": "Person",
		name: "Chris Williams",
		url: "https://github.com/voodootikigod",
	},
	offers: {
		"@type": "Offer",
		price: "0",
		priceCurrency: "USD",
	},
};

export default function Home() {
	return (
		<>
			<script
				type="application/ld+json"
				// biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD structured data requires innerHTML
				dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
			/>
			<Header />
			<main>
				<Hero />
				<Problem />
				<Quickstart />
			</main>
			<Footer />
		</>
	);
}
