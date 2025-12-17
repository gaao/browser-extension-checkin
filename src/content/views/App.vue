<script setup lang="ts">
import { ref } from 'vue'
console.log('加载contentScript.js');
type CheckinItem = {
  link: string;
  homePageName: string;
  btnXPath: string;
}
const showBtn = ref(false)
let findCheckin = ref<CheckinItem>({ link: '', homePageName: '', btnXPath: '' })
const initContent = async () => {
  //从缓存读取打卡列表如果和当前页面元素匹配则不显示
  const data = await chrome.storage.sync.get('checkinLists').then(res => res.checkinLists) as string;
  const checkinLists: CheckinItem[] = data ? JSON.parse(data) : [];
  console.log('checkinLists++:', checkinLists);
  if (checkinLists) {
    const hasCurrentPage = checkinLists.filter(item => item.link.includes(window.location.hostname));
    if (hasCurrentPage.length > 0) {
      showBtn.value = false;
      return;
    }
  }
  // 检查页面是否包含打卡相关元素
  const hasCheckinSelector = await detectCheckinElements()
  if (hasCheckinSelector) {
    showBtn.value = true;
  }
}
initContent();

const addToList = async () => {
  if (!checkinSelector.value || !checkinHomeText.value) {
    alert('请先填写签到元素和网站名');
    return;
  }
  findCheckin.value.btnXPath = checkinSelector.value;
  findCheckin.value.link = window.location.href;
  findCheckin.value.homePageName = checkinHomeText.value;
  // chrome.runtime.sendMessage({ action: 'addCheckin', data: findCheckin });
  const data = await chrome.storage.sync.get('checkinLists').then(res => res.checkinLists) as string;
  let checkinLists: CheckinItem[];
  if (!data || data.length === 0) {
    checkinLists = [];
  } else {
    checkinLists = JSON.parse(data) || [];
  }
  console.log('checkinLists1:', checkinLists);
  // 解析JSON字符串
  let result = []
  if (!checkinLists) {
    result = [findCheckin.value];
  } else {
    // const checkinListsObj = checkinLists ? JSON.parse(checkinLists) : [];
    const checkinListsObj = checkinLists ? checkinLists : [];
    result = (Array.isArray(checkinListsObj) ? [...checkinListsObj, findCheckin.value] : [findCheckin.value]);
  }
  console.log('checkinLists2:', result);
  const dataSize = JSON.stringify(result).length;
  if (dataSize > 1024 * 4) {
    console.error('数据大小超过限制，不允许存储');
    alert('数据大小超过限制，不允许存储');
    return;
  }
  chrome.storage.sync.set({ checkinLists: JSON.stringify(result) }, function () {
    console.log('checkinLists Value is set to ' + JSON.stringify(result));
  });
  // console.log('checkinLists2:', result.forEach(item => Object.keys(item)));
  // chrome.storage.sync.set({ checkinUrls: result.map(item => Object.keys(item)[0]) }, function () {
  //   console.log('checkinUrls Value is set to ' + JSON.stringify(result.map(item => Object.keys(item)[0])));
  // });
  showBtn.value = false
}

// 监听来自后台的消息
// chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
//   if (request.action === 'detectCheckin') {
//     const result = detectCheckinElements();
//     sendResponse(result);
//   }
//   return true;
// });
const checkinSelector = ref('');
const checkinHomeText = ref('');
// 检测页面中的签到元素
async function detectCheckinElements() {
  const result = {
    buttons: [] as { text: string, selector: string }[],
    links: ''
  };
  let hasCheckinSelector = false;
  // 查找可能的签到按钮（根据常见关键词）
  let checkinKeywords: string[] = [];
  // 从Storage获取关键字
  await chrome.storage.sync.get('checkinKeywords').then(data => {
    if (data.checkinKeywords) {
      checkinKeywords = (data.checkinKeywords as string).split(',');
      console.log('签到关键词:', typeof data.checkinKeywords, checkinKeywords);
    }
    if (!checkinKeywords) {
      console.error('请检查是否配置了签到关键词');
      return result;
    }
    for (let keyword of checkinKeywords) {
      // checkinKeywords.forEach(keyword => {
      // 使用 normalize-space 忽略多余空白，并支持大小写不敏感匹配
      // 构造 XPath：在整棵 DOM 树（.//）中查找任意元素（*），
      // 只要其“规范化后的纯文本内容”包含关键词即可。
      // normalize-space(text()) 会去掉首尾空白并把内部连续空白压缩成单个空格，避免多余空格干扰匹配。
      // 同时匹配按钮文字、子节点文字、以及图片 alt 属性
      const xpath = `.//*[
        contains(normalize-space(text()), '${keyword}') 
        or contains(normalize-space(.//*), '${keyword}')
        or @alt and contains(@alt, '${keyword}')
      ]`;
      // console.log('xxx:', xpath);
      const elements = document.evaluate(
        xpath,
        document.body,
        null,
        XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
        null
      );
      if (elements) {
        hasCheckinSelector = true;
        return
      } else {
        continue;
      }
      // // console.log('elements:', elements);
      // for (let i = 0; i < elements.snapshotLength; i++) {
      //   const element = elements.snapshotItem(i);
      //   // console.log('element:', element);
      //   if (!element) {
      //     continue;
      //   }
      //   // 检查是否指定了签到按钮选择器
      //   if (checkinSelector.value && element.matches(checkinSelector.value)) {
      //     continue;
      //   }
      //   // console.log('element.nodeName:', element.nodeName);
      //   if (element.nodeName === 'BUTTON' || element.nodeName === 'A' || element.nodeName === 'SPAN' || element.nodeName === 'IMG') {
      //     const resuItemButton = {
      //       text: (element as Element).textContent?.trim() || (element as HTMLImageElement).alt?.trim() || '',
      //       selector: getSelector(element)
      //     };
      //     console.log('resuItemButton:', resuItemButton);
      //     result.buttons.push(resuItemButton);
      //     // 获取网页链接
      //     const link = (element as HTMLAnchorElement).href || window.location.href;
      //     result.links = link;
      //     // console.log('result1:', result);
      //   }
      // }
    };
  });

  return hasCheckinSelector;
}

// // 获取元素的CSS选择器
// function getSelector(element: Node) {
//   if (element.nodeType !== Node.ELEMENT_NODE) {
//     return '';
//   }
//   const e = element as Element || HTMLImageElement;
//   if (e.id) {
//     return `#${e.id}`;
//   }
//   if (e.className) {
//     return `.${e.className.split(' ').join('.')}`;
//   }
//   if (e.tagName === 'IMG') {
//     return `img[alt="${(e as HTMLImageElement).alt?.trim() || ''}"]`;
//   }
//   // if (e.tagName === 'SPAN') {
//   //   return `span[text="${(e as Element).textContent?.trim() || ''}"]`;
//   // }
//   return e.tagName;
// }


</script>

<template>
  <div class="popup-container" v-show="showBtn">
    <input type="text" placeholder="指定签到按钮的xpath" v-model="checkinSelector">
    <input type="text" placeholder="网站名" v-model="checkinHomeText">
    <button class="add-to-list" @click="addToList()">
      <!-- <img src="@/assets/logo.png" class="logo crx" alt="logo"> -->
      添加到插件
    </button>
    <!-- 指定签到按钮 -->
  </div>
</template>

<style scoped>
.popup-container {
  position: fixed;
  right: 0;
  bottom: 0;
  margin: 1.25rem;
  padding: 0.5rem 1rem;
  z-index: 9999;
  display: flex;
  align-items: flex-end;
  font-family: ui-sans-serif, system-ui, sans-serif;
  user-select: none;
  line-height: 1em;
}


.add-to-list {
  display: flex;
  justify-content: center;
  font-size: 13px;
  padding: 0.5rem 1rem;
  border-radius: 9999px;
  box-shadow:
    0 1px 3px 0 rgb(0 0 0 / 0.3),
    0 1px 2px -1px rgb(0 0 0 / 0.3);
  cursor: pointer;
  border: none;
  color: #ffffff;
  background-color: #288cd7;
}

.add-to-list:hover {
  background-color: #1e6aa3;
}

.button-icon {
  padding: 4px;
}
</style>
