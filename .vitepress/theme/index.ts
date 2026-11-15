// https://vitepress.dev/guide/custom-theme
import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import './styles/style.css'
import MyLayout from "./layouts/MyLayout.vue";
import GHRepo from "./components/GHRepo.vue";
import GHReadme from "./components/GHReadme.vue";
import BlogList from "./components/BlogList.vue";
import MusicCard from "./components/MusicCard.vue";

import 'netease-mini-player-v3/auto';
import 'netease-mini-player-v3-plus';
import Spoiler from "./components/Spoiler.vue";
import BilibiliVideoPlayer from "./components/BilibiliVideoPlayer.vue";
import { TegakiRenderer } from "tegaki/vue";

export default {
  extends: DefaultTheme,
  Layout: MyLayout,
  enhanceApp({ app }) {
    app.component('GHRepo', GHRepo)
    app.component('GHReadme', GHReadme)
    app.component('BlogList', BlogList)
    app.component('MusicCard', MusicCard)
    app.component('Spoiler', Spoiler)
    app.component('BilibiliVideoPlayer', BilibiliVideoPlayer)
    app.component('TegakiRenderer', TegakiRenderer)
  }
} satisfies Theme
