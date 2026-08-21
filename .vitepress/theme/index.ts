// https://vitepress.dev/guide/custom-theme
import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import './styles/style.css'
import MyLayout from "./layouts/MyLayout.vue";
import GHRepo from "./components/GHRepo.vue";
import GHReadme from "./components/GHReadme.vue";
import BlogList from "./components/BlogList.vue";
import MusicCard from "./components/MusicCard.vue";

export default {
  extends: DefaultTheme,
  Layout: MyLayout,
  enhanceApp({ app }) {
    app.component('GHRepo', GHRepo)
    app.component('GHReadme', GHReadme)
    app.component('BlogList', BlogList)
    app.component('MusicCard', MusicCard)
  }
} satisfies Theme
