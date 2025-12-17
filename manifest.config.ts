import { defineManifest } from '@crxjs/vite-plugin'
import pkg from './package.json'

export default defineManifest({
  manifest_version: 3,
  name: pkg.name,
  version: pkg.version,
  icons: {
    48: 'public/logo.png',
  },
  action: {
    default_title: "自动签到助手",
    default_icon: {
      48: 'public/logo.png',
    },
    default_popup: 'src/popup/index.html',
  },
  content_scripts: [{
    js: ['src/content/main.ts'],
    matches: ['https://*/*'],
    run_at: "document_idle"
  }],
  permissions: [
    "alarms",
    'sidePanel',
    'contentSettings',
    "tabs",
    "storage",
    "scripting",
    "activeTab",
    "notifications"
  ],
  host_permissions: [
    "<all_urls>"
  ],
   background: {
    service_worker: "src/background/background.js"
  },
  options_page: "src/options/index.html",
  side_panel: {
    default_path: 'src/sidepanel/index.html',
  },
})
