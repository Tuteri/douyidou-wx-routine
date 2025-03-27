//获取应用实例
const app = getApp();
const parseApi = require('../../api/parse')
Page({
  data: {
    isLogin: false,
    userInfo: null,
    videoUrl: '',
    videoTitle: '',
    autoPaste:false,//自动粘贴
    config:{
      notice:""
    },
  },
  onLoad() {
    app.init().then(() => {
      const config = app.globalData.config;
      // 组合公告结构
      let notice = config.notice.split("\n");
      notice = notice.map(item=>{
        return `<div>${item}</div>`;
      }).join("")
      config.notice = notice;
      this.setData({
        isLogin: app.globalData.isLogin,
        userInfo: app.globalData.userInfo,
        config,
      })
    })
  },
  onShow(){
    // 实现自动粘贴
    const autoPaste = wx.getStorageSync('autoPaste')
    if(autoPaste){
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
  // 一键粘贴开关
  onAutoPaste(e){
    wx.setStorageSync('autoPaste', e.detail.value)
    this.setData({
      autoPaste:e.detail.value
    })
  },
  // 一键解析
  submit: function () {
    this.setData({
      videoDownloadTask: {},
    })
    if (this.regUrl(this.data.videoUrl)) {
      this.parseVideo();
      if (this.isLogin) {} else {
        app.onLogin(() => {
          this.parseVideo();
        });
      }
    } else {
      wx.showToast({title:"视频链接不正确",icon:"none"})
    }
  },

  // 视频解析
  parseVideo: function () {
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
        wx.showToast({title:"解析失败请检查链接正确性,或重试一次",icon:"none"})
      } else {
        wx.navigateTo({
          url: '/pages/user/parse/info/info?id='+res.data.id,
          complete(){
            wx.hideLoading()
          }
        })
      }
    }).catch(err => {
      console.error(err)
      wx.showToast({title:'不支持的视频类型',icon:"none"})
    })
  },
  onShareAppMessage: function () {
    return {
      title: '推荐一款超好用的短视频水印一键提取工具，赶快试试吧～',
      imageUrl: '/images/share.jpg',
      path: '/pages/index/index',
    }
  },
  onShareTimeline: function () {
    return {
      title: '推荐一款超好用的短视频水印一键提取工具，赶快试试吧～',
      imageUrl: '/images/share.jpg',
      query: '/pages/index/index',
    }
  },
})