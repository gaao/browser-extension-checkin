<script setup lang="ts">
import { ref } from 'vue';
import CheckinListCU from '@/components/CheckinListCU.vue';

type CheckinItem = {
  link: string;
  homePageName: string;
  btnXPath: string;
}
const checkinLists = ref<Array<CheckinItem>>([]);
document.addEventListener('DOMContentLoaded', async () => {
  await initPopup();
});

async function initPopup() {
  // 加载状态
  const status = await chrome.runtime.sendMessage({ action: 'getStatus' });
  // 显示最后签到时间
  const lastCheckinEl = document.getElementById('lastCheckinTime');
  if (lastCheckinEl) {
    if (status.lastCheckinDate) {
      lastCheckinEl.textContent = `最后签到: ${formatDate(status.lastCheckinDate)}`;
    } else {
      lastCheckinEl.textContent = '今天尚未签到';
    }
  }
  // 显示网站数量
  const totalSitesEl = document.getElementById('totalSites');
  if (totalSitesEl) {
    totalSitesEl.textContent = status.totalUrls;
  }
  // 立即签到按钮
  const checkinNowEl = document.getElementById('checkinNow')
  if (checkinNowEl) {
    checkinNowEl.addEventListener('click', async () => {
      const button = document.getElementById('checkinNow');
      if (button) {
        const originalText = button.textContent;
        button.hidden = true;
        button.textContent = '签到中...';
        try {
          const result = await chrome.runtime.sendMessage({ action: 'checkinNow' });
          if (result.success) {
            // 刷新状态
            setTimeout(initPopup, 2000);
          }
        } finally {
          setTimeout(() => {
            button.hidden = false;
            button.textContent = originalText;
          }, 3000);
        }
      }
    });
  }

  // 重置今日签到状态
  const resetTodayEl = document.getElementById('resetToday')
  if (resetTodayEl) {
    resetTodayEl.addEventListener('click', async () => {
      if (confirm('确定要重置今天的签到状态吗？重置后会再次提醒签到。')) {
        await chrome.runtime.sendMessage({ action: 'resetToday' });
        alert('已重置！下次打开浏览器时会再次提醒签到。');
        initPopup();
      }
    });
  }

  // 显示/隐藏网站列表
  const toggleListEl = document.getElementById('toggleList')
  if (toggleListEl) {
    toggleListEl.addEventListener('click', () => {
      // 切换图标
      toggleListEl.textContent = toggleListEl.textContent === '▼' ? '▲' : '▼';

      const list = document.getElementById('urlList');
      if (list) {
        list.style.display = list.style.display === 'none' ? 'block' : 'none';
      }
    });
  }

  // 加载网站列表
  await loadUrlList();
}

// 格式化日期
function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// 加载网站列表
async function loadUrlList() {
  const data = await chrome.storage.sync.get('checkinLists').then(res => res.checkinLists) as string;
  console.log('datauuuu:', typeof data, data);
  checkinLists.value = JSON.parse(data) as CheckinItem[] || [];
  const list = document.getElementById('urlList');
  if (list) {
    // 绑定按钮事件
    attachListEvents();
  }
}

// 绑定列表事件
function attachListEvents() {
  // 测试按钮
  document.querySelectorAll('.test-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const target = e.target as HTMLElement;
      if (!target) return;
      const url = target.dataset.url;
      console.log('签到url:', url);
      // if (url) await testSingleCheckin(url);
      // 自动签到
      // 调用后台脚本执行单个签到
      await chrome.runtime.sendMessage({ action: 'checkinNow', url });
    });
  });


  // 移除按钮
  document.querySelectorAll('.remove-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const target = e.target as HTMLElement;
      console.log('removetarget:', target);
      if (!target) return;
      const url = target.dataset.url;
      if (!url) return;
      if (confirm(`确定要移除 ${new URL(url).hostname} 的签到吗？`)) {
        await removeCheckinUrl(url);
        await loadUrlList();
      }
    });
  });
}
// 编辑按钮
const editCheckinItem = (item: CheckinItem) => {
  showAddBtn.value = true;
  handleType.value = 'update';
  currentItem.value.btnXPath = item.btnXPath || '';
  currentItem.value.homePageName = item.homePageName || '';
  currentItem.value.link = item.link || document.location.href;
}
// // 测试单个网站签到
// async function testSingleCheckin(url: string) {
//   // 修复：确保 url 参数正确拼接到 test.html 地址
//   chrome.tabs.create({
//     url: encodeURIComponent(url),
//     active: true
//   });
// }
// 添加签到网站
const showAddBtn = ref(false);
const currentItem = ref<CheckinItem>({} as CheckinItem);
const handleType = ref('create');
const addCheckinItem = () => {
  showAddBtn.value = true;
  handleType.value = 'create';
}
const handleItemOK = async () => {
  await loadUrlList();
  showAddBtn.value = false;
}
// 移除签到网站
async function removeCheckinUrl(url: string) {
  const data = await chrome.storage.sync.get('checkinLists').then(res => res.checkinLists) as string;
  console.log('checkinListsremove:', data);
  if (!data || data.length === 0) {
    return;
  }
  const checkinLists: CheckinItem[] = JSON.parse(data) || [];
  console.log('checkinListsremove2:', checkinLists);
  await chrome.storage.sync.set({
    checkinLists: JSON.stringify(checkinLists.filter(item => item.link !== url))
  });
  await loadUrlList();
}

// 打开详细设置页面
function openOptionsPage() {
  chrome.runtime.openOptionsPage();
}
</script>

<template>
  <!-- <HelloWorld msg="Vite + Vue + CRXJS" /> -->
  <div class="container">
    <div class="header">
      <h3>📅 每日签到助手</h3>
      <div class="status-indicator" id="statusIndicator"></div>
    </div>

    <div class="status-card">
      <p id="lastCheckinTime">加载中...</p>
      <p>待签到网站: <span id="totalSites">0</span> 个</p>
    </div>

    <div class="action-buttons">
      <button id="checkinNow" class="btn-primary">🎯 立即签到</button>
      <button id="resetToday" class="btn-secondary">🔄 重置今日状态</button>
    </div>

    <div class="section">
      <div class="section-header">
        <h4>📋 签到网站列表</h4>
        <button id="toggleList" class="btn-toggleicon" alt="切换列表显示">▼</button>
      </div>
      <div id="urlList" class="url-list">
        <li v-for="(item, index) in checkinLists" :key="item.link" class="url-item">
          <div class="url-info">
            <span class="url-index"> {{ index + 1 }} </span>
            <span class="url-hostname">{{ item.homePageName }}</span>
          </div>
          <div class="url-actions">
            <button class="btn-small edit-btn" data-url="{{ item }}" @click="editCheckinItem(item)">编辑</button>
            <button class="btn-small remove-btn" data-url="{{ item.link }}"
              @click="removeCheckinUrl(item.link)">移除</button>
          </div>
        </li>
        <button v-show="!showAddBtn" class="btn-success addbtn" @click="addCheckinItem">+ 添加更多</button>
        <CheckinListCU :show="showAddBtn" :type="handleType" :current-item="currentItem" :current-list="checkinLists"
          @ok="handleItemOK" @cancel="showAddBtn = false" />
        <div v-show="showAddBtn" class="current-site">
        </div>
      </div>
    </div>



    <!-- <div class="quick-settings">
      <label class="switch">
        <input type="checkbox" id="enableNotifications">
        <span class="slider"></span>
        <span class="switch-label">启用签到提醒</span>
      </label>

      <label class="switch">
        <input type="checkbox" id="autoCloseTabs">
        <span class="slider"></span>
        <span class="switch-label">自动关闭签到标签页</span>
      </label>
    </div> -->

    <div class="footer">
      <button id="openSettings" class="btn-link" @click="openOptionsPage">⚙️ 详细设置</button>
      <!-- <button id="viewLogs" class="btn-link">📊 查看日志</button> -->
    </div>
  </div>
</template>

<style scoped>
button {
  border-style: none;
}

.container {
  background: white;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 2px solid #f0f0f0;
}

.header h3 {
  color: #333;
  font-size: 18px;
}

.status-indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #4CAF50;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    opacity: 1;
  }

  50% {
    opacity: 0.5;
  }

  100% {
    opacity: 1;
  }
}

.status-card {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
  border-left: 4px solid #667eea;
}

.status-card p {
  margin: 8px 0;
  color: #555;
  font-size: 14px;
}

.action-buttons {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.btn-primary,
.btn-secondary,
.btn-success {
  flex: 1;
  padding: 6px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.addbtn {
  width: 100%;
  color: #4b4e55;
  border: 1px dashed #73757e;
  opacity: 0.5;
}

.btn-success:hover {
  opacity: 1;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
}

.btn-secondary {
  background: #f0f0f0;
  color: #666;
}

.btn-secondary:hover {
  background: #e0e0e0;
}

.section {
  margin: 20px 0;
  padding: 15px;
  background: #fafafa;
  border-radius: 8px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.section-header h4 {
  color: #444;
  font-size: 15px;
}

.section-header .btn-toggleicon {
  font-size: 14px;
  color: #667eea;
  cursor: pointer;
}

.url-list {
  max-height: 200px;
  overflow-y: auto;
}

.url-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  margin: 5px 0;
  background: white;
  border-radius: 6px;
  border: 1px solid #eee;
}

.url-info {
  flex: 1;
}

.url-index {
  color: #667eea;
  font-weight: bold;
  margin-right: 8px;
}

.url-rules {
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 10px;
  margin-left: 8px;
}

.url-rules[data-status="configured"] {
  background: #d4edda;
  color: #155724;
}

.url-rules[data-status="unconfigured"] {
  background: #fff3cd;
  color: #856404;
}

.url-actions {
  display: flex;
  gap: 5px;
}

.btn-small {
  padding: 4px 8px;
  font-size: 11px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  background: #f0f0f0;
}

.test-btn {
  background: #e3f2fd;
  color: #1976d2;
}

.edit-btn {
  background: #f3e5f5;
  color: #7b1fa2;
}

.remove-btn {
  background: #ffebee;
  color: #d32f2f;
}

.current-site {
  padding: 8px;
  background: #e8f4ff;
  border-radius: 8px;
  margin: 20px 0;
}

.current-site p {
  margin-bottom: 10px;
  color: #1a73e8;
  font-size: 13px;
}


.quick-settings {
  margin: 20px 0;
}

.switch {
  position: relative;
  display: flex;
  align-items: center;
  margin: 10px 0;
  cursor: pointer;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: relative;
  width: 50px;
  height: 24px;
  background: #ccc;
  border-radius: 24px;
  transition: .4s;
  margin-right: 10px;
}

.slider:before {
  content: "";
  position: absolute;
  height: 16px;
  width: 16px;
  left: 4px;
  bottom: 4px;
  background: white;
  border-radius: 50%;
  transition: .4s;
}

input:checked+.slider {
  background: #667eea;
}

input:checked+.slider:before {
  transform: translateX(26px);
}

.switch-label {
  font-size: 13px;
  color: #555;
}

.footer {
  display: flex;
  justify-content: space-between;
  padding-top: 15px;
  border-top: 1px solid #eee;
}

.btn-link {
  background: none;
  border: none;
  color: #667eea;
  font-size: 12px;
  cursor: pointer;
  padding: 5px;
}

.btn-link:hover {
  text-decoration: underline;
}

.add-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.add-input {
  display: flex;
  align-items: center;
}

.add-container label {
  text-align: left;
  text-align-last: justify;
  width: 80px;
  color: #555;
}

.add-container input[type="text"] {
  width: calc(100% - 24px);
  padding: 6px 12px;
  border-radius: 8px;
  border: 1px solid #ccc;
}

.add-to-list {
  padding: 6px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.add-to-list:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
}

.cancel-btn {
  padding: 6px 12px;
  margin-left: 10px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: #f0f0f0;
  color: #666;
}

.cancel-btn:hover {
  background: #e0e0e0;
}
</style>
