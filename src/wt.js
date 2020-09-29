const CACHE_DEVICE_ID = '__wt_device_id'
const CACHE_USER_ID = '__wt_user_id'
const CACHE_FIRST_DAY = '__wt_first_day'

let deviceId = wx.getStorageSync(CACHE_DEVICE_ID)
let userId = ''
const ipInfo = {
  ip: '',
  city: '',
  country: ''
}

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
  return "" + Date.now() + '-' + Math.floor(1e7 * Math.random()) + '-' + Math.random().toString(16).replace('.', '') + '-' + String(Math.random() * 31242).replace('.', '').slice(0, 8);
}


function createDeviceId() {
  deviceId = getUUid()
  wx.setStorageSync(CACHE_DEVICE_ID, deviceId)
  wx.setStorageSync(CACHE_FIRST_DAY, Date.now())
  return deviceId
}

function getIp() {
  return new Promise(resolve => {
    wx.request({
      method: 'GET',
      url: 'https://pv.sohu.com/cityjson',
      success(response) {
        const match = response.data.match(/=\s(\{[^}]+\})/)
        if (match && match[1]) {
          try {
            const c = JSON.parse(match[1])
            ipInfo.ip = c.cip
            if (/^\d+$/.test(c.cid)) {
              ipInfo.city = c.cname
            } else {
              ipInfo.country = c.cname
            }
          } catch(e) {
            ipInfo.ip = '0' // 错误
          } finally {
            resolve()
          }
        }
      }
    })
  })
}


export class Wt {
  constructor(host, project, logstore) {
    this.logger = new AliLogTracker(host, project, logstore)
    if (!deviceId) {
      createDeviceId()
    }
  }

  track(event, data) {
    (ipInfo.ip ? Promise.resolve() : getIp()).then(() => {
      const pages = getCurrentPages()
      const currentPage = pages[pages.length - 1]
      const url = currentPage && currentPage.route

      const formateData = {
        $event: event,
        $userId: userId,
        $deviceId: deviceId,
        $url: url || '',
        $ip: ipInfo.ip,
        $city: ipInfo.city,
        $country: ipInfo.country,
        $timestap: Date.now(),
        ...data,
        json: JSON.stringify(data.json || {})
      }
      
      this.logger.logger(formateData)
    })
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
