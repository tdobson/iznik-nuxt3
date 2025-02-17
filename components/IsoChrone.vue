<template>
  <div>
    <div v-if="!id">
      <hr />
      <p>
        You can add extra postcodes, and we'll show you the posts from near
        there too.
      </p>
      <div class="d-flex flex-wrap justify-content-between mb-2">
        <div>
          <label class="font-weight-bold"> New Postcode: </label>
          <PostCode
            v-if="!id"
            :value="pcname"
            size="sm"
            @selected="selectPostcode"
            @cleared="clearPostcode"
          />
        </div>
        <div>
          <label class="font-weight-bold"> Nickname (e.g. Work): </label>
          <b-form-input
            v-model="nickname"
            placeholder="Where is this?"
            max-length="20"
            :state="nameState"
          />
        </div>
      </div>
    </div>
    <template v-if="isochrone">
      <div class="layout">
        <label class="font-weight-bold sliderLabel mb-1">
          <div v-if="id">
            <div v-if="isochrone.nickname">
              {{ isochrone.nickname }}:
              <span class="text-faded">({{ location?.name }})</span>
            </div>
            <div v-else>
              <span v-if="myLocation"> Posts near {{ myLocation }}: </span>
              <span v-else> Nearby posts: </span>
            </div>
          </div>
          <div v-else>Nearby posts:</div>
          <div class="d-flex flex-column justify-content-around">
            <b-button
              v-if="addButton"
              variant="link"
              class="ml-2 p-0"
              size="sm"
              @click="$emit('add')"
            >
              Add location
            </b-button>
            <SpinButton
              v-else-if="isochrone.nickname"
              variant="link"
              button-class="ml-2 p-0 mb-1"
              confirm
              size="sm"
              label="Remove"
              @handle="deleteLocation"
            />
          </div>
        </label>
        <div class="slider">
          <b-button
            variant="white"
            size="sm"
            class="mr-2"
            title="Show nearer posts"
            @click="decrement"
          >
            <v-icon icon="minus" />
            <span class="d-none d-md-inline-block ml-1">Near</span>
          </b-button>
          <b-form-input
            v-model="minutes"
            type="range"
            :min="minMinutes"
            :max="maxMinutes"
            :step="step"
            class="pt-2"
          />
          <b-button
            variant="white"
            size="sm"
            class="ml-2"
            title="Show further posts"
            @click="increment"
          >
            <span class="d-none d-md-inline-block mr-1">Far</span>
            <v-icon icon="plus" />
          </b-button>
        </div>
        <label class="font-weight-bold travelLabel"> Travel by: </label>
        <div class="travel">
          <b-button
            :variant="transport === 'Walk' ? 'primary' : 'white'"
            @click="changeTransport('Walk')"
          >
            <v-icon icon="walking" /><span class="d-none d-md-inline-block"
              >&nbsp;Walk</span
            >
          </b-button>
          <b-button
            :variant="transport === 'Cycle' ? 'primary' : 'white'"
            @click="changeTransport('Cycle')"
          >
            <v-icon icon="bicycle" /><span class="d-none d-md-inline-block"
              >&nbsp;Cycle</span
            >
          </b-button>
          <b-button
            :variant="transport === 'Drive' ? 'primary' : 'white'"
            @click="changeTransport('Drive')"
          >
            <v-icon icon="car" /><span class="d-none d-md-inline-block"
              >&nbsp;Drive</span
            >
          </b-button>
        </div>
      </div>
      <div v-if="!id">
        <b-button
          v-if="showAdd"
          :disabled="!pc?.id"
          variant="primary"
          size="lg"
          class="mt-2"
          @click="add"
        >
          Add location
        </b-button>
        <b-button
          v-else
          variant="secondary"
          size="lg"
          class="mt-2"
          @click="$emit('cancel')"
        >
          Cancel
        </b-button>
      </div>
      <hr v-if="!last" class="text-muted mb-1 mt-1" />
    </template>
  </div>
</template>
<script>
import { mapState } from 'pinia'
import { useLocationStore } from '../stores/location'
import { useMessageStore } from '../stores/message'
import { ref } from '#imports'
import PostCode from '~/components/PostCode'
import SpinButton from '~/components/SpinButton'
import { useIsochroneStore } from '~/stores/isochrone'

export default {
  components: {
    PostCode,
    SpinButton,
  },
  props: {
    id: {
      type: Number,
      required: false,
      default: null,
    },
    addButton: {
      type: Boolean,
      required: false,
      default: false,
    },
    last: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
  async setup(props) {
    const isochroneStore = useIsochroneStore()
    const locationStore = useLocationStore()
    const messageStore = useMessageStore()

    const minutes = ref(20)
    const transport = ref('Drive')
    if (props.id) {
      minutes.value = isochroneStore.get(props.id).minutes
      transport.value = isochroneStore.get(props.id).transport
    }

    const isochrone = computed(() => {
      if (props.id) {
        return isochroneStore.get(props.id)
      } else {
        return {
          minutes: minutes.value,
          transport: transport.value,
        }
      }
    })

    const location = computed(() => {
      if (isochrone.value.locationid) {
        return locationStore.byId(isochrone.value.locationid)
      }

      return null
    })

    if (isochrone.value.locationid) {
      await locationStore.fetchv2(isochrone.value.locationid)
    }

    const deleteLocation = async (callback) => {
      await isochroneStore.delete({ id: props.id })
      callback()
    }

    return {
      isochroneStore,
      locationStore,
      messageStore,
      minutes,
      transport,
      isochrone,
      location,
      deleteLocation,
    }
  },
  data() {
    return {
      minMinutes: 5,
      maxMinutes: 45,
      pc: null,
      nickname: null,
      step: 5,
    }
  },
  computed: {
    ...mapState(useIsochroneStore, ['list']),
    pcname() {
      return this.pc ? this.pc.name : ''
    },
    showAdd() {
      let ret = false

      if (
        !this.id &&
        this.pc &&
        this.minutes &&
        this.transport &&
        this.nickname
      ) {
        // Check the postcode doesn't already appear.
        ret = true

        Object.values(this.list).forEach((i) => {
          if (i.location?.name === this.pc) {
            ret = false
          }
        })
      }

      return ret
    },
    nameState() {
      if (this.id) {
        return null
      } else if (this.nickname) {
        return true
      } else if (!this.pcname) {
        return null
      } else {
        // We're adding, we have a postcode but no name.
        return false
      }
    },
  },
  watch: {
    minutes(newVal) {
      this.changeMinutes(newVal)
    },
  },
  methods: {
    increment() {
      this.minutes = Math.min(this.minutes + this.step, this.maxMinutes)
      this.changeMinutes(this.minutes)
    },
    decrement() {
      this.minutes = Math.max(this.minutes - this.step, this.minMinutes)
      this.changeMinutes(this.minutes)
    },
    changeMinutes(newVal) {
      if (this.id) {
        this.isochroneStore.edit({
          id: this.id,
          minutes: newVal,
          transport: this.isochrone.transport,
        })

        if (this.me?.settings?.browseView) {
          // This might change the count we should see
          this.messageStore.fetchCount(this.me?.settings?.browseView, false)
        }
      }

      this.minutes = newVal
    },
    changeTransport(type) {
      if (this.id) {
        this.isochroneStore.edit({
          id: this.id,
          minutes: this.minutes,
          transport: type,
        })
      }

      this.transport = type
    },
    selectPostcode(pc) {
      this.pc = pc
    },
    clearPostcode() {
      this.pc = null
    },
    async add() {
      if (this.pc?.id) {
        await this.isochroneStore.add({
          minutes: this.minutes,
          transport: this.transport,
          locationid: this.pc.id,
          nickname: this.nickname,
        })

        this.minutes = 25
        this.transport = null
        this.pc = null
        this.nickname = null
        this.$emit('added')
      }
    },
  },
}
</script>
<style scoped lang="scss">
@import 'bootstrap/scss/functions';
@import 'bootstrap/scss/variables';
@import 'bootstrap/scss/mixins/_breakpoints';

:deep(button) {
  box-shadow: none !important;
}

.layout {
  display: grid;

  grid-template-rows: auto auto auto auto;
  grid-template-columns: auto auto;

  .sliderLabel {
    grid-row: 1 / 2;
    grid-column: 1 / 3;
    display: flex;
    justify-content: flex-start;
  }

  .slider {
    grid-row: 2 / 3;
    grid-column: 1 / 2;
    display: flex;
  }

  .travelLabel {
    grid-row: 3 / 4;
    grid-column: 1 / 2;
    display: none;
  }

  .travel {
    grid-row: 2 / 3;
    grid-column: 2 / 3;
    display: flex;
    justify-content: flex-end;
    margin-left: 1rem;
  }

  @include media-breakpoint-up(md) {
    grid-template-rows: auto auto;
    grid-template-columns: 1fr 1fr;
    grid-column-gap: 50px;

    .sliderLabel {
      grid-row: 1 / 2;
      grid-column: 1 / 2;
      display: flex;
      justify-content: space-between;
    }

    .slider {
      grid-row: 2 / 3;
      grid-column: 1 / 2;
      display: flex;
    }

    .travelLabel {
      grid-row: 1 / 2;
      grid-column: 2 / 3;
      display: flex;
      justify-content: flex-end;
    }

    .travel {
      grid-row: 2 / 3;
      grid-column: 2 / 3;
      display: flex;
      justify-content: flex-end;
    }
  }
}
</style>
