<template>
  <p class="github-repo">
    <a v-if="displayType === 'link' || displayType === 'full'"
       :href="`https://github.com/${owner}/${repo}`">
      {{ customTitle || `${owner}/${repo}` }}
    </a>
    <a v-if="displayType === 'license' || displayType === 'full'"
       class="license-wrapper"
       :href="`https://github.com/${owner}/${repo}`">
      <img
          :src="`https://img.shields.io/github/license/${owner}/${repo}`"
          :alt="`${repo} License`"
      />
    </a>
  </p>
</template>

<script setup>

const props = defineProps({
  owner: {
    type: String,
    required: true,
  },
  repo: {
    type: String,
    required: true,
  },
  customTitle: {
    type: String
  },
  displayType: {
    type: String,
    default: 'full',
    validator: (value) => ['link', 'license', 'full'].includes(value)
  }
})

</script>

<style scoped>
.github-repo{
  display: inline;
}

.license-wrapper img {
  display: inline !important;
  vertical-align: middle;
  margin: 0 6px 4px 2px;
}
</style>