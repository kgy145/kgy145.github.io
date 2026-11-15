<template>
  <div class="gh-readme">
    <iframe :src="`https://player.bilibili.com/player.html?bvid=${bvid}`"
            scrolling="no"
            border="0"
            frameborder="no"
            framespacing="0"
            allowfullscreen="true">
    </iframe>
  </div>
</template>

<script setup>

const props = defineProps({
  bvid: {type: String, required: true},
})

</script>
