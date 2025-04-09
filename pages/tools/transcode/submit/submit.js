const app = getApp();
const parseApi = require('../../../../api/parse');
const { showDialog } = require('../../../../utils/util');
const RewardedVideoAd = require('../../../../utils/rewarded-video-ad');
let videoAdFn = () => {};
let videoAd = null;
Component({
  /**
   * 页面的初始数据
   */
  data: {
    name: '',
    url: '', // 用户输入的视频 URL
    source: 'm3u8', // 固定原格式
    targetFormat: 'mp4', // 固定目标格式
    adSkip: false, //跳过广告
    config: {}
  },
  lifetimes: {
    attached: function () {
      app.init().then(async () => {
        const config = app.globalData.config;
        this.setData({
          config
        });
        // 创建广告
        // 解析广告激励
        if (config.adParseStatus === 'false') {
          this.setData({
            adSkip: true
          });
        }
        videoAd = new RewardedVideoAd(config.adRewardsId, 'trasncode/submit');
        videoAd.init();
      });
    },
    detached: function () {
      // 在组件实例被从页面节点树移除时执行
    }
  },
  methods: {
    // 输入框变化事件
    onUrlInputChange(e) {
      this.setData({
        url: e.detail.value
      });
    },
    showAd() {
      if (videoAd && !this.data.adSkip) {
        showDialog('您没有转码次数，继续观看广告获取转码次数？')
          .then(res => {
            videoAd.show().then(res => {
              wx.showLoading({
                title: '加载中'
              });
              // 发起领奖
              app.handleRewardClaim(3, this.data.config.adRewardsId, this.data.videoUrl).then(async res => {
                this.setData({
                  adSkip: true
                });
                videoAdFn();
              });
            });
          })
          .catch(res => {
            console.log('取消观看广告');
          });
      } else {
        this.setData({
          adSkip: true
        });
        videoAdFn();
      }
    },
    // 提交表单事件
    async onSubmit() {
      this.setData({
        adSkip: await app.computeAdSkipParse()
      });
      const { url } = this.data;
      if (!this.extractUrl(url)) {
        wx.showToast({
          title: '请输入正确的视频 URL',
          icon: 'none'
        });
        return;
      } else {
        this.transcode();
      }
    },
    transcode() {
      // 用户触发广告后，显示激励视频广告
      if (!this.data.adSkip) {
        videoAdFn = () => {
          this.transcode();
        };
        this.showAd();
        return;
      }
      const { name, url, source, target } = this.data;
      let data = {
        url,
        name,
        source,
        target
      };
      wx.showLoading({
        title: '提交中...',
        mask: true
      });
      parseApi
        .transcode(data)
        .then(res => {
          wx.hideLoading();
          if (res.code == 200) {
            this.setData({
              url: '',
              name: ''
            });
            // 提交表单
            wx.showToast({
              title: '任务已提交',
              icon: 'success'
            });
          } else {
            console.log(res);
            wx.showToast({
              title: res.message,
              icon: 'none'
            });
          }
        })
        .catch(res => {
          wx.hideLoading();
        });
    },
    extractUrl: function (text) {
      // 正则表达式匹配 http 或 https 开头的 URL
      // let regex = /https?:\/\/[^\s,;，。\(\)【】]+/g;
      let regex = /(http|https):\/\/[\w\-_]+(\.[\w\-_]+)+([\w\-\.,@?^=%&:/~\+#]*[\w\-\@?^=%&/~\+#])?/;
      let matches = text.match(regex);
      return matches ? matches[0] : null; // 返回第一个匹配的 URL
    }
  }
});
