import DefaultTheme from 'vitepress/theme'
import CodeLens from '../../components/CodeLens.vue'
import './style.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('CodeLens', CodeLens)
  }
}

