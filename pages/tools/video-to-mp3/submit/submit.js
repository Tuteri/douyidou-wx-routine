const app = getApp();
const parseApi = require("../../../../api/parse");
const { showDialog } = require("../../../../utils/util");
let videoAd = null;
let videoAdFn = () => {};
Component({
  /**
   * 页面的初始数据
   */
  data: {
    name: "",
    url: "", // 用户输入的视频 URL
    adSkip: false, //跳过广告
    config: {},
  },
  lifetimes: {
    attached: function () {
      app.init().then(async () => {
        const config = app.globalData.config;
        this.setData({
          config,
        });
        // 创建广告
        // 解析广告激励
        if (config.adParseStatus === "true") {
          videoAd = wx.createRewardedVideoAd({
            adUnitId: config.adRewardsId,
          });
          videoAd.onLoad(() => {
            console.log("onLoad");
          });
          videoAd.onError((err) => {
            console.error("激励视频广告加载失败", err);
          });
          videoAd.onClose((res) => {
            console.log("onclose", res);
            if (res.isEnded) {
              wx.showLoading({
                title: "加载中",
              });
              // 发起领奖
              app
                .handleRewardClaim(3, config.adRewardsId, this.data.videoUrl)
                .then(async (res) => {
                  this.setData({
                    adSkip: true,
                  });
                  videoAdFn();
                });
            }
          });
        } else {
          this.setData({
            adSkip: true,
          });
        }
      });
    },
    detached: function () {
      // 在组件实例被从页面节点树移除时执行
    },
  },
  methods: {
    // 输入框变化事件
    onUrlInputChange(e) {
      this.setData({
        url: e.detail.value,
      });
    },
    showAd() {
      if (videoAd && !this.data.adSkip) {
        showDialog("您没有转码次数，继续观看广告获取转码次数？")
          .then((res) => {
            videoAd.show().catch(() => {
              // 失败重试
              videoAd
                .load()
                .then(() => videoAd.show())
                .catch((err) => {
                  wx.showToast({
                    title: "系统发生错误，请联系管理员",
                    icon: "none",
                  });
                });
            });
          })
          .catch((res) => {
            console.log("取消观看广告");
          });
      } else {
        this.setData({
          adSkip: true,
        });
        videoAdFn();
      }
    },
    // 提交表单事件
    async onSubmit() {
      this.setData({
        adSkip: await app.computeAdSkipParse(),
      });
      const { url }= this.data;
      if (!this.extractUrl(url)) {
        wx.showToast({
          title: "请输入正确的视频 URL",
          icon: "none",
        });
        return;
      }else{
        this.videoToMp3();
      }
    },
    // 提交表单事件
    videoToMp3() {
      // 用户触发广告后，显示激励视频广告
      if (!this.data.adSkip) {
        videoAdFn = () => {
          this.videoToMp3();
        };
        this.showAd();
        return;
      }
      const { name, url } = this.data;
      let data = {
        url,
        name,
      };
      wx.showLoading({
        title: "提交中...",
        mask: true,
      });
      parseApi
        .videoToMp3(data)
        .then((res) => {
          wx.hideLoading();
          if (res.code == 200) {
            this.setData({
              url: "",
              name: "",
            });
            // 提交表单
            wx.showToast({
              title: "任务已提交",
              icon: "success",
            });
          }
        })
        .catch((res) => {
          wx.hideLoading();
          console.log(res);
          wx.showToast({
            title: res.message,
            icon: "none",
          });
        });
    },
    extractUrl: function (text) {
      // 正则表达式匹配 http 或 https 开头的 URL
      // let regex = /https?:\/\/[^\s,;，。\(\)【】]+/g;
      let regex = /(http|https):\/\/[\w\-_]+(\.[\w\-_]+)+([\w\-\.,@?^=%&:/~\+#]*[\w\-\@?^=%&/~\+#])?/;
      let matches = text.match(regex);
      return matches ? matches[0] : null; // 返回第一个匹配的 URL
    },
  },
});
