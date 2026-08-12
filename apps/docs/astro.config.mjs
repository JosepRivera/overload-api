// @ts-check
import starlight from '@astrojs/starlight';
import { defineConfig } from 'astro/config';
import starlightThemeNova from 'starlight-theme-nova';

const REPO_URL = 'https://github.com/JosepRivera/overload-server';

// https://astro.build/config
export default defineConfig({
	site: 'https://overload-server-docs.vercel.app',
	integrations: [
		starlight({
			title: 'Overload',
			description:
				'REST API for strength training tracking — volume, personal records and 1RM estimation, calculated from every set you log.',
			favicon: '/favicon.svg',
			social: [{ icon: 'github', label: 'GitHub', href: REPO_URL }],
			editLink: { baseUrl: `${REPO_URL}/edit/main/apps/docs/` },
			lastUpdated: true,
			tableOfContents: { minHeadingLevel: 2, maxHeadingLevel: 3 },
			plugins: [starlightThemeNova()],
			locales: {
				root: { label: 'English', lang: 'en' },
				es: { label: 'Español', lang: 'es' },
			},
			sidebar: [
				{
					label: 'Start Here',
					translations: { es: 'Empieza aquí' },
					items: [{ slug: 'index' }, { slug: 'guides/quickstart' }],
				},
				{
					label: 'Guides',
					translations: { es: 'Guías' },
					items: [
						{ slug: 'guides/authentication' },
						{ slug: 'guides/track-a-workout' },
						{ slug: 'guides/deployment', badge: { text: 'Draft', variant: 'caution' } },
					],
				},
				{
					label: 'Architecture',
					translations: { es: 'Arquitectura' },
					items: [
						{ slug: 'architecture/overview' },
						{ slug: 'architecture/database-schema' },
						{ slug: 'architecture/business-rules' },
						{ slug: 'architecture/api-conventions' },
					],
				},
				{
					label: 'API Reference',
					translations: { es: 'Referencia de la API' },
					items: [
						{
							label: 'Interactive API Reference',
							translations: { es: 'Referencia interactiva de la API' },
							link: '/api/docs',
							attrs: { target: '_blank' },
						},
						{ slug: 'api' },
						{ slug: 'api/auth' },
						{ slug: 'api/users' },
						{ slug: 'api/exercises' },
						{ slug: 'api/routines' },
						{ slug: 'api/workouts' },
						{ slug: 'api/sets' },
						{ slug: 'api/analytics' },
					],
				},
				{
					label: 'Reference',
					translations: { es: 'Referencia' },
					items: [
						{ slug: 'reference/errors' },
						{ slug: 'reference/glossary' },
						{ slug: 'reference/changelog', badge: { text: 'Draft', variant: 'caution' } },
					],
				},
			],
		}),
	],
});
