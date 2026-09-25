import adapter from '@sveltejs/adapter-vercel';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  kit: {
    adapter: adapter({ runtime: 'nodejs22.x' }),
    // Renamed from the SvelteKit default (`src/routes`) to match this
    // project's app/domain/libs layout.
    files: {
      routes: 'src/app'
    }
  }
};

export default config;
