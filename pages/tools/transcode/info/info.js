const parseApi = require("../../../../api/parse")
import bytes from 'bytes';
const {
  dayjs,
  openSetting,
  showToast
} = require('../../../../utils/util')
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
    allowDownload:false,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this.setData({
      id: options.id
    })
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
    return parseApi.transcodeStats(data).then(res => {
      let allowDownload = res.data.size < bytes("200MB")
      res.data.createFromNow = dayjs(res.data.createTime).fromNow()
      res.data.doneFromNow = dayjs(res.data.doneTime).fromNow()
      res.data.size = bytes(res.data.size);
      this.setData({
        allowDownload:allowDownload,
        info: res.data
      })
    })
  },
  onRefresh() {
    this.setData({
      enable: true
    });
    this.getInfo().then(res => {
      this.setData({
        enable: false
      });
    })
  },
  // 保存视频
  saveVideo: function (e) {
    let that = this;
    let curVideoDownloadTask = this.data.videoDownloadTask;
    // 正在下载中，终止下载
    console.log(curVideoDownloadTask)
    if (curVideoDownloadTask && curVideoDownloadTask.action) {
      let downloadTask = curVideoDownloadTask.downloadTask;
      downloadTask.abort();
      this.setData({
        downloadTask: null,
      })
      return;
    }
    openSetting().then(res => {
      const downloadTask = wx.downloadFile({
        url: this.data.info.downloadUrl,
        useHighPerformanceMode: true,
        timeout: 1800000,
        success: (res) => {
          wx.saveVideoToPhotosAlbum({
            filePath: res.tempFilePath,
            success(res) {
              wx.showToast({
                title:"保存成功",
              })
            },
            fail(res) {
              wx.showToast({
                title:"保存失败",
              })
            }
          })
        },
        fail: (res) => {
          wx.showToast({
            title:"下载失败",
            icon:"none"
          })
          this.setData({
            [`videoDownloadTask.action`]: false,
          })
        },
      })
      this.setData({
        videoDownloadTask: {
          downloadTask,
          progress: 0,
          action: true,
        }
      })
      // 下载进度
      downloadTask.onProgressUpdate((res) => {
        // let progress = res.progress || 100;
        this.setData({
          [`videoDownloadTask.progress`]: res.progress,
        })
        console.log(res.progress);
        if (res.progress == 100) {
          this.setData({
            [`videoDownloadTask.action`]: false,
          })
        }
      })
    })

  },
  copyText() {
    this.copy(this.data.info.downloadUrl);
  },
  copy: function (text) {
    wx.setClipboardData({
      data: text,
    });
  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {

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