// utils/rewarded-video-ad.js

class RewardedVideoAdWrapper {
  constructor(adUnitId, logPrefix = '') {
    this.adUnitId = adUnitId
    this.logPrefix = logPrefix ? `[${logPrefix}] ` : `[${adUnitId}]`
    this.adInstance = null
  }

  init() {
    if (!wx.createRewardedVideoAd) {
      console.warn(this.logPrefix + '当前基础库不支持激励视频广告')
      return
    }
    if( !this.adUnitId) return
    this.adInstance = wx.createRewardedVideoAd({ adUnitId: this.adUnitId })

    this.adInstance.onLoad(() => {
      console.log(this.logPrefix + '激励广告加载成功')
    })

    this.adInstance.onError((err) => {
      console.error(this.logPrefix + '激励广告加载失败', err)
    })
    console.log(this.logPrefix + '激励广告创建成功')
  }

  show() {
    return new Promise((resolve, reject) => {
      if (!this.adInstance) {
        reject(new Error(this.logPrefix + '广告未初始化'))
        return
      }

      const onClose = (res) => {
        this.adInstance.offClose(onClose)
        const completed = res?.isEnded === true
        console.log(this.logPrefix + `用户${completed ? '完整观看' : '提前关闭'}广告`)
        resolve(completed)
      }

      this.adInstance.onClose(onClose)

      this.adInstance.show().catch(() => {
        console.log(this.logPrefix + '广告未准备好，尝试加载中...')
        this.adInstance
          .load()
          .then(() => {
            console.log(this.logPrefix + '广告加载成功，准备展示')
            this.adInstance.show()
          })
          .catch(err => {
            this.adInstance.offClose(onClose)
            console.error(this.logPrefix + '广告加载失败，无法展示', err)
            wx.showToast({
              title: '系统发生错误',
              icon:'none'
            })
            reject(err)
          })
      })
    })
  }

  destroy() {
    if (this.adInstance) {
      this.adInstance.offLoad()
      this.adInstance.offError()
    }
  }
}

module.exports = RewardedVideoAdWrapper
