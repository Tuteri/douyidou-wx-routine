const api = require("./request"); // 引入封装的请求工具

const BASE_URL = '';
/**
 * 用户 API
 */
const login = (data) => {
  return api.post(BASE_URL + "/miniLogin", data).then((res) => {
    if (res.data.accessToken) {
      wx.setStorageSync("token", res.data.accessToken); // 登录成功后保存 Token
      wx.setStorageSync("refresh_token", res.data.refreshToken); // 登录成功后保存 Token
    }
    return res;
  });
};

const getUserInfo = () => {
  return api.get(BASE_URL + "/getInfo");
};

const logout = () => {
  return new Promise((resolve) => {
    wx.removeStorageSync("token"); // 清除本地 token
    wx.removeStorageSync("refresh_token"); // 清除本地 token
    resolve();
  });
};

// 导出所有方法
module.exports = {
  login,
  getUserInfo,
  logout
};