import logoimg from '@/assets/logo.png';
// background.js
console.log('background.js');
type CheckinItem = {
  link: string;
  homePageName: string;
  btnXPath: string;
  isCheckedIn: boolean;
}
// 存储用户选择
let userPreferences = {
  autoCheckin: true,
  // checkinUrls: [] as string[],
  checkinLists: [] as CheckinItem[],
  checkinRules: {} as Record<string, { buttonSelector: any; buttonText: string; xpath: string; }>,
  lastCheckinDate: null as string | null,
  dontAskAgain: false,  // 不再询问选项
  rememberChoice: {}    // 记录每个网站的选择
} as Record<string, any>;

const isJSON = function (str: any) {
  if (typeof str == "string") {
    try {
      var obj = JSON.parse(str);
      if (typeof obj == "object" && obj) {
        return true;
      } else {
        return false;
      }
    } catch (e) {
      return false;
    }
  } else if (typeof str == "object") {
    return Object.prototype.toString.call(obj).toLocaleLowerCase() == "[object object]" && !obj.length;
  }
  return false;
}
// 初始化
async function initBackground() {
  const data = await chrome.storage.sync.get(Object.keys(userPreferences));
  console.log('data:', data);
  if (data) {
    Object.keys(data).forEach(key => {
      if (key in userPreferences) {
        const isJson = isJSON(data[key]);
        if (isJson) {
          userPreferences[key] = JSON.parse(data[key] as string);
        } else {
          userPreferences[key] = data[key];
        }
      }
    });
  }
  console.log('userPreferencesdata:', userPreferences);

  // Object.assign(userPreferences, data);
}

// 监听浏览器启动
chrome.runtime.onStartup.addListener(async () => {
  await initBackground();
  await checkAndAskForCheckin();
});

// 监听插件启动
chrome.runtime.onInstalled.addListener(async () => {
  await initBackground();
  console.log('自动签到插件已安装');
});

// 监听新窗口打开（针对第一次使用浏览器）
chrome.windows.onCreated.addListener(async (window) => {
  // 延迟一下，确保浏览器完全启动
  setTimeout(async () => {
    await checkAndAskForCheckin();
  }, 3000);
});

// 检查并询问是否签到
async function checkAndAskForCheckin() {
  const now = new Date();
  const today = now.toDateString();

  // 如果今天已经签到过，不再询问
  if (userPreferences.lastCheckinDate === today) {
    console.log('今天已签到过，跳过询问');
    return;
  }

  // 如果用户选择"不再询问"，直接执行或跳过
  if (userPreferences.dontAskAgain) {
    console.log('用户选择不再询问，自动执行签到');
    await executeCheckins();
    return;
  }

  // 检查是否有需要签到的网站
  if (!userPreferences.checkinLists || userPreferences.checkinLists.length === 0) {
    console.log('没有需要签到的网站');
    return;
  }

  // 延迟显示通知，确保浏览器完全启动
  setTimeout(() => {
    showCheckinNotification();
  }, 5000);
}

// 显示签到询问通知
function showCheckinNotification() {
  chrome.notifications.create('checkin-ask', {
    type: 'basic',
    iconUrl: logoimg,
    title: '每日签到提醒',
    message: `今天有 ${userPreferences.checkinLists.length} 个网站需要签到，是否现在执行？`,
    priority: 2,
    buttons: [
      { title: '立即签到' },
      { title: '稍后提醒' },
      { title: '今天不再提醒' }
    ],
    requireInteraction: true
  });
}

// 监听通知按钮点击
chrome.notifications.onButtonClicked.addListener(async (notificationId, buttonIndex) => {
  if (notificationId === 'checkin-ask') {
    // 关闭通知
    chrome.notifications.clear(notificationId);

    switch (buttonIndex) {
      case 0: // 立即签到
        await executeCheckins();
        break;

      case 1: // 稍后提醒
        // 30分钟后再次提醒
        setTimeout(() => {
          checkAndAskForCheckin();
        }, 30 * 60 * 1000);
        break;

      case 2: // 今天不再提醒
        userPreferences.lastCheckinDate = new Date().toDateString();
        await chrome.storage.sync.set({
          lastCheckinDate: userPreferences.lastCheckinDate
        });
        break;
    }
  }
});
// 执行单个签到
async function singleCheckin(item: CheckinItem) {
  console.log('单个签到item:', item);
  return await performSingleCheckin(item);
}

// 执行签到
async function executeCheckins() {
  const today = new Date().toDateString();
  let successCount = 0;
  let totalCount = userPreferences.checkinLists.length;
  // console.log('签到url2:', userPreferences.checkinUrls,userPreferences.checkinLists,JSON.parse(userPreferences.checkinLists as unknown as string));
  // 显示开始签到通知
  chrome.notifications.create('checkin-start', {
    type: 'basic',
    iconUrl: logoimg,
    title: '开始签到',
    message: `正在为 ${totalCount} 个网站执行签到...`,
    priority: 1
  });

  const checkinLists = userPreferences.checkinLists as Array<CheckinItem>;
  console.log('签到item1:', checkinLists);
  for (let i = 0; i < checkinLists.length; i++) {
    const item = checkinLists[i];
    const result = await performSingleCheckin(item);
    console.log('签到item22:', item, result);
    if (result) {
      successCount++;
    }
    // 每个网站之间间隔2秒，避免请求过快
    // await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // 更新最后签到日期
  userPreferences.lastCheckinDate = today;
  await chrome.storage.sync.set({ lastCheckinDate: today });

  // 显示签到结果
  showCheckinResult(successCount, totalCount);
}

// 执行单个网站签到
async function performSingleCheckin(item: CheckinItem) {
  console.log('签到item3:', item, item.link);
  // 创建隐藏标签页
  const tab = await chrome.tabs.create({
    url: item.link,
    // active: false TODO: 静默签到（在签到list里添加一个active字段）
  });

  // 等待页面加载
  if (tab.id !== undefined) {
    await waitForPageLoad(tab.id);
  }
  // 执行签到逻辑：先获取真正的签到按钮，再点击
  if (item.btnXPath) {
    // 优化：统一异常处理、减少重复代码、提前返回
    if (!tab.id) return false;

    console.log('签到item4:', typeof item.btnXPath, item.btnXPath);

    let clicked = false;
    try {
      const [{ result }] = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: (xpath: string) => {
          if (!xpath) return false;
          try {
            const ele = document.evaluate(
              xpath,
              document.body,
              null,
              XPathResult.FIRST_ORDERED_NODE_TYPE,
              null
            ).singleNodeValue as HTMLElement;
            if (ele) {
              // 保险：确保元素可见并可交互
              ele.scrollIntoView({ block: 'center' });
              setTimeout(() => ele.click(), 2000);
              console.log('通过 XPath 点击了按钮');
              return true;
            }
          } catch (e) {
            console.error('XPath 执行错误:', e);
          }
          return false;
        },
        args: [item.btnXPath],
        world: 'MAIN'
      });
      clicked = Boolean(result);
    } catch (e) {
      console.error('注入脚本失败:', e);
    }

    if (clicked) {
      // 原子更新：仅改当前项
      // console.log('点击签到按钮:', item, userPreferences.checkinLists);
      const updated = userPreferences.checkinLists.map((s: CheckinItem) =>
        s.link === item.link ? { ...s, isCheckedIn: true } : s
      );
      console.log('更新签到状态:', updated);
      chrome.storage.sync.set({ checkinLists: JSON.stringify(updated) });
      // item.isCheckedIn = true;
      // userPreferences.checkinLists = updated;
    }

    return clicked;
    // // 方法2: 使用文本匹配（恢复并增强）
    // if (button.text) {
    //   const keywords = button.text.split('|').map(k => k.trim());
    //   // 扩大扫描范围，包含 img 的 alt 属性
    //   const candidates = document.querySelectorAll(
    //     'button, a, span, div, input[type="button"], input[type="submit"], img'
    //   );
    //   for (const candidate of candidates) {
    //     const txt = (
    //       candidate.textContent ||
    //       (candidate as HTMLInputElement).value ||
    //       (candidate as HTMLImageElement).alt ||
    //       ''
    //     ).trim();
    //     if (keywords.some(k => txt.includes(k))) return candidate as HTMLElement;
    //   }
    // }

    // // 签到完成后关闭标签页
    // setTimeout(() => {
    //   if (tab.id !== undefined) {
    //     chrome.tabs.remove(tab.id).catch(() => { });
    //   }
    // }, 3000);

  }
  //  // 延迟后关闭标签页
  //   setTimeout(() => {
  //     if (tab.id !== undefined) {
  //       chrome.tabs.remove(tab.id).catch(() => { });
  //     }
  //   }, 3000);
  console.log('新建页面的url:', item.link);
  // 如果没有规则，也关闭标签页
  // setTimeout(() => {
  //   if (tab.id !== undefined) {
  //     chrome.tabs.remove(tab.id).catch(() => { });
  //   }
  // }, 1000);
}


// 等待页面加载
function waitForPageLoad(tabId: number) {
  return new Promise((resolve) => {
    chrome.tabs.onUpdated.addListener(function listener(id, info) {
      if (id === tabId && info.status === 'complete') {
        chrome.tabs.onUpdated.removeListener(listener);
        // 额外等待1秒确保JS执行完成
        setTimeout(resolve, 1000);
      }
    });
  });
}

// // 执行签到脚本
// function executeCheckinScript(tabId: number, rules: { buttonSelector: any; buttonText: string; xpath: string; }) {
//   return new Promise((resolve) => {
//     chrome.scripting.executeScript({
//       target: { tabId: tabId },
//       func: (rules: { buttonSelector: any; buttonText: string; xpath: string; }) => {
//         return new Promise((scriptResolve) => {
//           setTimeout(() => {
//             let success = false;

//             // 方法1: 使用选择器
//             if (rules.buttonSelector) {
//               const elements = document.querySelectorAll(rules.buttonSelector);
//               for (const element of elements) {
//                 if (element && element.offsetParent !== null) {
//                   element.click();
//                   success = true;
//                   console.log(`使用选择器点击成功: ${rules.buttonSelector}`);
//                   break;
//                 }
//               }
//             }

//             // 方法2: 使用文本匹配
//             if (!success && rules.buttonText) {
//               const checkinKeywords = rules.buttonText.split('|');
//               const elements = document.querySelectorAll('button, a, span, div, input[type="button"], input[type="submit"]');

//               for (const element of elements) {
//                 const text = element.textContent || element.value || '';
//                 for (const keyword of checkinKeywords) {
//                   if (text.trim().includes(keyword.trim())) {
//                     element.click();
//                     success = true;
//                     console.log(`使用文本点击成功: ${keyword}`);
//                     break;
//                   }
//                 }
//                 if (success) break;
//               }
//             }

//             // 方法3: 使用XPath
//             if (!success && rules.xpath) {
//               try {
//                 const result = document.evaluate(
//                   rules.xpath,
//                   document,
//                   null,
//                   XPathResult.FIRST_ORDERED_NODE_TYPE,
//                   null
//                 );
//                 if (result.singleNodeValue) {
//                   result.singleNodeValue.click();
//                   success = true;
//                   console.log(`使用XPath点击成功: ${rules.xpath}`);
//                 }
//               } catch (e) {
//                 console.error('XPath执行错误:', e);
//               }
//             }

//             scriptResolve(success);
//           }, 1500); // 等待页面完全渲染
//         });
//       },
//       args: [rules]
//     }, (results) => {
//       resolve(results && results[0] && results[0].result);
//     });
//   });
// }

// 显示签到结果
function showCheckinResult(successCount: number, totalCount: number) {
  chrome.notifications.create('checkin-result', {
    type: 'basic',
    // iconUrl: successCount === totalCount ? 'icons/success.png' : 'icons/warning.png',
    iconUrl: logoimg,
    title: '签到完成',
    message: `成功 ${successCount}/${totalCount} 个网站`,
    priority: 2,
    requireInteraction: successCount < totalCount
  });
}

// 监听来自popup的消息
chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  switch (request.action) {
    case 'singleCheckin':
      singleCheckin(request.item).then((success) => {
        sendResponse({ success });
      });
      return true;

    case 'checkinNow':
      executeCheckins().then(() => {
        sendResponse({ success: true });
      });
      return true;

    case 'getStatus':
      // console.log('getStatus1:', userPreferences.checkinUrls);
      sendResponse({
        lastCheckinDate: userPreferences.lastCheckinDate,
        totalUrls: userPreferences.checkinLists.reduce((acc: number, item: { isCheckedIn: boolean; }) => acc + (item.isCheckedIn === false ? 1 : 0), 0) || 0
      });
      return true;

    case 'resetToday':
      userPreferences.lastCheckinDate = null;
      chrome.storage.sync.set({ lastCheckinDate: null });
      await initBackground();
      console.log('resetToday1:', userPreferences.checkinLists);
      if (userPreferences.checkinLists.length === 0) {
        sendResponse({ success: false, message: '没有签到列表' });
        return true;
      }
      userPreferences.checkinLists.forEach((item: { isCheckedIn: boolean; }) => item.isCheckedIn = false);
      console.log('resetToday2:', userPreferences.checkinLists);
      chrome.storage.sync.set({ checkinLists: JSON.stringify(userPreferences.checkinLists) });
      sendResponse({ success: true });
      return true;
  }
});

// function args(results: InjectionResult<any>[]): void {
//   throw new Error('Function not implemented.');
// }
