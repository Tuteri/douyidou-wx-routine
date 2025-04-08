const {
  baseURL
} = require("../config/config"); // 引入配置文件
const api = require("./request"); // 引入封装的请求工具

const BASE_URL = '/common';
/**
 * 通用 API
 */
const uploadUrl = ()=>{
  return baseURL + BASE_URL + "/upload";
}
// 导出所有方法
module.exports = {
  uploadUrl,
};