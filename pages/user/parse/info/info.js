import Toast, { hideToast } from "tdesign-miniprogram/toast/index";
const parseApi = require("../../../../api/parse");
const userApi = require("../../../../api/user");
const app = getApp();
const { dayjs, openSetting } = require("../../../../utils/util");
const saveAllTaskQueue = [1, 2, 3];
let videoAd = null;
let videoAdFn = () => {};
Page({
  /**
   * 页面的初始数据
   */
  data: {
    id: null,
    info: {},
    skeleton: [
      [
        {
          width: "327rpx",
        },
        {
          width: "327rpx",
        },
      ],
      [
        {
          width: "168rpx",
          height: "32rpx",
        },
        {
          width: "486rpx",
          height: "32rpx",
        },
      ],
      [
        {
          width: "168rpx",
          height: "32rpx",
        },
        {
          width: "486rpx",
          height: "32rpx",
        },
      ],
      [
        {
          width: "118rpx",
          height: "32rpx",
        },
        {
          width: "536rpx",
          height: "32rpx",
        },
      ],
      [
        {
          width: "100%",
          height: "32rpx",
        },
      ],
      [
        {
          width: "100%",
          height: "32rpx",
        },
      ],
    ],
    showSkeleton: true,
    videoDownloadTask: null,
    allowDownload: false,
    visible: false,
    imagesViewer: [],
    curIndex: 0,
    // 视频下载中Task
    videoDownloadTask: {},
    // 音频下载中Task
    audioDownloadTask: {},
    // 图片下载中Task
    imageDownloadTask: {},
    isMobile: true,
    scrollTop: 0,
    saveAllTask: {
      downloadTaskList: null,
      totalTask: 0,
      doneTask: 0,
      successTask: 0,
      errorTask: 0,
    },
    adSkip: false,
    isSave: false, //保存状态，只触发一次
    config: {},
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this.setData({
      id: options.id,
      isMobile: app.globalData.isMobile,
    });
    app.init().then(() => {
      const config = app.globalData.config;
      this.setData({
        config,
      });
      // 创建广告
      // 解析广告激励
      if (this.data.config.adSaveStatus === "true") {
        videoAd = wx.createRewardedVideoAd({
          adUnitId: this.data.config.adRewardsId,
        });
        videoAd.onLoad(() => {
          console.log("onLoad");
        });
        videoAd.onError((err) => {
          console.error("激励视频广告加载失败", err);
        });
        videoAd.onClose((res) => {
          console.log("onclose", res);
          if (res.isEnded) {
            // 发起领奖
            app
              .handleRewardClaim(2, config.adRewardsId, this.data.id)
              .then(async (res) => {
                userApi.consumer({type:1});
                this.setData({
                  adSkip: true,
                  isSave: true,
                });
                videoAdFn();
              });
          }
        });
      } else {
        this.setData({
          adSkip: true,
        });
      }
    });
  },
  onShow() {
    this.getInfo().then((res) => {
      this.setData({
        showSkeleton: false,
      });
    });
  },
  // 展示广告
  async showAd() {
    if (!this.data.isSave) {
      const adSkip = await app.computeAdSkipSave()
      if(adSkip) await userApi.consumer({type:1});
      this.setData({
        adSkip: adSkip,
      });
    }
    if (videoAd && !this.data.adSkip) {
      videoAd.show().catch(() => {
        // 失败重试
        videoAd
          .load()
          .then(() => videoAd.show())
          .catch((err) => {
            wx.showToast({
              title: "广告发生错误，请联系管理员",
              icon: "none",
            });
          });
      });
    } else {
      this.setData({
        adSkip: true,
      });
      videoAdFn();
    }
  },
  getInfo() {
    let data = {
      id: this.data.id,
    };
    return parseApi.urlInfo(data).then((res) => {
      res.data.createFromNow = dayjs(res.data.createTime).fromNow();
      res.data.textOrigin = res.data.text;
      if (!res.data.text) {
        res.data.text = "Unknow";
      } else if (res.data.text.length > 10) {
        res.data.text = res.data.text.substr(0, 10) + "...";
      }
      this.setData({
        info: res.data,
      });
    });
  },
  // 保存图片
  saveImage(e) {
    if (!this.data.adSkip) {
      videoAdFn = () => {
        this.saveImage(e);
      };
      this.showAd();
      return;
    }
    let that = this;
    openSetting().then(() => {
      const downloadTask = wx.downloadFile({
        url: e.currentTarget.dataset.text,
        useHighPerformanceMode: true,
        success: (res) => {
          wx.saveImageToPhotosAlbum({
            filePath: res.tempFilePath,
            success(res) {
              wx.showToast({
                title: "保存成功",
                icon: "none",
              });
            },
            fail(res) {
              console.log(res);
              wx.showToast({
                title: "保存失败",
                icon: "none",
              });
            },
          });
        },
        fail: (res) => {
          console.log(res);
          wx.showToast({
            title: "下载失败",
            icon: "none",
          });
        },
      });
    });
  },
  // 保存视频
  saveVideo(e) {
    if (!this.data.adSkip) {
      videoAdFn = () => {
        this.saveVideo(e);
      };
      this.showAd();
      return;
    }
    let that = this;
    const index = e.currentTarget.dataset.index;
    let curVideoDownloadTask = this.data.videoDownloadTask[index];
    // 正在下载中，终止下载
    if (curVideoDownloadTask && curVideoDownloadTask.action) {
      let downloadTask = curVideoDownloadTask.downloadTask;
      downloadTask.abort();
      this.setData({
        [`videoDownloadTask[${index}]`]: null,
      });
      return;
    }
    openSetting().then((res) => {
      const downloadTask = wx.downloadFile({
        url: e.currentTarget.dataset.text,
        useHighPerformanceMode: true,
        timeout: 1800000,
        success: (res) => {
          wx.saveVideoToPhotosAlbum({
            filePath: res.tempFilePath,
            success(res) {
              wx.showToast({
                title: "保存成功",
                icon: "none",
              });
            },
            fail(res) {
              wx.showToast({
                title: "保存失败",
                icon: "none",
              });
              that.setData({
                [`videoDownloadTask[${index}]`]: null,
              });
            },
          });
        },
        fail: (res) => {
          console.log(res);
          wx.showToast({
            title: "下载失败",
            icon: "none",
          });
        },
      });
      this.setData({
        [`videoDownloadTask[${index}]`]: {
          downloadTask,
          progress: 0,
          action: true,
        },
      });
      // 下载进度
      downloadTask.onProgressUpdate((res) => {
        // let progress = res.progress || 100;
        this.setData({
          [`videoDownloadTask[${index}].progress`]: res.progress,
        });
        console.log(res.progress);
        if (res.progress == 100) {
          this.setData({
            [`videoDownloadTask[${index}].action`]: false,
          });
        }
      });
    });
  },
  // 保存音频
  saveAudio(e) {
    if (!this.data.adSkip) {
      videoAdFn = () => {
        this.saveAudio(e);
      };
      this.showAd();
      return;
    }
    let that = this;
    const index = e.currentTarget.dataset.index;
    let curAudioDownloadTask = this.data.audioDownloadTask[index];
    // 正在下载中，终止下载
    if (curAudioDownloadTask && curAudioDownloadTask.action) {
      let downloadTask = curAudioDownloadTask.downloadTask;
      downloadTask.abort();
      this.setData({
        [`audioDownloadTask[${index}]`]: null,
      });
      return;
    }
    // openSetting().then(res => {
    const downloadTask = wx.downloadFile({
      url: e.currentTarget.dataset.text,
      useHighPerformanceMode: true,
      timeout: 1800000,
      success: (res) => {
        const fs = wx.getFileSystemManager();
        if (this.data.isMobile) {
          fs.saveFile({
            tempFilePath: res.tempFilePath,
            filePath: `${wx.env.USER_DATA_PATH}/${new Date().getTime()}.mp3`, // 自定义路径
            success(res) {
              console.log(res);
              wx.showToast({
                title: "保存成功 路径 " + res.savedFilePath,
                icon: "none",
                duration: 4000,
              });
            },
            fail(res) {
              console.log(res);
              wx.showToast({
                title: "保存失败",
                icon: "none",
              });
              that.setData({
                [`audioDownloadTask[${index}]`]: null,
              });
            },
          });
        } else {
          wx.saveVideoToPhotosAlbum({
            filePath: res.tempFilePath,
            success(res) {
              console.log(res);
              wx.showToast({
                title: "保存成功",
                icon: "none",
              });
            },
            fail(res) {
              console.log(res);
              wx.showToast({
                title: "保存失败",
                icon: "none",
              });
              that.setData({
                [`audioDownloadTask[${index}]`]: null,
              });
            },
          });
        }
      },
      fail: (res) => {
        console.log(res);
        wx.showToast({
          title: "下载失败",
          icon: "none",
        });
      },
    });
    this.setData({
      [`audioDownloadTask[${index}]`]: {
        downloadTask,
        progress: 0,
        action: true,
      },
    });
    // 下载进度
    downloadTask.onProgressUpdate((res) => {
      // let progress = res.progress || 100;
      this.setData({
        [`audioDownloadTask[${index}].progress`]: res.progress,
      });
      console.log(res.progress);
      if (res.progress == 100) {
        this.setData({
          [`audioDownloadTask[${index}].action`]: false,
        });
      }
    });
    // })
  },
  //
  initSaveAllTask(t = 0) {
    saveAllTaskQueue.length = 0;
    this.setData({
      saveAllTask: {
        downloadTaskList: null,
        totalTask: t,
        doneTask: 0,
        successTask: 0,
        errorTask: 0,
      },
    });
  },
  // 保存图集全部
  saveImageAll() {
    if (!this.data.adSkip) {
      videoAdFn = () => {
        this.saveImageAll();
      };
      this.showAd();
      return;
    }
    let that = this;
    this.initSaveAllTask(this.data.info.proxy.images.length);
    openSetting().then(() => {
      Toast({
        context: this,
        selector: "#t-toast",
        duration: -1,
        theme: "loading",
        direction: "column",
      });
      this.data.info.proxy.images.forEach((item) => {
        const task = () => {
          return new Promise((resolve) => {
            wx.downloadFile({
              url: item,
              useHighPerformanceMode: true,
              success: (res) => {
                wx.saveImageToPhotosAlbum({
                  filePath: res.tempFilePath,
                  success(res) {
                    that.setData({
                      ["saveAllTask.successTask"]:
                        that.data.saveAllTask.successTask + 1,
                      ["saveAllTask.doneTask"]:
                        that.data.saveAllTask.doneTask + 1,
                    });
                    resolve();
                  },
                  fail(res) {
                    that.setData({
                      ["saveAllTask.errorTask"]:
                        that.data.saveAllTask.errorTask + 1,
                      ["saveAllTask.doneTask"]:
                        that.data.saveAllTask.doneTask + 1,
                    });
                    resolve();
                  },
                });
              },
              fail: (res) => {
                that.setData({
                  ["saveAllTask.errorTask"]:
                    that.data.saveAllTask.errorTask + 1,
                  ["saveAllTask.doneTask"]: that.data.saveAllTask.doneTask + 1,
                });
                resolve();
              },
            });
          });
        };
        saveAllTaskQueue.push(task);
      });
      this.runSaveAllTask();
    });
  },
  // 保存视频全部
  saveVideoAll() {
    if (!this.data.adSkip) {
      videoAdFn = () => {
        this.saveVideoAll();
      };
      this.showAd();
      return;
    }
    let that = this;
    this.initSaveAllTask(this.data.info.proxy.video.length);
    openSetting().then(() => {
      Toast({
        context: this,
        selector: "#t-toast",
        duration: -1,
        theme: "loading",
        direction: "column",
      });
      this.data.info.proxy.video.forEach((item) => {
        const task = () => {
          return new Promise((resolve) => {
            wx.downloadFile({
              url: item,
              useHighPerformanceMode: true,
              success: (res) => {
                wx.saveVideoToPhotosAlbum({
                  filePath: res.tempFilePath,
                  success(res) {
                    that.setData({
                      ["saveAllTask.successTask"]:
                        that.data.saveAllTask.successTask + 1,
                      ["saveAllTask.doneTask"]:
                        that.data.saveAllTask.doneTask + 1,
                    });
                    resolve();
                  },
                  fail(res) {
                    that.setData({
                      ["saveAllTask.errorTask"]:
                        that.data.saveAllTask.errorTask + 1,
                      ["saveAllTask.doneTask"]:
                        that.data.saveAllTask.doneTask + 1,
                    });
                    resolve();
                  },
                });
              },
              fail: (res) => {
                that.setData({
                  ["saveAllTask.errorTask"]:
                    that.data.saveAllTask.errorTask + 1,
                  ["saveAllTask.doneTask"]: that.data.saveAllTask.doneTask + 1,
                });
                resolve();
              },
            });
          });
        };
        saveAllTaskQueue.push(task);
      });
      this.runSaveAllTask();
    });
  },
  runSaveAllTask() {
    if (saveAllTaskQueue.length === 0) {
      hideToast({
        context: this,
        selector: "#t-toast",
      });
      wx.showToast({
        title: "保存成功",
        icon: "none",
      });
      return Promise.resolve();
    }
    const task = saveAllTaskQueue.shift(); // 取出第一个任务
    return task().then(() => this.runSaveAllTask(saveAllTaskQueue)); // 递归执行下一个
  },
  handleHide() {
    hideToast({
      context: this,
      selector: "#t-toast",
    });
  },
  copyText(e) {
    this.copy(e.currentTarget.dataset.text);
  },
  copy: function (text) {
    if (!this.data.adSkip) {
      videoAdFn = () => {
        this.copy(text);
      };
      this.showAd();
      return;
    }
    wx.setClipboardData({
      data: text,
    });
  },
  showImageViewer(e) {
    const urls = e.currentTarget.dataset.type == "1"
    ? this.data.info.images
    : [this.data.info.cover];
    const index = e.currentTarget.dataset.index;
    if (this.data.adSkip) {
      wx.previewImage({
        urls:urls,
        showmenu: true,
        current: urls[index],
      });
    } else {
      this.setData({
        imagesViewer: urls,
        visible: true,
        curIndex: index,
      });
    }
  },
  closeImageViewer(e) {
    this.setData({
      visible: false,
    });
  },
  onPageScroll(e) {
    this.setData({
      scrollTop: e.scrollTop,
    });
  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {},

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {},

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {},

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {},

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {},

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {},
});
