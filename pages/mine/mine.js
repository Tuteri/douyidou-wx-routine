const app = getApp();
const userApi = require("../../api/user");
let videoAd = null;
let videoAdFn = () => {};
Page({
  data: {
    isLogin: false,
    userInfo: null,
    isShareAppMessage: false, // 分享至朋友状态，分享后为true
    isShareTimeline: false, // 分享至朋友圈状态，分享后为true
    showExchange: false,
    config: {},
    parseNum: 0,
    exchangeParseNum: 5,
  },
  onLoad() {
    app.init().then(() => {
      const config = app.globalData.config;
      if (config.adRewardTokensStatus === "true") {
        videoAd = wx.createRewardedVideoAd({
          adUnitId: config.adRewardTokensId,
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
            videoAdFn();
          }
        });
      }
    });
  },
  onShow() {
    app.init().then(() => {
      const userInfo = app.globalData.userInfo;
      const config = app.globalData.config;
      this.setData({
        isLogin: app.globalData.isLogin,
        userInfo: userInfo,
        config: config,
      });
      this.getUserInfo();
    });
    if (this.data.isShareAppMessage) {
      app.handleRewardClaim(11, "", "分享至好友").then((res) => {
        if (res.data) {
          wx.showToast({
            title: "分享成功",
          });
          this.setData({
            isShareAppMessage: false,
          });
        }
      });
    } else if (this.data.isShareAppMessage) {
      app.handleRewardClaim(11, "", "分享至朋友圈").then((res) => {
        if (res.data) {
          wx.showToast({
            title: "分享成功",
          });
          this.setData({
            isShareTimeline: false,
          });
        }
      });
    }
  },
  showAd() {
    if (videoAd) {
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
    }
  },
  // 获取用户信息
  getUserInfo() {
    return app.handleGetUserInfo().then((res) => {
      const userInfo = res.data;
      let exchangeParseNum = this.data.exchangeParseNum;
      let parseNum = (
        userInfo.tokens / parseInt(this.data.config.tokensToParseNum)
      ).toFixed(0);
      // console.log(exchangeParseNum);
      if (exchangeParseNum > parseNum) exchangeParseNum = parseNum;
      this.setData({
        userInfo,
        parseNum,
        exchangeParseNum:parseNum,
      });
    });
  },
  onReward() {
    videoAdFn = () => {
      this.getReward();
    };
    this.showAd();
  },
  getReward() {
    wx.showLoading({
      title: "加载中",
    });
    app
      .handleRewardClaim(
        10,
        this.data.config.adRewardTokensId,
        "我的-主动观看广告"
      )
      .then((res) => {
        wx.showToast({
          title: "已获取奖励",
        });
        this.getUserInfo();
      })
      .catch((res) => {
        wx.showToast({
          title: "系统错误，请稍后再试",
          icon: "none",
        });
      });
  },
  // 确认 兑换次数
  confirmDialog(e) {
    const parseNum = this.data.exchangeParseNum;
    if (parseNum <= 0) {
      wx.showToast({
        title: "积分不足",
        icon: "none",
      });
      this.closeDialog();
      return;
    }
    let data = {
      parseNum,
    };
    userApi.tokensToParseNum(data).then((res) => {
      if (res.code == 200) {
        wx.showToast({
          title: "兑换成功",
        });
        this.getUserInfo();
      } else {
        wx.showToast({
          title: res.message,
          icon: "none",
        });
      }
    });
    this.closeDialog();
  },
  // 兑换次数 步进器
  handleExchange(e) {
    const { value } = e.detail;
    this.setData({
      exchangeParseNum: value,
    });
  },
  // 隐藏兑换对话框
  closeDialog() {
    this.setData({
      showExchange: false,
    });
  },
  // 打开对话框
  onExchange() {
    this.setData({
      showExchange: true,
    });
  },
  onShareAppMessage() {
    this.setData({
      isShareAppMessage: true,
    });
    return app.onShareAppMessage();
  },
  onShareTimeline() {
    this.setData({
      isShareTimeline: true,
    });
    return app.onShareTimeline();
  },
});
