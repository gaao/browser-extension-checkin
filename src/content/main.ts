import { createApp } from 'vue'
import App from './views/App.vue'

console.log('[CRXJS] Hello world from content script!')

/**
 * Mount the Vue app to the DOM.
 */
function mountApp() {
  const container = document.createElement('div')
  container.id = 'crxjs-app'
  document.body.appendChild(container)
  const app = createApp(App)
  if (document.readyState === 'complete') {
    console.log('[CRXJS] document.readyState is complete, mount app')
    // * 手动等待 2s 确保 DOM 元素加载完成应该有更好的方式
    setTimeout(() => {
      app.mount(container)
    }, 2000)
  }
}

mountApp()
