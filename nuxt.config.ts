import tailwindConfig from "./tailwind.config";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  runtimeConfig: {
    public: {
      API_BASE_URL: process.env.API_BASE_URL || 'http://127.0.0.1:8000',
      RELAY_URL: process.env.RELAY_URL || 'ws://localhost:8080',
    }
  },
  components: [
    {
      path: '~/components',
      pathPrefix: false,
    }
  ],
  css: [
    // '~/assets/css/design-system.css', // BACKUP - old fixed px system
    '~/assets/css/responsive-system.css', // ACTIVE - responsive design system
    '~/assets/css/main.css'
  ],
  typescript: {
    strict: true,
    typeCheck: false, // Type checking done during development, not production build
  },
  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {},
    },
  },
  modules: ['@pinia/nuxt', '@nuxtjs/google-fonts', '@nuxt/ui', "nuxt-security"],
  security: {
    headers: {
      contentSecurityPolicy: {
        'img-src': ["'self'", 'data:', 'blob:', 'http://127.0.0.1:8000', 'https://*.r2.dev', 'https://soulsd20-api.up.railway.app'],
      },
      crossOriginEmbedderPolicy: 'unsafe-none',
      crossOriginResourcePolicy: 'cross-origin',
    }
  },
  googleFonts: {
    families: {
      'Cardo': [400, 700],
      'Cinzel': [400, 600, 700],
    },
    download: true,
    base64: false
  }
})