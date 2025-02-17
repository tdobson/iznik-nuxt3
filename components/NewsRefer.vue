<template>
  <div :class="reply?.deleted ? 'strike' : ''">
    <notice-message v-if="type === 'ReferToOffer'">
      <p>If you're giving away something, then please:</p>
      <b-button variant="primary" to="/give" class="mb-1">
        Post an OFFER
      </b-button>
      <p>
        We'll tell more people about that, so you'll get a better response. This
        section is just for chat and recommendations.
      </p>
    </notice-message>
    <notice-message v-if="type === 'ReferToWanted'">
      <p>If you're looking for an item, then please:</p>
      <b-button variant="primary" to="/find" class="mb-1">
        Post a WANTED
      </b-button>
      <p>
        We'll tell more people about that, so you'll get a better response. This
        section is just for chat and recommendations.
      </p>
    </notice-message>
    <notice-message v-if="type === 'ReferToTaken'">
      <p>
        If your item has been taken, please go to My Posts, click on the item,
        and use the button to <strong>Mark as TAKEN</strong>.
      </p>
      <b-button variant="primary" to="/myposts" class="mb-1">
        Go to My Posts
      </b-button>
    </notice-message>
    <notice-message v-if="type === 'ReferToReceived'">
      <p>
        If you've got what you were looking for, please go to My Posts, click on
        the item, and use the button to <strong>Mark as RECEIVED</strong>.
      </p>
      <b-button variant="primary" to="/myposts" class="mb-1">
        Go to My Posts
      </b-button>
    </notice-message>
    <div
      v-if="supportOrAdmin && !reply?.deleted"
      class="d-flex justify-content-end"
    >
      <b-button variant="link" class="reply__button" @click="deleteWarning">
        Delete this warning
      </b-button>
      <ConfirmModal
        v-if="showDeleteModal"
        title="Delete refer to"
        @confirm="deleteConfirm"
        @hidden="showDeleteModal = false"
      />
    </div>
  </div>
</template>

<script>
import { useNewsfeedStore } from '../stores/newsfeed'
import NoticeMessage from './NoticeMessage'
const ConfirmModal = defineAsyncComponent(() =>
  import('~/components/ConfirmModal.vue')
)

export default {
  components: { NoticeMessage, ConfirmModal },
  props: {
    id: {
      type: Number,
      required: true,
    },
    type: {
      type: String,
      required: true,
    },
    threadhead: {
      type: Number,
      required: true,
    },
  },
  setup() {
    const newsfeedStore = useNewsfeedStore()

    return {
      newsfeedStore,
    }
  },
  data() {
    return {
      showDeleteModal: false,
    }
  },
  computed: {
    reply() {
      return this.newsfeedStore?.byId(this.id)
    },
  },
  methods: {
    deleteWarning() {
      this.showDeleteModal = true
    },
    async deleteConfirm() {
      await this.newsfeedStore.delete(this.id, this.threadhead)
    },
  },
}
</script>
<style scoped lang="scss">
@import 'bootstrap/scss/functions';
@import 'bootstrap/scss/variables';
@import 'bootstrap/scss/mixins/_breakpoints';

.reply__button {
  margin-left: 3px;
  margin-right: 3px;
}

:deep(.strike) {
  text-decoration: line-through;
}
</style>
