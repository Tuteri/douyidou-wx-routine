const app = getApp();
const parseApi = require('../../../../api/parse');
const { showDialog } = require('../../../../utils/util');
const RewardedVideoAd = require('../../../../utils/rewarded-video-ad');
let videoAd = null;
let videoAdFn = () => {};
Component({
  /**
   * 页面的初始数据
   */
  data: {
    name: '',
    url: '', // 用户输入的视频 URL
    adSkip: false, //跳过广告
    config: {},
    selectFile: false, //选择文件状态
    uploadFile: false //上传文件状态
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
        videoAd = new RewardedVideoAd(config.adRewardsId, 'video-to-mp3/submit');
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
    selectFile(file) {
      this.setData({
        selectFile: file.detail
      });
    },
    uploadSuccess(res) {
      this.setData({
        uploadFile: res.detail
      });
      this.videoToMp3();
    },
    // 提交表单事件
    async onSubmit() {
      const { url } = this.data;
      if (!this.extractUrl(url) && !this.data.selectFile) {
        wx.showToast({
          title: '请输入正确的视频链接或上传视频',
          icon: 'none'
        });
        return;
      } else {
        this.setData({
          adSkip: await app.computeAdSkipParse()
        });
        // 用户触发广告后，显示激励视频广告
        if (!this.data.adSkip) {
          videoAdFn = () => {
            this.videoToMp3();
          };
          this.showAd();
          return;
        }
        this.videoToMp3();
      }
    },
    // 提交表单事件
    videoToMp3() {
      let upload = this.selectComponent('#video-upload');
      if (this.data.selectFile && !this.data.uploadFile) {
        upload.videoUpload();
        return;
      }
      let { name, url } = this.data;
      if (!url) {
        url = this.data.uploadFile.url;
      }
      console.log(this.data.uploadFile.url);
      let data = { url, name };
      wx.showLoading({
        title: '提交中...',
        mask: true
      });
      parseApi
        .videoToMp3(data)
        .then(res => {
          wx.hideLoading();
          if (res.code == 200) {
            this.setData({
              url: '',
              name: '',
              selectFile: false,
              uploadFile: false
            });
            // 提交表单
            wx.showToast({
              title: '任务已提交',
              icon: 'success'
            });
            upload.clearFile();
          } else {
            return Promise.reject(res);
          }
        })
        .catch(res => {
          wx.hideLoading();
          console.log(res);
          wx.showToast({
            title: res.message,
            icon: 'none'
          });
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
