//获取应用实例
const app = getApp();
const parseApi = require('../../api/parse')
const rewardApi = require('../../api/reward')
const {showDialog} = require('../../utils/util')
let videoAd = null;
let videoAdFn = () => {};
Page({
  data: {
    isLogin: false,
    userInfo: null,
    videoUrl: '',
    autoPaste: false, //自动粘贴
    config: {
      notice: ""
    },
    adSkip: false, //跳过广告
  },
  onLoad() {
    app.init().then(async () => {
      const config = app.globalData.config;
      const userInfo = app.globalData.userInfo;
      // 组合公告结构
      let notice = config.notice.split("\n");
      notice = notice.map(item => {
        return `<div>${item}</div>`;
      }).join("")
      config.notice = notice;
      this.setData({
        isLogin: app.globalData.isLogin,
        userInfo,
        config,
      })
      // 创建广告
      // 解析广告激励
      if (config.adParseStatus === 'true') {
        videoAd = wx.createRewardedVideoAd({
          adUnitId: config.adRewardsId,
        })
        videoAd.onLoad(() => {
          console.log("onLoad")
        })
        videoAd.onError((err) => {
          console.error('激励视频广告加载失败', err)
        })
        videoAd.onClose((res) => {
          console.log("onclose", res)
          if (res.isEnded) {
            wx.showLoading({
              title: '加载中',
            })
            // 发起领奖
            app.handleRewardClaim(1,config.adRewardsId,this.data.videoUrl).then(async res=>{
              this.setData({
                adSkip: true,
              })
              videoAdFn();
            })
          }
        })
      } else {
        this.setData({
          adSkip: true,
        })
      }
    })
  },
  onShow() {
    // 实现自动粘贴
    const autoPaste = wx.getStorageSync('autoPaste')
    if (autoPaste) {
      this.paste();
      this.setData({
        autoPaste,
      })
    }
  },
  extractUrl: function (text) {
    // 正则表达式匹配 http 或 https 开头的 URL
    // let regex = /https?:\/\/[^\s,;，。\(\)【】]+/g;
    let regex = /(http|https):\/\/[\w\-_]+(\.[\w\-_]+)+([\w\-\.,@?^=%&:/~\+#]*[\w\-\@?^=%&/~\+#])?/;
    let matches = text.match(regex);
    console.log(matches[0]);
    return matches ? matches[0] : null; // 返回第一个匹配的 URL
  },
  // 视频地址匹配是否合法
  regUrl: function (t) {
    return /(http|ftp|https):\/\/[\w\-_]+(\.[\w\-_]+)+([\w\-\.,@?^=%&:/~\+#]*[\w\-\@?^=%&/~\+#])?/.test(t)
  },
  onChange(e) {
    this.setData({
      videoUrl: e.detail.value,
    })
  },
  // 粘贴
  paste: function () {
    wx.getClipboardData({
      success: res => {
        var str = res.data.trim()
        this.setData({
          videoUrl: str,
        })
      }
    })
  },
  // 清空
  clear(){
    this.setData({
      videoUrl:'',
    })
  },
  // 一键粘贴开关
  onAutoPaste(e) {
    wx.setStorageSync('autoPaste', e.detail.value)
    this.setData({
      autoPaste: e.detail.value
    })
  },
  // 一键解析
  async submit () {
    if (this.regUrl(this.data.videoUrl)) {
      this.setData({
        adSkip: await app.computeAdSkipParse(),
      })
      this.parseVideo();
    } else {
      wx.showToast({
        title: "视频链接不正确",
        icon: "none"
      })
    }
  },
  showAd() {
    if (videoAd && !this.data.adSkip) {
      showDialog('您没有解析次数，继续观看广告获取解析次数？').then(res=>{
        videoAd.show().catch(() => {
          // 失败重试
          videoAd.load()
            .then(() => videoAd.show())
            .catch(err => {
              wx.showToast({
                title: '系统发生错误，请联系管理员',
                icon: 'none'
              })
            })
        })
      }).catch((res)=>{
        console.log("取消观看广告")
      })
      
    } else {
      this.setData({
        adSkip: true,
      })
      videoAdFn();
    }
  },
  // 视频解析
  parseVideo() {
    // 用户触发广告后，显示激励视频广告
    if (!this.data.adSkip) {
      videoAdFn = () => {
        this.parseVideo()
      };
      this.showAd();
      return;
    }
    var that = this;
    var params = {
      url: this.extractUrl(this.data.videoUrl)
    };
    wx.showLoading({
      title: '解析中...',
    })
    parseApi.url(params).then(res => {
      console.log(res)
      if (res.code != 200) {
        wx.showToast({
          title: "解析失败请检查链接正确性,或重试一次",
          icon: "none"
        })
      } else {
        wx.navigateTo({
          url: '/pages/user/parse/info/info?id=' + res.data.id,
          complete() {
            wx.hideLoading()
          }
        })
      }
    }).catch(err => {
      console.error(err)
      wx.showToast({
        title: '不支持的视频类型',
        icon: "none"
      })
    })
  },
  onShareAppMessage() {
    return app.onShareAppMessage()
  },
  onShareTimeline() {
    return app.onShareTimeline()
  },
})