const api = require("./request"); // 引入封装的请求工具

const BASE_URL = '/config';
/**
 * 配置 API
 */
const routine = (data) => {
  return api.get(BASE_URL + "/routine", data);
};
// 导出所有方法
module.exports = {
  routine,
};