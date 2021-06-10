const CACHE_DEVICE_ID = '__wt_device_id'
const CACHE_USER_ID = '__wt_user_id'
const CACHE_FIRST_DAY = '__wt_first_day'

let deviceId = wx.getStorageSync(CACHE_DEVICE_ID)
let userId = ''

class AliLogTracker {
  constructor(host, project, logstore) {
    this.uri = `https://${project}.${host}/logstores/${logstore}/track?APIVersion=0.6.0`
  }

  logger(params) {
    wx.request({
      method: 'GET',
      url: this.uri,
      data: params
    })
  }
}

function getUUid() {
  return '' + Date.now() + '-' + Math.floor(1e7 * Math.random()) + '-' + Math.random().toString(16).replace('.', '') + '-' + String(Math.random() * 31242).replace('.', '').slice(0, 8);
}


function createDeviceId() {
  deviceId = getUUid()
  wx.setStorageSync(CACHE_DEVICE_ID, deviceId)
  wx.setStorageSync(CACHE_FIRST_DAY, Date.now())
  return deviceId
}
export class Wt {
  constructor(host, project, logstore) {
    this.logger = new AliLogTracker(host, project, logstore)
    this.$sessionId = ''
    if (!deviceId) {
      createDeviceId()
    }
    const accountInfo = wx.getAccountInfoSync()
    const { miniProgram: { appId } } = accountInfo
    this.meta = {
      $appId: appId
    }
  }

  track(event, data) {
    if (!this.$sessionId) {
      console.error('wt未初始化完毕，请在小程序加载完成后调用track')
      return
    }
    const { options = {}, route = '' } = getCurrentPages().reverse()[0] || []
    const query = Object.keys(options).map(k => `${k}=${options[k]}`).join('&')
    const url = query ? `${route}?${query}` : route

    const formateData = {
      $event: event,
      $userId: userId || deviceId,
      $deviceId: deviceId,
      $url: url || '',
      $sessionId: this.$sessionId,
      $timestap: Date.now(),
      ...this.meta,
      ...data,
      json: JSON.stringify(data.json || {})
    }
    
    this.logger.logger(formateData)
  }

  
  login(loginId) {
    if (loginId) {
      userId = loginId
      wx.setStorageSync(CACHE_USER_ID, loginId)
    }
  }
}


let wtCache = null
export function createWt(host, project, logstore) {
  if (wtCache) {
    return wtCache
  }
  const wt = new Wt(host, project, logstore)
  wtCache = wt
  return wt
}
