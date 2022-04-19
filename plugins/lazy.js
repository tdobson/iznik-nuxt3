import { BImg } from 'bootstrap-vue-3'

export default defineNuxtPlugin((nuxtApp) => {
  // TODO The alpha ov bootstrap-vue-3 doesn't support lazy loading yet.
  nuxtApp.vueApp.component('bImgLazy', BImg)
})
