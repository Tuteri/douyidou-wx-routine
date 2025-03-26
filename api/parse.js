const api = require("./request"); // 引入封装的请求工具

const BASE_URL = '/parse';
/**
 * 解析 API
 */
const url = (data) => {
  return api.get(BASE_URL + "/url", data);
};
const transcode = (data) =>{
  return api.post(BASE_URL + "/transcode", data);
}
const transcodeList = (data) =>{
  return api.get(BASE_URL + "/transcode/list", data);
}
const transcodeStop = (data) =>{
  return api.get(BASE_URL + "/transcode/stop", data);
}
const transcodeStats = (data) =>{
  return api.get(BASE_URL + "/transcode/stats", data);
}
// 导出所有方法
module.exports = {
  url,
  transcode,
  transcodeList,
  transcodeStats,
  transcodeStop,
};