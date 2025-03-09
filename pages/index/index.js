//index.js
//获取应用实例
const app = getApp();
const request = require('../../utils/request.js');
import {
  Toast
} from 'tdesign-miniprogram';
Page({
  data: {
    videoUrl: '',
    videoTitle: '',
    isShow: false,
    isDownload: false,
    isButton: true,
    parseData: {},
    visible: false,
    imagesViewer: [],
    curIndex: 0,
    // 视频下载中Task
    videoDownloadTask: {},
    // 图片下载中Task
    imageDownloadTask: {},
  },

  showImageViewer(e) {
    this.setData({
      imagesViewer: (e.currentTarget.dataset.type == "1") ? this.data.parseData.images : [this.data.parseData.cover],
      visible: true,
      curIndex: e.currentTarget.dataset.index,
    });
  },
  closeImageViewer(e) {
    this.setData({
      visible: false,
    });
  },
  extractUrl: function (text) {
    // 正则表达式匹配 http 或 https 开头的 URL
    // let regex = /https?:\/\/[^\s,;，。\(\)【】]+/g;
    let regex = /(http|https):\/\/[\w\-_]+(\.[\w\-_]+)+([\w\-\.,@?^=%&:/~\+#]*[\w\-\@?^=%&/~\+#])?/;
    let matches = text.match(regex);
    console.log(matches[0]);
    return matches ? matches[0] : null; // 返回第一个匹配的 URL
  },
  // 视频地址匹配是否合法
  regUrl: function (t) {
    return /(http|ftp|https):\/\/[\w\-_]+(\.[\w\-_]+)+([\w\-\.,@?^=%&:/~\+#]*[\w\-\@?^=%&/~\+#])?/.test(t)
  },
  onChange(e) {
    this.setData({
      videoUrl: e.detail.value,
    })
  },
  // 粘贴
  paste: function () {
    wx.getClipboardData({
      success: res => {
        var str = res.data.trim()
        this.setData({
          videoUrl: str,
        })
      }
    })
  },
  // 一键解析
  submit: function () {
    this.setData({
      videoDownloadTask: {},
    })
    if (this.regUrl(this.data.videoUrl)) {
      this.parseVideo();
    } else {
      this.showToast("视频链接不正确")
    }
  },

  // 视频解析
  parseVideo: function () {
    var that = this;
    var params = {
      url: this.extractUrl(this.data.videoUrl)
    };
    request.requestGetApi(app.globalData.url + "/api/videoParse/index", params, this, function (res) {
      console.log(res)
      if (res.code != 200) {
        that.showToast('解析失败请检查链接正确性,或重试一次')
      } else {
        that.setData({
          parseData: {
            ...res.data
          },
        })
      }
    }, function (res) {
      console.error(res)
    })
  },
  showToast: function (text) {
    Toast({
      message: text,
      context: this,
      selector: '#t-toast',
      duration: 2000,
    })
  },
  copyText(e) {
    this.copy(e.currentTarget.dataset.text);
  },
  copy: function (text) {
    wx.setClipboardData({
      data: text,
    });
  },
  saveImage: function (e) {
    let that = this;
    this.openSetting(() => {
      const downloadTask = wx.downloadFile({
        url: e.currentTarget.dataset.text,
        useHighPerformanceMode: true,
        success: (res) => {
          wx.saveImageToPhotosAlbum({
            filePath: res.tempFilePath,
            success(res) {
              that.showToast("保存成功")
            },
            fail(res) {
              that.showToast("保存失败 请复制链接到浏览器下载")
            }
          })
        },
        fail: (res) => {
          that.showToast("网络超时 请复制链接到浏览器下载")
        }
      })
    })

  },
  openSetting(fn, fail = () => {}) {
    wx.getSetting({
      success: function (o) {
        o.authSetting['scope.writePhotosAlbum'] ? fn() : wx.authorize({
          scope: 'scope.writePhotosAlbum',
          success: function () {
            fn()
          },
          fail: function (o) {
            fail();
            wx.showModal({
              title: '提示',
              content: '保存到相册需获取相册权限请允许开启权限',
              confirmText: '确认',
              cancelText: '取消',
              success: function (o) {
                o.confirm ? (wx.openSetting({
                  success: function (o) {}
                })) : ''
              }
            })
          }
        })
      }
    })
  },
  // 保存视频
  saveVideo: function (e) {
    let that = this;
    this.openSetting(() => {
      const downloadTask = wx.downloadFile({
        url: e.currentTarget.dataset.text,
        useHighPerformanceMode: true,
        timeout: 1800000,
        success: (res) => {
          wx.saveVideoToPhotosAlbum({
            filePath: res.tempFilePath,
            success(res) {
              that.showToast("保存成功")
            },
            fail(res) {
              that.showToast("保存失败 请复制链接到浏览器下载")
            }
          })
        },
        fail: (res) => {
          that.showToast("网络超时 请复制链接到浏览器下载")
        }
      })
      const index = e.currentTarget.dataset.index;
      this.setData({
        [`videoDownloadTask[${index}]`]: {
          downloadTask,
          progress: 0,
          action: true,
        }
      })
      // 下载进度
      downloadTask.onProgressUpdate((res) => {
        // let progress = res.progress || 100;
        this.setData({
          [`videoDownloadTask[${index}].progress`]: res.progress,
        })
        console.log(res.progress);
        if (res.progress == 100) {
          this.setData({
            [`videoDownloadTask[${index}].action`]: false,
          })
        }
      })
    })


  },
  bytesToMb(bytes) {
    return (bytes / 1024 / 1024).toFixed(2);
  },
  onShareAppMessage: function () {
    return {
      title: '推荐一款超好用的短视频水印一键提取工具，赶快试试吧～',
      imageUrl: '/images/share.jpg',
      path: '/pages/index/index',
    }
  },
  onShareTimeline: function () {
    return {
      title: '推荐一款超好用的短视频水印一键提取工具，赶快试试吧～',
      imageUrl: '/images/share.jpg',
      query: '/pages/index/index',
    }
  },
})