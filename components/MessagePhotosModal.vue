<template>
  <b-modal
    ref="modal"
    scrollable
    :title="message.subject"
    size="lg"
    ok-only
    ok-variant="secondary"
    ok-title="Close"
  >
    <ImageCarousel
      v-if="message?.attachments?.length"
      :message-id="message.id"
      :attachments="message.attachments"
    />
  </b-modal>
</template>

<script setup>
import { useMessageStore } from '../stores/message'
import { useModal } from '~/composables/useModal'
import ImageCarousel from '~/components/ImageCarousel'

const props = defineProps({
  id: {
    type: Number,
    required: true,
  },
})

const messageStore = useMessageStore()

const { modal } = useModal()

const message = computed(() => {
  return messageStore?.byId(props.id)
})
</script>
<style scoped lang="scss">
:deep(.carousel-caption) {
  position: unset !important;
  padding-top: 0px !important;
  padding-bottom: 0px !important;
}

:deep(.carousel-item.active) {
  background-color: transparent !important;
}
</style>
