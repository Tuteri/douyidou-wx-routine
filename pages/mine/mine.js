const app = getApp();
Page({
  data: {
    isLogin: false,
    userInfo: null,
  },

  onReady() {
    app.init().then(() => {
      this.setData({
        isLogin: app.globalData.isLogin,
        userInfo: app.globalData.userInfo,
      })
    })
  },
});