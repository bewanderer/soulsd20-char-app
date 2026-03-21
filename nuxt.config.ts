import tailwindConfig from "./tailwind.config";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  runtimeConfig: {
    public: {
      API_BASE_URL: process.env.API_BASE_URL || 'http://127.0.0.1:8000',
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
    typeCheck: true,
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
        'img-src': ["'self'", 'data:', 'blob:', 'http://127.0.0.1:8000'],
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