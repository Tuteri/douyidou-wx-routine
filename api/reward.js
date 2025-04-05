const api = require("./request"); // 引入封装的请求工具

const BASE_URL = '/reward';
/**
 * 配置 API
 */
const claim = (data) => {
  return api.post(BASE_URL + "/claim", data);
};
// 导出所有方法
module.exports = {
  claim,
};