<template>
  <div class="item header--size4">
    <h3 class="m-0 d-flex justify-content-between">
      <div class="w-100">
        <div class="visually-hidden">
          {{ type }}
        </div>
        <Highlighter
          v-if="matchedon"
          :search-words="[matchedon.word]"
          :text-to-highlight="item"
          highlight-class-name="highlight"
          auto-escape
          class="item"
        />
        <span
          v-else
          :class="{
            item: true,
            nowrap: !expanded,
          }"
          itemprop="name"
        >
          <a class="nodecor" :href="'/message/' + id" @click="block">{{
            item
          }}</a>
        </span>
      </div>
      <div>
        <client-only>
          <b-badge
            v-if="message && message.availablenow > 1"
            variant="info"
            class="ms-2 me-2 mt-0 align-top"
          >
            {{ message.availablenow ? message.availablenow : '0' }} left
          </b-badge>
        </client-only>
      </div>
    </h3>
    <div v-if="showLocation" class="location">
      {{ location }}
    </div>
  </div>
</template>
<script>
import Highlighter from 'vue-highlight-words'
import { useMessageStore } from '~/stores/message'
import { twem } from '~/composables/useTwem'

export default {
  components: { Highlighter },
  props: {
    id: {
      type: Number,
      required: true,
    },
    matchedon: {
      type: Object,
      required: false,
      default: null,
    },
    type: {
      type: String,
      required: false,
      default: null,
    },
    expanded: {
      type: Boolean,
      required: false,
      default: false,
    },
    showLocation: {
      type: Boolean,
      required: false,
      default: true,
    },
  },
  setup() {
    const messageStore = useMessageStore()
    return { messageStore }
  },
  computed: {
    message() {
      return this.messageStore?.byId(this.id)
    },
    subject() {
      return this.message ? this.message.subject : null
    },
    item() {
      let ret = this.subject

      if (this.subject) {
        const matches = /(.*?):([^)].*)\((.*)\)/.exec(this.subject)

        if (matches && matches.length > 0 && matches[2].length > 0) {
          ret = matches[2]
        }
      }

      return ret ? twem(ret) : 'unknown'
    },
    location() {
      let ret = null

      if (this.subject) {
        const matches = /(.*?):([^)].*)\((.*)\)/.exec(this.subject)

        if (matches && matches.length > 0 && matches[3].length > 0) {
          ret = matches[3]
        }
      }

      return ret ? twem(ret) : null
    },
  },
  methods: {
    block(e) {
      e.preventDefault()
    },
  },
}
</script>
<style scoped lang="scss">
.item {
  color: $colour-info-fg !important;

  a {
    color: $colour-info-fg !important;
  }

  font-weight: bold !important;
  text-overflow: ellipsis;
  overflow: hidden;
  display: block;
}

.nowrap {
  white-space: nowrap;
}

.location {
  color: $color-gray--darker !important;
  font-size: 1.25rem;
}
</style>
