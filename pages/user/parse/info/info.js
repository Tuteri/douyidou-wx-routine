import Toast, {
  hideToast
} from 'tdesign-miniprogram/toast/index';
const parseApi = require("../../../../api/parse")
const app = getApp();
const {
  dayjs,
  openSetting,
} = require('../../../../utils/util')
const saveAllTaskQueue = [1, 2, 3];
Page({

  /**
   * 页面的初始数据
   */
  data: {
    id: null,
    info: {},
    skeleton: [
      [{
          width: '327rpx'
        },
        {
          width: '327rpx'
        }
      ],
      [{
          width: '168rpx',
          height: '32rpx'
        },
        {
          width: '486rpx',
          height: '32rpx'
        },
      ],
      [{
          width: '168rpx',
          height: '32rpx'
        },
        {
          width: '486rpx',
          height: '32rpx'
        },
      ],
      [{
          width: '118rpx',
          height: '32rpx'
        },
        {
          width: '536rpx',
          height: '32rpx'
        },
      ],
      [{
        width: '100%',
        height: '32rpx'
      }, ],
      [{
        width: '100%',
        height: '32rpx'
      }, ],
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
    }
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {

    this.setData({
      id: options.id,
      isMobile: app.globalData.isMobile,
    })
  },
  onShow() {
    this.getInfo().then(res => {
      this.setData({
        showSkeleton: false,
      })
    })
  },

  getInfo() {
    let data = {
      id: this.data.id
    }
    return parseApi.urlInfo(data).then(res => {
      res.data.createFromNow = dayjs(res.data.createTime).fromNow()
      res.data.textOrigin = res.data.text;
      if (!res.data.text) {
        res.data.text = "Unknow";
      } else if (res.data.text.length > 10) {
        res.data.text = res.data.text.substr(0, 10) + "...";
      }
      this.setData({
        info: res.data
      })
    })
  },
  // 保存图片
  saveImage: function (e) {
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
                icon: "none"
              })
            },
            fail(res) {
              wx.showToast({
                title: "保存失败",
                icon: "none"
              })
            }
          })
        },
        fail: (res) => {
          wx.showToast({
            title: "下载失败",
            icon: "none"
          })
        }
      })
    })

  },
  // 保存视频
  saveVideo: function (e) {
    let that = this;
    const index = e.currentTarget.dataset.index;
    let curVideoDownloadTask = this.data.videoDownloadTask[index]
    // 正在下载中，终止下载
    if (curVideoDownloadTask && curVideoDownloadTask.action) {
      let downloadTask = curVideoDownloadTask.downloadTask;
      downloadTask.abort();
      this.setData({
        [`videoDownloadTask[${index}]`]: null,
      })
      return;
    }
    openSetting().then(res => {
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
                icon: "none"
              })
            },
            fail(res) {
              wx.showToast({
                title: "保存失败",
                icon: "none"
              })
              that.setData({
                [`videoDownloadTask[${index}]`]: null,
              })
            }
          })
        },
        fail: (res) => {
          console.log(res);
          wx.showToast({
            title: "下载失败",
            icon: "none"
          })
        }
      })
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
  // 保存音频
  saveAudio: function (e) {
    let that = this;
    const index = e.currentTarget.dataset.index;
    let curAudioDownloadTask = this.data.audioDownloadTask[index]
    // 正在下载中，终止下载
    if (curAudioDownloadTask && curAudioDownloadTask.action) {
      let downloadTask = curAudioDownloadTask.downloadTask;
      downloadTask.abort();
      this.setData({
        [`audioDownloadTask[${index}]`]: null,
      })
      return;
    }
    // openSetting().then(res => {
    const downloadTask = wx.downloadFile({
      url: e.currentTarget.dataset.text,
      useHighPerformanceMode: true,
      timeout: 1800000,
      success: (res) => {
        const fs = wx.getFileSystemManager()
        if (this.data.isMobile) {
          fs.saveFile({
            tempFilePath: res.tempFilePath,
            filePath: `${wx.env.USER_DATA_PATH}/${new Date().getTime()}.mp3`, // 自定义路径
            success(res) {
              console.log(res)
              wx.showToast({
                title: "保存成功 路径 " + res.savedFilePath,
                icon: "none",
                duration: 4000
              })
            },
            fail(res) {
              console.log(res)
              wx.showToast({
                title: "保存失败",
                icon: "none"
              })
              that.setData({
                [`audioDownloadTask[${index}]`]: null,
              })
            }
          })
        } else {
          wx.saveVideoToPhotosAlbum({
            filePath: res.tempFilePath,
            success(res) {
              console.log(res)
              wx.showToast({
                title: "保存成功",
                icon: "none"
              })
            },
            fail(res) {
              console.log(res)
              wx.showToast({
                title: "保存失败",
                icon: "none"
              })
              that.setData({
                [`audioDownloadTask[${index}]`]: null,
              })
            }
          })
        }

      },
      fail: (res) => {
        console.log(res);
        wx.showToast({
          title: "下载失败",
          icon: "none"
        })
      }
    })
    this.setData({
      [`audioDownloadTask[${index}]`]: {
        downloadTask,
        progress: 0,
        action: true,
      }
    })
    // 下载进度
    downloadTask.onProgressUpdate((res) => {
      // let progress = res.progress || 100;
      this.setData({
        [`audioDownloadTask[${index}].progress`]: res.progress,
      })
      console.log(res.progress);
      if (res.progress == 100) {
        this.setData({
          [`audioDownloadTask[${index}].action`]: false,
        })
      }
    })
    // })


  },
  // 
  initSaveAllTask(t=0) {
    saveAllTaskQueue.length = 0;
    this.setData({
      saveAllTask: {
        downloadTaskList: null,
        totalTask: t,
        doneTask: 0,
        successTask: 0,
        errorTask: 0,
      }
    })
  },
  // 保存图集全部
  saveImageAll(){
    let that = this;
    this.initSaveAllTask(this.data.info.proxy.images.length);
    openSetting().then(() => {
      Toast({
        context: this,
        selector: '#t-toast',
        duration: -1,
        theme: "loading",
        direction:'column',
      });
      this.data.info.proxy.images.forEach(item => {
        const task = () => {
          return new Promise(resolve => {
            wx.downloadFile({
              url: item,
              useHighPerformanceMode: true,
              success: (res) => {
                wx.saveImageToPhotosAlbum({
                  filePath: res.tempFilePath,
                  success(res) {
                    that.setData({
                      ["saveAllTask.successTask"]: that.data.saveAllTask.successTask + 1,
                      ["saveAllTask.doneTask"]: that.data.saveAllTask.doneTask + 1
                    })
                    resolve();
                  },
                  fail(res) {
                    that.setData({
                      ["saveAllTask.errorTask"]: that.data.saveAllTask.errorTask + 1,
                      ["saveAllTask.doneTask"]: that.data.saveAllTask.doneTask + 1
                    })
                    resolve();
                  }
                })
              },
              fail: (res) => {
                that.setData({
                  ["saveAllTask.errorTask"]: that.data.saveAllTask.errorTask + 1,
                  ["saveAllTask.doneTask"]: that.data.saveAllTask.doneTask + 1
                })
                resolve();
              }
            })
          })
        }
        saveAllTaskQueue.push(task);
      });
      this.runSaveAllTask();
    })
  },
  runSaveAllTask() {
    if (saveAllTaskQueue.length === 0) {
      hideToast({
        context: this,
        selector: '#t-toast',
      });
      wx.showToast({
        title: '保存成功',
        icon: 'none',
      })
      return Promise.resolve();
    }
    const task = saveAllTaskQueue.shift(); // 取出第一个任务
    return task().then(() => this.runSaveAllTask(saveAllTaskQueue)); // 递归执行下一个
  },
  // 保存视频全部
  saveVideoAll(){
    let that = this;
    this.initSaveAllTask(this.data.info.proxy.video.length);
    openSetting().then(() => {
      Toast({
        context: this,
        selector: '#t-toast',
        duration: -1,
        theme: "loading",
        direction:'column',
      });
      this.data.info.proxy.video.forEach(item => {
        const task = () => {
          return new Promise(resolve => {
            wx.downloadFile({
              url: item,
              useHighPerformanceMode: true,
              success: (res) => {
                wx.saveImageToPhotosAlbum({
                  filePath: res.tempFilePath,
                  success(res) {
                    that.setData({
                      ["saveAllTask.successTask"]: that.data.saveAllTask.successTask + 1,
                      ["saveAllTask.doneTask"]: that.data.saveAllTask.doneTask + 1
                    })
                    resolve();
                  },
                  fail(res) {
                    that.setData({
                      ["saveAllTask.errorTask"]: that.data.saveAllTask.errorTask + 1,
                      ["saveAllTask.doneTask"]: that.data.saveAllTask.doneTask + 1
                    })
                    resolve();
                  }
                })
              },
              fail: (res) => {
                that.setData({
                  ["saveAllTask.errorTask"]: that.data.saveAllTask.errorTask + 1,
                  ["saveAllTask.doneTask"]: that.data.saveAllTask.doneTask + 1
                })
                resolve();
              }
            })
          })
        }
        saveAllTaskQueue.push(task);
      });
      this.runSaveAllTask();
    })
  },
  handleHide() {
    hideToast({
      context: this,
      selector: '#t-toast',
    });
  },
  copyText(e) {
    this.copy(e.currentTarget.dataset.text);
  },
  copy: function (text) {
    wx.setClipboardData({
      data: text,
    });
  },
  showImageViewer(e) {
    this.setData({
      imagesViewer: (e.currentTarget.dataset.type == "1") ? this.data.info.images : [this.data.info.cover],
      visible: true,
      curIndex: e.currentTarget.dataset.index,
    });
  },
  closeImageViewer(e) {
    this.setData({
      visible: false,
    });
  },
  onPageScroll(e) {
    this.setData({
      scrollTop: e.scrollTop,
    })
  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  }
})