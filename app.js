// app.js
const userApi = require("./api/user");
const configApi = require("./api/config");
const rewardApi = require("./api/reward");
App({
  globalData: {
    isLogin: null, // 用户登录状态
    userInfo: null,
    init: false,
    config: null,
    isMobile: true,
    adSkip: false, //跳过广告
    parseNumTemp: 0,
    parseNum: 0,
  },
  onLaunch() {
    const systemInfo = wx.getDeviceInfo();
    if (systemInfo && (systemInfo.platform === "windows" || systemInfo.platform === "mac")) {
      this.globalData.isMobile = false;
    }

    console.log("onLaunch");
    // 获取小程序更新机制兼容
    if (wx.canIUse("getUpdateManager")) {
      const updateManager = wx.getUpdateManager();
      updateManager.onCheckForUpdate(function (res) {
        // 请求完新版本信息的回调
        if (res.hasUpdate) {
          updateManager.onUpdateReady(function () {
            wx.showModal({
              title: "更新提示",
              content: "新版本已经准备好，是否重启应用？",
              success: function (res) {
                if (res.confirm) {
                  // 新的版本已经下载好，调用 applyUpdate 应用新版本并重启
                  updateManager.applyUpdate();
                }
              },
            });
          });
          updateManager.onUpdateFailed(function () {
            // 新的版本下载失败
            wx.showModal({
              title: "已经有新版本了哟~",
              content: "新版本已经上线啦~，请您删除当前小程序，重新搜索打开哟~",
            });
          });
        }
      });
    } else {
      // 如果希望用户在最新版本的客户端上体验您的小程序，可以这样子提示
      wx.showModal({
        title: "提示",
        content:
          "当前微信版本过低，无法使用该功能，请升级到最新微信版本后重试。",
      });
    }
  },
  onShow() {
    console.log("onShow");
    this.handleInit();

    this.init();
  },
  // 每个页面调用，是否完成初始化，登录状态等
  // 状态初始化
  init() {
    // 已经初始化完成
    if (this.globalData.init) {
      return new Promise((resolve) => {
        resolve(true);
      });
    }
    // 监听初始化是否完成
    return new Promise((resolve, reject) => {
      Object.defineProperty(this.globalData, "init", {
        get: function () {
          return this._value;
        },
        set: function (newValue) {
          this._value = newValue;
          if (newValue) {
            resolve(true);
          } else {
            reject(false);
          }
        },
      });
    });
  },
  handleInit() {
    // 监听用户是否已经登录，
    // 可以在这里做自动登录逻辑
    const token = wx.getStorageSync("token");
    // 验证token是否有效
    wx.showLoading({
      title: "加载中",
      mask: true,
    });
    let promise1;
    if (token) {
      promise1 = this.handleGetUserInfo();
    } else {
      promise1 = this.onLogin();
    }
    // 等待promise全部执行
    promise1
      .then(() => {
        return this.handleConfigRoutine();
      })
      .then(() => {
        console.log("handleInit");
        wx.hideLoading();
        this.globalData.init = true;
      });
  },
  // 领取奖励
  handleRewardClaim(type, adId = "", source = "") {
    return rewardApi.claim({
      type,
      adId,
      source,
    });
  },
  // 解析是否跳过广告
  async computeAdSkipParse() {
    wx.showLoading({
      title: "加载中",
    });
    const {adSkipParse} = await this.computeAdSkip();

    wx.hideLoading();
    return adSkipParse;
  },
  // 解析是否跳过广告
  async computeAdSkipSave() {
    wx.showLoading({
      title: "加载中",
    });
    const {adSkipSave} = await this.computeAdSkip();

    wx.hideLoading();
    return adSkipSave;
  },
  // 获取是否跳过广告
  async computeAdSkip() {
    const { data: userInfo } = await this.handleGetUserInfo();
    const { adSkipParse, adSkipSave } = userInfo;
    return { adSkipParse, adSkipSave };
  },
  // 获取配置
  handleConfigRoutine() {
    return configApi.routine().then((res) => {
      this.globalData.config = res.data;
      wx.setNavigationBarTitle({
        title: res.data.title,
      });
      return Promise.resolve();
    });
  },
  // 获取用户信息
  handleGetUserInfo() {
    return userApi
      .getUserInfo()
      .then((res) => {
        if (res.code === 200) {
          // 更新全局数据
          this.globalData.isLogin = true;
          this.globalData.userInfo = res.data;
          return Promise.resolve(res);
        } else {
          return this.onLogin();
        }
      })
      .catch((res) => {
        console.log(res);
        return this.onLogin();
      });
  },
  onLogin() {
    if (this.globalData.isLogin) return Promise.resolve();
    return new Promise((resolve, reject) => {
      wx.login({
        success: (res) => {
          if (res.code) {
            return userApi
              .login({
                code: res.code,
              })
              .then((res) => {
                this.globalData.isLogin = true;
                this.handleGetUserInfo()
                  .then(() => {
                    resolve();
                  })
                  .catch();
              })
              .catch((err) => {
                reject();
              });
          }
        },
        fail: reject,
      });
    });
  },
  // 设置登录状态
  setLoginState() {
    this.globalData.isLogin = true;
  },

  // 设置退出登录状态
  logout() {
    this.globalData.isLogin = false;
    wx.removeStorageSync("token"); // 移除本地存储的 token
  },

  onShareAppMessage(title="",imageUrl="",path="") {
    return {
      title: title || "推荐一款超好用的短视频水印一键提取工具，赶快试试吧～",
      imageUrl: imageUrl || "/images/share.jpg",
      path: path || ("/pages/index/index?pid="+this.globalData.userInfo.wxOpenid),
    };
  },
  onShareTimeline(title="",imageUrl="",query="") {
    return {
      title: title || "推荐一款超好用的短视频水印一键提取工具，赶快试试吧～",
      imageUrl: imageUrl || "/images/share.jpg",
      query: query || ("/pages/index/index?pid="+this.globalData.userInfo.wxOpenid),
    };
  },
});
