<script setup lang="ts">
  import { onMounted } from "vue";

  onMounted(() => {
    const script = document.createElement("script");
    script.src = "https://fastly.jsdelivr.net/npm/live2d-widgets@1.0.1/dist/autoload.js"
    script.async = true;

    script.onload = () => {
      console.log("Live2DWidget loaded!");
    }

    document.head.appendChild(script);
  });
</script>

<template></template>

<style>
#waifu {
  z-index: 150 !important;
}

#waifu-toggle {
  bottom: 95px !important;
}

@media (max-width: 768px) {
  #waifu { display: none; }
}

@media (max-width: 768px) {
  #waifu-toggle { display: none; }
}
</style>
