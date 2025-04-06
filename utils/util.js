const dayjs = require("dayjs");
const relativeTime = require("dayjs/plugin/relativeTime"); // 相对时间插件
const duration = require("dayjs/plugin/duration"); // 相对时间插件
require("dayjs/locale/zh-cn"); // 引入中文语言包
import { Toast } from "tdesign-miniprogram";
import Dialog from "tdesign-miniprogram/dialog/index";

dayjs.extend(relativeTime);
dayjs.extend(duration);
dayjs.locale("zh-cn"); // 设置语言为中文

const openSetting = () => {
  return new Promise((resolve, reject) => {
    wx.getSetting({
      success: function (o) {
        o.authSetting["scope.writePhotosAlbum"]
          ? resolve()
          : wx.authorize({
              scope: "scope.writePhotosAlbum",
              success: function () {
                resolve();
              },
              fail: function (o) {
                wx.showModal({
                  title: "提示",
                  content: "保存到相册需获取相册权限请允许开启权限",
                  confirmText: "确认",
                  cancelText: "取消",
                  success: function (o) {
                    o.confirm
                      ? wx.openSetting({
                          success: function (o) {},
                        })
                      : "";
                  },
                });
                reject();
              },
            });
      },
    });
  });
};
const showToast = function (text) {
  Toast({
    message: text,
    context: this,
    selector: "#t-toast",
    duration: 2000,
  });
};
const showDialog = (content, title, confirmBtn = "", cancelBtn = "") => {
  return new Promise((resolve,reject)=>{
    wx.showModal({
      title: title || "提示",
      content: content,
      confirmText: confirmBtn || "确定",
      cancelText:  cancelBtn || "取消",
      confirmColor: '#0052d9',
      complete: (res) => {
        if (res.confirm) {
          resolve(res);
        }
        if (res.cancel) {
          reject(res);
        }
      }
    })
  })
};
const showTDialog = (content, title, confirmBtn = "", cancelBtn = "") => {
  const dialogConfig = {
    context: this,
    title: title || "提示",
    closeOnOverlayClick: true,
    content: content,
    confirmBtn: { 
      content: confirmBtn || "继续",
      variant: "base" 
    },
    cancelBtn:  { 
      content: cancelBtn || "取消",
      variant: "base" 
    },
    variant: "outline",
  };
  return Dialog.confirm(dialogConfig);
};
module.exports = {
  dayjs,
  openSetting,
  showToast,
  showDialog,
};
