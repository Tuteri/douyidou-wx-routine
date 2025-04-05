const app = getApp();
Page({
  data: {
    isLogin: false,
    userInfo: null,
    isShareAppMessage: false, // 分享至朋友状态，分享后为true
    isShareTimeline: false, // 分享至朋友圈状态，分享后为true
  },

  onReady() {
    app.init().then(() => {
      this.setData({
        isLogin: app.globalData.isLogin,
        userInfo: app.globalData.userInfo,
      });
    });
  },
  onShow() {
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
