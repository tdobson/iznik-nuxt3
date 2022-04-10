import { defineNuxtConfig } from 'nuxt3'
import constants from './constants'

export default defineNuxtConfig({
  // We use a static target with no SSR:
  // - We need static rendering for good SEO.
  // - It means the users pay for the CPU not Freegle.  Cheapskates.
  ssr: false,
  target: 'static',

  build: {
    // Reduce size of CSS initial load.
    extractCSS: true,
  },

  buildModules: ['@pinia/nuxt'],

  // Environment variables the client needs.
  publicRuntimeConfig: {
    APIv1: constants.APIv1,
    APIv2: constants.APIv2,
    IZNIK_API_V1: constants.IZNIK_API_V1,
    IZNIK_API_V2: constants.IZNIK_API_V2,
    OSM_TILE: constants.OSM_TILE,
    GEOCODE: constants.GEOCODE,
    FACEBOOK_APPID: constants.FACEBOOK_APPID,
    YAHOO_CLIENTID: constants.YAHOO_CLIENTID,
    GOOGLE_MAPS_KEY: constants.GOOGLE_MAPS_KEY,
    GOOGLE_API_KEY: constants.GOOGLE_API_KEY,
    GOOGLE_CLIENT_ID: constants.GOOGLE_CLIENT_ID,
    USER_SITE: constants.USER_SITE,
    IMAGE_SITE: constants.IMAGE_SITE,
    SENTRY_DSN: constants.SENTRY_DSN,
    BUILD_DATE: new Date().toISOString(),
  },
  css: ['@/assets/css/global.scss'],

  alias: {
    'color-vars': 'assets/css/_color-vars.scss',
  },

  // TODO Sentry
})