<script setup lang="ts">
import { PropType, ref } from 'vue';
type CheckinItem = {
  link: string;
  homePageName: string;
  btnXPath: string;
}
const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  type: {
    type: String,
    default: 'create'
  },
  currentItem: {
    type: Object as PropType<CheckinItem>,
    default: () => ({})
  },
  currentList: {
    type: Array as PropType<Array<CheckinItem>>,
    default: () => []
  }
});
const emit = defineEmits(['ok', 'cancel']);
function onCancel() {
  emit('cancel');
}
const checkinLists = ref<Array<CheckinItem>>(props.currentList);
const currentItem = ref<CheckinItem>(props.currentItem);
async function addCheckinItem() {
  if (!currentItem.value.btnXPath || !currentItem.value.homePageName) {
    alert('请输入签到按钮的 XPath 和网站名');
    return;
  }
  const newItem: CheckinItem = {
    link: currentItem.value.link,
    homePageName: currentItem.value.homePageName,
    btnXPath: currentItem.value.btnXPath
  };
  console.log('newItem:', props.type, newItem);
  if (props.type === 'create') {
    checkinLists.value.push(newItem);
  } else {
    const index = checkinLists.value.findIndex(item => item.link === newItem.link);
    if (index !== -1) {
      checkinLists.value[index] = newItem;
    }
  }
  await chrome.storage.sync.set({
    checkinLists: JSON.stringify(checkinLists.value)
  });
  // await loadUrlList();
  emit('ok');
}

</script>
<template>
  <div v-if="show" class="list-container">
    <div class="item-input">
      <label for="checkinSelector">签到按钮 XPath：</label>
      <input type="text" placeholder="请输入" v-model="currentItem.btnXPath">
    </div>
    <div class="item-input">
      <label for="checkinHomeText">网 站 名：</label>
      <input type="text" placeholder="请输入" v-model="currentItem.homePageName">
    </div>
    <div class="item-input">
      <label for="checkinHomeLink">网站地址：</label>
      <input id="checkinHomeLink" type="text" placeholder="请输入" v-model="currentItem.link">
    </div>
    <div class="item-input">
      <button class="btn-primary" @click="addCheckinItem">保存</button>
      <button class="cancel-btn" @click="onCancel">取消</button>
    </div>
  </div>
</template>
<style scoped>
.list-container {
  padding: 15px;
  background: #fafafa;
  border-radius: 8px;
}

.item-input {
  display: flex;
  align-items: center;
}

.item-input label {
  text-align: left;
  text-align-last: justify;
  width: 80px;
  color: #555;
}

.item-input input[type="text"] {
  width: calc(100% - 24px);
  padding: 6px 12px;
  border-radius: 8px;
  border: 1px solid #ccc;
}

button {
  padding: 6px 12px;
  border-radius: 8px;
  border: 1px solid #667eea;
  background: #667eea;
  color: #fff;
}

.cancel-btn {
  padding: 6px 12px;
  margin-left: 10px;
  border-radius: 8px;
  cursor: pointer;
  border: none;
  transition: all 0.3s ease;
  background: #f0f0f0;
  color: #666;
}

.cancel-btn:hover {
  background: #e0e0e0;
}
</style>