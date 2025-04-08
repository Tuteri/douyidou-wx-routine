// api/request.js
const {
  baseURL
} = require("../config/config"); // 引入配置文件

let queue = Promise.resolve(); // 初始化一个已经解析的 Promise，作为起始点

const request = (url, method = "GET", data = {}, headers = {}) => {
  queue = queue.then(() => {
    return new Promise((resolve, reject) => {
      const header = getHeaders(headers);
      wx.request({
        url: baseURL + url, // 拼接 baseURL
        method,
        data,
        header,
        success: (res) => {
          if (res.data.code === 200) {
            resolve(res.data);
          } else if (res.data.code == 401) {
            refreshAccessToken()
              .then(() => {
                // 重试
                const header = getHeaders(headers);
                wx.request({
                  url: baseURL + url, // 拼接 baseURL
                  method,
                  data,
                  header,
                  success: (res) => {
                    console.log(res);
                    resolve(res.data)
                  },
                  fail: (err) => {
                    reject(err);
                  },
                })
              })
              .catch((err) => {
                reject(res.data);
              });
          }else{
            resolve(res.data);
          }
        },
        fail: (err) => {
          reject(err);
        },
      });
    });
  }).catch((err) => {
    console.log("request catch")
    return Promise.resolve({}); // 确保 queue 继续执行
  });
  return queue;
}
const getHeaders = (headers={})=>{
  let token = wx.getStorageSync("token");
  // 处理 headers，只有 token 存在时才添加 Authorization
  const header = {
    ...headers,
    ...(token ? {
      Authorization: `Bearer ${token}`
    } : {}),
  };
  return header;
}
// 刷新 token 请求
function refreshAccessToken() {
  let token = wx.getStorageSync("refresh_token");
  const header = {
    ...(token ? {
      Authorization: `Bearer ${token}`
    } : {}),
  };
  return new Promise((resolve, reject) => {
    wx.request({
      url: baseURL + '/refreshToken', // 刷新 Token 的接口
      method: 'POST',
      header,
      success: (res) => {
        if (res.data.code === 200) {
          // 存储新的 accessToken 和 refresh_token
          const {
            accessToken,
            refreshToken
          } = res.data.data;
          wx.setStorageSync("token", accessToken); // 更新刷新 token
          wx.setStorageSync("refresh_token", refreshToken); // 更新刷新 token
          resolve(accessToken);
        } else {
          wx.removeStorageSync('token')
          wx.removeStorageSync('refresh_token')
          reject()
          // onLogin()
        }
      },
      fail: () => {
        reject('刷新 token 失败')
      },
    });
  });
}

// 具体请求方法
const get = (url, data = {}, headers = {}) => request(url, "GET", data, headers);
const post = (url, data = {}, headers = {}) => request(url, "POST", data, headers);
const put = (url, data = {}, headers = {}) => request(url, "PUT", data, headers);
const del = (url, data = {}, headers = {}) => request(url, "DELETE", data, headers);

// 导出
module.exports = {
  getHeaders,
  request,
  get,
  post,
  put,
  del
};