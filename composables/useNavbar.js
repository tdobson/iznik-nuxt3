import { useRoute, useRouter } from 'vue-router'
import pluralize from 'pluralize'
import { useMiscStore } from '../stores/misc'
import { useNewsfeedStore } from '../stores/newsfeed'
import { useMessageStore } from '../stores/message'
import { useNotificationStore } from '../stores/notification'
import { useLogoStore } from '../stores/logo'
import { useChatStore } from '../stores/chat'
import { useAuthStore } from '~/stores/auth'
import { fetchMe } from '~/composables/useMe'
import { useRuntimeConfig } from '#app'

export const navBarHidden = ref(false)

let navBarTimeout = null

export function setNavBarHidden(hidden) {
  // Hide the navbar when typing.
  //
  // Start a timer to show the navbars again after a delay.
  if (navBarHidden.value !== hidden) {
    navBarHidden.value = hidden
  }

  if (navBarTimeout) {
    clearTimeout(navBarTimeout)
    navBarTimeout = null
  }

  if (hidden) {
    navBarTimeout = setTimeout(() => {
      navBarHidden.value = false
    }, 5000)
  }
}

export function useNavbar() {
  const authStore = useAuthStore()
  const miscStore = useMiscStore()
  const newsfeedStore = useNewsfeedStore()
  const messageStore = useMessageStore()
  const notificationStore = useNotificationStore()
  const chatStore = useChatStore()
  const logoStore = useLogoStore()
  const route = useRoute()
  const router = useRouter()

  const online = computed(() => miscStore.online)
  const myid = computed(() => authStore.user?.id)
  const distance = ref(1000)
  const logo = ref('/icon.png')
  const unreadNotificationCount = ref(0)
  const chatCount = computed(() => chatStore.unreadCount)
  const activePostsCount = computed(() => messageStore.activePostsCounter)
  const showAboutMeModal = ref(false)
  const countTimer = ref(null)

  const homePage = computed(() => {
    const lastRoute = miscStore.get('lasthomepage')

    let nextroute = '/'

    if (authStore.user) {
      nextroute = '/browse'

      if (lastRoute === 'news') {
        nextroute = '/chitchat'
      } else if (lastRoute === 'myposts') {
        nextroute = '/myposts'
      }
    }

    return nextroute
  })

  const showBackButton = computed(() => {
    // On mobile we want to show a back button instead of the logo when we're not on one of the "home" routes,
    // which are /browse, /chitchat, /myposts
    return (
      route &&
      route.path !== '/browse' &&
      route.path !== '/chitchat' &&
      route.path !== '/myposts' &&
      !route.path.startsWith('/explore/') &&
      route.path !== '/'
    )
  })

  const backButtonCount = computed(() => {
    // On mobile, if we're viewing a chat, then we don't have the navbar and we won't see anything which
    // reminds us that we have other unread chat messages.  In that case we show a count of unread chat
    // messages.
    if (route.path.startsWith('/chats/')) {
      const chatid = parseInt(route.path.split('/')[2])
      const chat = chatStore.byChatId(chatid)

      return chatCount.value - chat?.unseen
    }

    return 0
  })

  const newsCount = computed(() => {
    return newsfeedStore.count
  })

  const newsCountPlural = () => {
    return pluralize('unread ChitChat post', newsCount.value, true)
  }

  const browseCount = computed(() => {
    return Math.min(99, messageStore.count)
  })

  const browseCountPlural = computed(() => {
    return pluralize('unseen post', messageStore.count, true)
  })

  const activePostsCountPlural = ref(() => {
    return pluralize('open post', activePostsCount.value, {
      includeNumber: true,
    })
  })

  onMounted(() => {
    setTimeout(async () => {
      // Look for a custom logo.
      const ret = await logoStore.fetch()

      if (ret.ret === 0 && ret.logo) {
        logo.value = ret.logo.path.replace(/.*logos/, '/logos')
      }
    }, 5000)

    getCounts()
  })

  const requestLogin = () => {
    authStore.forceLogin = true
  }

  const logout = async () => {
    await authStore.logout()
    authStore.forceLogin = false

    // Go to the landing page.
    router.push('/', true)
  }

  const showAboutMe = async () => {
    await fetchMe(true)
    showAboutMeModal.value = true
  }

  const maybeReload = (route) => {
    if (router?.currentRoute?.value?.path === route) {
      // We have clicked to route to the page we're already on.  Force a full refresh.
      window.location.reload(true)
    }
  }

  const backButton = () => {
    try {
      router.back()
    } catch (e) {
      router.push('/')
    }
  }

  const getCounts = async () => {
    if (myid.value) {
      try {
        // We sometimes might not yet have figured out if we're logged in, so catch exceptions otherwise they
        // cause Nuxt to bail out with JS errors.
        const me = authStore.user
        const settings = me?.settings
        const distance = settings?.newsfeedarea || 0
        await newsfeedStore.fetchCount(distance, false)
        await messageStore.fetchCount(me?.settings?.browseView, false)

        // We might get logged out during awaits.
        if (
          myid.value &&
          route.path !== '/profile/' + myid.value &&
          !route.path.includes('/unsubscribe')
        ) {
          // Get the messages for the currently logged in user.  This will also speed up the My Posts page.
          //
          // We don't do this if we're looking at our own profile otherwise this fetch and the one in ProfileInfo
          // can interfere with each other.
          //
          // We also don't do this on unsubscribe pages as there are timing windows which can lead to the call
          // failing and consequent Sentry errors.
          await messageStore.fetchActivePostCount()
        }

        if (myid.value) {
          unreadNotificationCount.value = await notificationStore.fetchCount()

          if (myid.value && unreadNotificationCount.value) {
            // Fetch the notifications too, so that we can be quick if they view them.
            notificationStore.fetchList()
          }
        }

        const runtimeConfig = useRuntimeConfig()

        if (runtimeConfig.public.NETLIFY_DEPLOY_ID) {
          try {
            const response = await fetch(
              `https://api.netlify.com/api/v1/sites/${runtimeConfig.public.NETLIFY_SITE_NAME}.netlify.com`
            )

            const data = await response.json()

            if (data?.deploy_id) {
              if (data.deploy_id !== runtimeConfig.public.NETLIFY_DEPLOY_ID) {
                const deployDate = new Date(data.published_deploy.published_at)

                // Check it's not too soon to nag.  This stops annoyances when we have lots of releases in a short
                // time.
                if (deployDate.getTime() < Date.now() - 12 * 60 * 60 * 1000) {
                  // We're not on the latest deploy, so show a warning.
                  useMiscStore().needToReload = true
                }
              }
            }
          } catch (e) {
            console.log('Failed to fetch deploy info', e)
          }
        }
      } catch (e) {
        console.log('Ignore error fetching counts', e)
      }
    }

    countTimer.value = setTimeout(getCounts, 60000)
  }

  watch(myid, (newVal, oldVal) => {
    if (newVal && !oldVal) {
      // Just logged in, update the counts sooner.
      if (countTimer.value) {
        clearTimeout(countTimer.value)
      }

      getCounts()
    }
  })

  return {
    online,
    distance,
    logo,
    unreadNotificationCount,
    chatCount,
    activePostsCount,
    activePostsCountPlural,
    newsCount,
    newsCountPlural,
    browseCount,
    browseCountPlural,
    showAboutMeModal,
    homePage,
    showBackButton,
    backButtonCount,
    requestLogin,
    logout,
    showAboutMe,
    maybeReload,
    backButton,
  }
}
