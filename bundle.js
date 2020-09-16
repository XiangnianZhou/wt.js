'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

const CACHE_DEVICE_ID = '__wt_device_id';
const CACHE_USER_ID = '__wt_user_id';
const CACHE_FIRST_DAY = '__wt_first_day';

let deviceId = wx.getStorageSync(CACHE_DEVICE_ID);
let userId = '';
const ipInfo = {
  ip: '',
  city: '',
  country: ''
};

class AliLogTracker {
  constructor(host, project, logstore) {
    this.uri = `https://${project}.${host}/logstores/${logstore}/track?APIVersion=0.6.0`;
  }

  logger(params) {
    wx.request({
      method: 'GET',
      url: this.uri,
      data: params
    });
  }
}

function getUUid() {
  return "" + Date.now() + '-' + Math.floor(1e7 * Math.random()) + '-' + Math.random().toString(16).replace('.', '') + '-' + String(Math.random() * 31242).replace('.', '').slice(0, 8);
}


function createDeviceId() {
  deviceId = getUUid();
  wx.setStorageSync(CACHE_DEVICE_ID, deviceId);
  wx.setStorageSync(CACHE_FIRST_DAY, Date.now());
  return deviceId
}

function getIp() {
  return new Promise(resolve => {
    wx.request({
      method: 'GET',
      url: 'https://pv.sohu.com/cityjson',
      success(response) {
        const match = response.data.match(/=\s(\{[^}]+\})/);
        if (match && match[1]) {
          try {
            const c = JSON.parse(match[1]);
            ipInfo.ip = c.cip;
            if (/^\d+$/.test(c.cid)) {
              ipInfo.city = c.cname;
            } else {
              ipInfo.country = c.cname;
            }
          } catch(e) {
            ipInfo.ip = '0'; // 错误
          } finally {
            resolve();
          }
        }
      }
    });
  })
}


class Wt {
  constructor(host, project, logstore) {
    this.logger = new AliLogTracker(host, project, logstore);
    if (!deviceId) {
      createDeviceId();
    }
  }

  track(event, data) {
    (ipInfo.ip ? Promise.resolve() : getIp()).then(() => {
      const pages = getCurrentPages();
      const currentPage = pages[pages.length - 1];
      const url = currentPage && currentPage.route;

      const formateData = {
        event,
        userId,
        deviceId,
        url: url || '',
        ip: ipInfo.ip,
        city: ipInfo.city,
        country: ipInfo.country,
        timestap: Date.now(),
        ...data,
        json: JSON.stringify(data.json || {})
      };
      
      this.logger.logger(formateData);
    });
  }

  
  login(loginId) {
    if (loginId) {
      userId = loginId;
      wx.setStorageSync(CACHE_USER_ID, loginId);
    }
  }
}


let wtCache = null;
function createWt(host, project, logstore) {
  if (wtCache) {
    return wtCache
  }
  const wt = new Wt(host, project, logstore);
  wtCache = wt;
  return wt
}

// 参考 https://github.com/sensorsdata/sa-sdk-miniprogram

const wtMp = {};
let wt;
let referrer = '直接打开';

function initWt (host, project, logstore) {
  wt = createWt(host, project, logstore);
  trackSystemInfo();
  initProxy();
  return wt
}


const mpHook = {
  "data": 1,
  "onLoad": 1,
  "onShow": 1,
  "onReady": 1,
  "onPullDownRefresh": 1,
  "onReachBottom": 1,
  "onShareAppMessage": 1,
  "onPageScroll": 1,
  "onResize": 1,
  "onTabItemTap": 1,
  "onHide": 1,
  "onUnload": 1
};

const mp_scene = {
  1000: '其他',
  1001: '发现栏小程序主入口，「最近使用」列表（基础库2.2.4版本起包含「我的小程序」列表）',
  1005: '顶部搜索框的搜索结果页',
  1006: '发现栏小程序主入口搜索框的搜索结果页',
  1007: '单人聊天会话中的小程序消息卡片',
  1008: '群聊会话中的小程序消息卡片',
  1010: '收藏夹',
  1011: '扫描二维码',
  1012: '长按图片识别二维码',
  1013: '手机相册选取二维码',
  1014: '小程序模版消息',
  1017: '前往体验版的入口页',
  1019: '微信钱包',
  1020: '公众号 profile 页相关小程序列表',
  1022: '聊天顶部置顶小程序入口',
  1023: '安卓系统桌面图标',
  1024: '小程序 profile 页',
  1025: '扫描一维码',
  1026: '附近小程序列表',
  1027: '顶部搜索框搜索结果页“使用过的小程序”列表',
  1028: '我的卡包',
  1029: '卡券详情页',
  1030: '自动化测试下打开小程序',
  1031: '长按图片识别一维码',
  1032: '手机相册选取一维码',
  1034: '微信支付完成页',
  1035: '公众号自定义菜单',
  1036: 'App 分享消息卡片',
  1037: '小程序打开小程序',
  1038: '从另一个小程序返回',
  1039: '摇电视',
  1042: '添加好友搜索框的搜索结果页',
  1043: '公众号模板消息',
  1044: '带 shareTicket 的小程序消息卡片（详情)',
  1045: '朋友圈广告',
  1046: '朋友圈广告详情页',
  1047: '扫描小程序码',
  1048: '长按图片识别小程序码',
  1049: '手机相册选取小程序码',
  1052: '卡券的适用门店列表',
  1053: '搜一搜的结果页',
  1054: '顶部搜索框小程序快捷入口',
  1056: '音乐播放器菜单',
  1057: '钱包中的银行卡详情页',
  1058: '公众号文章',
  1059: '体验版小程序绑定邀请页',
  1064: '微信连Wi-Fi状态栏',
  1067: '公众号文章广告',
  1068: '附近小程序列表广告',
  1069: '移动应用',
  1071: '钱包中的银行卡列表页',
  1072: '二维码收款页面',
  1073: '客服消息列表下发的小程序消息卡片',
  1074: '公众号会话下发的小程序消息卡片',
  1077: '摇周边',
  1078: '连Wi-Fi成功页',
  1079: '微信游戏中心',
  1081: '客服消息下发的文字链',
  1082: '公众号会话下发的文字链',
  1084: '朋友圈广告原生页',
  1088: '会话中查看系统消息，打开小程序',
  1089: '微信聊天主界面下拉',
  1090: '长按小程序右上角菜单唤出最近使用历史',
  1091: '公众号文章商品卡片',
  1092: '城市服务入口',
  1095: '小程序广告组件',
  1096: '聊天记录',
  1097: '微信支付签约页',
  1099: '页面内嵌插件',
  1102: '公众号 profile 页服务预览',
  1103: '发现栏小程序主入口，“我的小程序”列表',
  1104: '微信聊天主界面下拉，“我的小程序”栏',
  1106: '聊天主界面下拉，从顶部搜索结果页，打开小程序',
  1107: '订阅消息，打开小程序',
  1113: '安卓手机负一屏，打开小程序(三星)',
  1114: '安卓手机侧边栏，打开小程序(三星)',
  1124: '扫“一物一码”打开小程序',
  1125: '长按图片识别“一物一码”',
  1126: '扫描手机相册中选取的“一物一码”',
  1129: '微信爬虫访问',
  1131: '浮窗打开小程序',
  1133: '硬件设备打开小程序',
  1146: '地理位置信息打开出行类小程序',
  1148: '卡包-交通卡，打开小程序',
  1150: '扫一扫商品条码结果页打开小程序',
  1153: '“识物”结果页打开小程序'
};

function getMPScene (key) {
  if (typeof key === "number" || (typeof key === "string" && key !== "")) {
    key = String(key);
    return mp_scene[key] || key
  } else {
    return "未取到值"
  }
}

function getPath(path) {
  if (typeof path === 'string') {
    path = path.replace(/^\//, '');
  } else {
    path = '取值异常';
  }
  return path
}

wtMp.autoTrackCustom = {
  appLaunch(para) {
    const prop = {};
    prop.scene = getMPScene(para.scene);
    // prop.urlQuery = prop.scene
    wt.track('appLaunch', prop);
  },
  appShow(para) {
    const prop = {};
    if (para && para.path) {
      prop.urlPath = getPath(para.path);
    }
    prop.scene = getMPScene(para.scene);
    // prop.urlQuery = prop.scene
    wt.track('appShow', prop);
  },
  appHide() {
    const prop = {};
    wt.track('appHide', prop);
  },
  pageLoad() {
    const prop = {};
    prop.from = referrer;
    const pages = getCurrentPages();
    const currentPage = pages[pages.length - 1];
    referrer = currentPage.route;
    prop.to = referrer;
    wt.track('pageLoad', prop);
  }
};

function mp_proxy(option, method, identifier) {
  const newFunc = wtMp.autoTrackCustom[identifier];
  
  if (option[method]) {
    const oldFunc = option[method];
    option[method] = function() {
      oldFunc.apply(this, arguments);
      newFunc.apply(this, arguments);
    };
  } else {
    option[method] = function() {
      newFunc.apply(this, arguments);
    };
  }
}

function click_proxy(option, method) {
  const oldFunc = option[method];
  option[method] = function() {
    let prop = {};
    if (arguments[0] && typeof arguments[0] === 'object') {
      const target = arguments[0].currentTarget || {};
      const dataset = target.dataset || {};
      if (dataset.wt) {
        prop['type'] = arguments[0]['type'];
        // prop['elementId'] = target.id
        prop['value'] = dataset['wtValue'] || '';
        // prop['tag'] = dataset['wt_tag'] || ''
        wt.track(dataset.wt, prop);
      }
    }
    return oldFunc && oldFunc.apply(this, arguments)
  };
}

function trackSystemInfo() {
  const info = {};
  function getNetwork() {
    wx.getNetworkType({
      success(t) {
        info.networkType = t["networkType"];
      },
      complete: getSystemInfo
    });
  }

  function formatSystem(system) {
    const _system = system.toLowerCase();
    if (_system === 'ios') {
      return 'iOS'
    } else if (_system === 'android') {
      return 'Android'
    } else {
      return system
    }
  }

  function getSystemInfo() {
    wx.getSystemInfo({
      success(t) {
        info.manufacturer = t["brand"];
        info.model = t["model"];
        info.screenWidth = Number(t["screenWidth"]);
        info.screenHeight = Number(t["screenHeight"]);
        info.os = formatSystem(t["platform"]);
        info.osVersion = t["system"].indexOf(' ') > -1 ? t["system"].split(' ')[1] : t["system"];
      },
      complete() {
        createWt().track('deviceInfo', info);
      }
    });
  }

  getNetwork();
}

function initProxy() {
  const oldApp = App;
  App = function(option) {
    mp_proxy(option, "onLaunch", 'appLaunch');
    mp_proxy(option, "onShow", 'appShow');
    mp_proxy(option, "onHide", 'appHide');
    oldApp.apply(this, arguments);
  };


  const oldPage = Page;
  Page = function(option) {
    for (let m in option) {
      if (typeof(option[m]) === 'function' && !mpHook[m]) {
        click_proxy(option, m);
      }
    }

    mp_proxy(option, "onLoad", 'pageLoad');
    // mp_proxy(option, "onShow", 'pageShow')
    oldPage.apply(this, arguments);
  };

  const oldComponent = Component;
  Component = function(option) {
    try {
      for (let m in option) {
        if (typeof(option[m]) === 'function' && !mpHook[m]) {
          click_proxy(option, m);
        }
      }

      mp_proxy(option.methods, 'onLoad', 'pageLoad');
      // mp_proxy(option.methods, 'onShow', 'pageShow')
      oldComponent.apply(this, arguments);
    } catch (e) {
      oldComponent.apply(this, arguments);
    }
  };
}

exports.createWt = createWt;
exports.initWt = initWt;
