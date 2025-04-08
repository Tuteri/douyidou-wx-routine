const commonApi = require("../api/common");
const { getHeaders } = require("../api/request");

const uploadFile = (filepath, data = {}) => {
  let uploadTask; // 用于外部访问
  const promise = new Promise((resolve, reject) => {
    uploadTask = wx.uploadFile({
      header: getHeaders(),
      url: commonApi.uploadUrl(), // 你的后端上传接口地址
      filePath: filepath,
      name: "file", // 后端接收文件的字段名，注意确认
      timeout: 1800000, // 30分钟
      formData: {
        ...data,
      },
      success: (res) => {
        if (res.statusCode === 200) {
          let data = JSON.parse(res.data);
          resolve(data);
        } else {
          reject(res);
        }
      },
      fail: (err) => {
        reject(err);
      },
    });
  });

  // 返回带有 task 的对象
  return {
    uploadTask,
    promise,
  };
};
module.exports = {
  uploadFile,
};
