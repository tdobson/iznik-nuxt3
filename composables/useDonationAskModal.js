import { useAuthStore } from '~/stores/auth'
import { useMiscStore } from '~/stores/misc'
import { useRuntimeConfig } from '#app'
import Api from '~/api'

export function useDonationAskModal(requestedVariant) {
  const authStore = useAuthStore()
  const miscStore = useMiscStore()
  const runtimeConfig = useRuntimeConfig()
  const api = Api(runtimeConfig)

  const me = authStore.user

  const variant = ref(null)
  const groupId = ref(null)

  const lastAsk = miscStore.get('lastdonationask')
  const canAsk =
    !lastAsk || new Date().getTime() - lastAsk > 60 * 60 * 1000 * 24 * 7

  const { $bus } = useNuxtApp()
  $bus.$on('outcome', (params) => {
    groupId.value = params.groupid
    const { outcome } = params

    if (outcome === 'Taken' || outcome === 'Received') {
      // If someone has set up a regular donation, then we don't ask them to donate again.  Wouldn't be fair to
      // pester them.

      if (!me?.donorrecurring && canAsk) {
        ask()
      }
    }
  })

  function ask() {
    show(requestedVariant)

    miscStore.set({
      key: 'lastdonationask',
      value: new Date().getTime(),
    })
  }

  const showDonationAskModal = ref(false)

  async function show(requestedVariant) {
    // We need to decide which variant of donation ask to show.
    variant.value = requestedVariant

    try {
      if (!requestedVariant) {
        requestedVariant = 'buttons1'

        requestedVariant = await api.bandit.choose({
          uid: 'donation',
        })

        if (requestedVariant) {
          variant.value = requestedVariant.variant
        }
      }
    } catch (e) {
      console.error('Get variant failed')
    }

    showDonationAskModal.value = true

    // Record the show
    await api.bandit.shown({
      uid: 'donation',
      variant: variant.value,
    })
  }

  return { showDonationAskModal, variant, groupId }
}