<script setup lang="ts">
import { ref } from 'vue'

defineProps({
  msg: String,
})
const defaultCheckinKeywords = ref('签到,打卡,每日签到,每日登录,领积分');

document.addEventListener('DOMContentLoaded', async () => {
  init() // 初始化
});

const init = () => {
  // 从 localStorage 获取已保存的关键字
  chrome.storage.sync.get('checkinKeywords', function (data) {
    if (data.checkinKeywords) {
      // document.getElementById('currentKeywords').textContent = data.checkinKeywords;
      defaultCheckinKeywords.value = data.checkinKeywords as string;
    }
    else {
      // document.getElementById('currentKeywords').textContent = defaultCheckinKeywords.value;
      defaultCheckinKeywords.value = defaultCheckinKeywords.value.trim();
      // 存储到 localStorage
      chrome.storage.sync.set({ checkinKeywords: defaultCheckinKeywords.value }, function () {
        console.log('defaultCheckinKeywords Value is set to ' + defaultCheckinKeywords.value);
      });
    }
  });
}
// 提交关键字
const submitKeywords = () => {
  const checkinKeywordsInput = document.getElementById('checkinKeywords') as HTMLInputElement;
  const newKeywords = checkinKeywordsInput.value.trim();
  if (newKeywords) {
    // 更新展示
    defaultCheckinKeywords.value = newKeywords;
    // 存储到 localStorage
    chrome.storage.sync.set({ checkinKeywords: newKeywords }, function () {
      console.log('newCheckinKeywordsValue is set to ' + newKeywords);
    });
  }
};

</script>

<template>
  <h2>签到规则设置</h2>
  <div id="rulesContainer"></div>
  <!-- 
  <button id="detectElements">检测签到元素</button>
  <button id="saveRules">保存规则</button> -->
  <div>
    <h3>
      检测页面中的签到元素时，会根据以下关键字进行筛选：
    </h3>
    <!-- 展示当前关键字 -->
    <p id="currentKeywords">{{ defaultCheckinKeywords }}</p>
    <label for="checkinKeywords">修改关键字：</label>
    <!-- 检测页面中的签到元素关键字 -->
    <input type="text" id="checkinKeywords" placeholder="输入关键字（英文逗号分隔）">
    <!-- 提交按钮 -->
    <button id="submitKeywords" @click="submitKeywords">提交</button>
  </div>
  <p class="read-the-docs">
    查看
    <a href="https://github.com/gaao/browser-extension-checkin" target="_blank">browser-extension-checkin</a> 最新版本
  </p>


</template>

<style scoped>
a {
  font-weight: 500;
  color: #646cff;
  text-decoration: inherit;
}

a:hover {
  color: #535bf2;
}

body {
  margin: 0;
  display: flex;
  place-items: center;
  min-height: 100vh;
}


button {
  border-radius: 8px;
  border: 1px solid transparent;
  padding: 0.6em 1.2em;
  font-size: 1em;
  font-weight: 500;
  font-family: inherit;
  background-color: #1a1a1a;
  cursor: pointer;
  transition: border-color 0.25s;
}

button:hover {
  border-color: #646cff;
}

button:focus,
button:focus-visible {
  outline: 4px auto -webkit-focus-ring-color;
}

#app {
  max-width: 1280px;
  margin: 0 auto;
  padding: 2rem;
}

@media (prefers-color-scheme: light) {
  :root {
    color: #213547;
    background-color: #ffffff;
  }

  a:hover {
    color: #747bff;
  }

  button {
    background-color: #f9f9f9;
  }
}


#currentKeywords {
  font-size: larger;
  color: #43bb81;
  width: fit-content;
  background: #f4f5f7;
  padding: 5px 10px;
  border-radius: 6px;
}

#submitKeywords {
  margin-top: 10px;
  background: #43bb81;
  color: #fff;
}

input#checkinKeywords {
  width: 300px;
  margin: 5px 5px 5px 0;
  padding: 0.6em 1.2em;
  border-radius: 8px;
  border: 1px solid #ddd;
}

.read-the-docs {
  color: #888;
}
</style>
