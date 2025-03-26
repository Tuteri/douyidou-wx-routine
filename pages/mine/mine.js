const app = getApp();
const userApi = require('../../api/user')
Page({
  data: {
    isLogin: false,
    userInfo: null,
  },

  onReady() {
    console.log(app.globalData)
    this.checkLogin(); // 每次进入页面检查登录状态
  },
  onLogin() {
    if (this.data.isLogin) return;
    wx.login({
      success: (res) => {
        if (res.code) {
          userApi.login({
            code: res.code
          }).then(res => {
            this.handleGetUserInfo();
          }).catch(err => {
            console.log(err);
          })
        }
      }
    });
  },
  checkLogin() {
    const token = wx.getStorageSync('token');
    if (token) {
      this.setData({
        isLogin: app.globalData.isLogin,
        userInfo: app.globalData.userInfo,
      })
    }
  },
  // 获取用户信息
  handleGetUserInfo() {
    userApi
      .getUserInfo()
      .then((res) => {
        this.setData({
          userInfo: res.data,
          isLogin: true,
        })
      })
      .catch((err) => {
        console.error("获取用户信息失败:", err);
      });
  },
  // onLogin() {
  //   if (this.data.isLogin) return; // 已登录则不重复登录
  //   wx.navigateTo({ url: '/pages/login/login' }); // 跳转到登录页面
  // },

  // goOrders() {
  //   if (!this.data.isLogin) return wx.showToast({ title: '请先登录', icon: 'none' });
  //   wx.navigateTo({ url: '/pages/orders/orders' });
  // },
});