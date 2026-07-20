// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import starlightThemeNova from 'starlight-theme-nova';

// https://astro.build/config
export default defineConfig({
	integrations: [
		starlight({
			title: 'Overload API',
			social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/JosepRivera/overload-api' }],
			plugins: [starlightThemeNova()],
			sidebar: [
				{
					label: 'Overview',
					items: [{ slug: 'index' }],
				},
				{
					label: 'Architecture',
					items: [
						{ slug: 'architecture/overview' },
						{ slug: 'architecture/database-schema' },
						{ slug: 'architecture/business-rules' },
						{ slug: 'architecture/api-conventions' },
					],
				},
				{
					label: 'Decisions',
					items: [{ autogenerate: { directory: 'decisions' } }],
				},
				{
					label: 'API',
					items: [
						{ label: 'Interactive API Reference', link: '/api/docs' },
						{ autogenerate: { directory: 'api' } },
					],
				},
			],
		}),
	],
});
