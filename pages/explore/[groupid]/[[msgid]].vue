<template>
  <client-only>
    <div>
      <b-row v-if="id && !group" class="m-0">
        <b-col cols="12" lg="6" class="p-0" offset-lg="3">
          <NoticeMessage variant="danger" class="mt-2">
            Sorry, we don't recognise that community name.
          </NoticeMessage>
        </b-col>
      </b-row>
      <b-row v-else class="m-0">
        <b-col cols="12" lg="6" class="p-0" offset-lg="3">
          <ExploreGroup :id="group.id" :msgid="msgid" :show-give-find="!me" />
        </b-col>
      </b-row>
    </div>
  </client-only>
</template>
<script setup>
import { useRoute } from 'vue-router'
import { buildHead } from '~/composables/useBuildHead'
import { useGroupStore } from '~/stores/group'

const runtimeConfig = useRuntimeConfig()
const route = useRoute()
const id = route.params.groupid
const msgid = parseInt(route.params.msgid)

const groupStore = useGroupStore()

const group = computed(() => {
  return groupStore.get(id)
})

if (id) {
  // Fetch the specific group.
  await groupStore.fetch(id, true)

  if (group.value) {
    useHead(
      buildHead(
        route,
        runtimeConfig,
        'Explore ' + group.value.namedisplay,
        group.value.description
          ? group.value.description
          : "Give and get stuff for free. Offer things you don't need, and ask for things you'd like. Don't just recycle - reuse with Freegle!",
        group.value.profile ? group.value.profile : '/icon.png'
      )
    )
  }
} else {
  // Fetch all groups for the map.  No need to await - rendering the map is eye candy.
  groupStore.fetch()
  useHead(
    buildHead(
      route,
      runtimeConfig,
      'Explore Freegle',
      "Give and get stuff for free. Offer things you don't need, and ask for things you'd like. Don't just recycle - reuse with Freegle!"
    )
  )
}
</script>
