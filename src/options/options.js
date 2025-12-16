
const defaultCheckinKeywords = '签到,打卡,每日签到,checkin,每日登录,领积分';

document.addEventListener('DOMContentLoaded', async () => {
  // const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  // // 检测签到元素
  // document.getElementById('detectElements').addEventListener('click', async () => {
  //   const result = await chrome.tabs.sendMessage(tab.id, { action: 'detectCheckin' });
  //   displayDetectedElements(result);
  // });

  // function displayDetectedElements(elements) {
  //   const container = document.getElementById('rulesContainer');

  //   elements.buttons.forEach(btn => {
  //     const div = document.createElement('div');
  //     div.className = 'rule-item';
  //     div.innerHTML = `
  //       <strong>${btn.text}</strong>
  //       <input type="text" value="${btn.selector}" class="selector-input" />
  //       <button class="test-btn">测试</button>
  //     `;
  //     container.appendChild(div);
  //   });
  // }

  // // 保存规则
  // document.getElementById('saveRules').addEventListener('click', async () => {
  //   const rules = {};
  //   // 收集规则逻辑...

  //   await chrome.storage.sync.set({ checkinRules: rules });
  //   alert('规则已保存');
  // });

  init() // 初始化

});

const init = () => {
  // 从 localStorage 获取已保存的关键字
  chrome.storage.sync.get('checkinKeywords', function (data) {
    if (data.checkinKeywords) {
      document.getElementById('currentKeywords').textContent = data.checkinKeywords;
    }
    else {
      document.getElementById('currentKeywords').textContent = defaultCheckinKeywords;
      // 存储到 localStorage
      chrome.storage.sync.set({ checkinKeywords: defaultCheckinKeywords }, function () {
        console.log('defaultCheckinKeywords Value is set to ' + defaultCheckinKeywords);
      });
    }
  });
}
// 提交关键字
document.getElementById('submitKeywords').addEventListener('click', () => {
  const checkinKeywordsInput = document.getElementById('checkinKeywords');
  const newKeywords = checkinKeywordsInput.value.trim();
  if (newKeywords) {
    // 更新展示
    document.getElementById('currentKeywords').textContent = newKeywords;
    // 存储到 localStorage
    chrome.storage.sync.set({ checkinKeywords: newKeywords }, function () {
      console.log('newCheckinKeywordsValue is set to ' + newKeywords);
    });
  }
});
