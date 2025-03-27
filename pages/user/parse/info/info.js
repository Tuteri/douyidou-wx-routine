const parseApi = require("../../../../api/parse")

const {
  dayjs,
  openSetting,
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
    allowDownload: false,
    visible: false,
    imagesViewer: [],
    curIndex: 0,
    // 视频下载中Task
    videoDownloadTask: {},
    // 图片下载中Task
    imageDownloadTask: {},
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this.setData({
      id: options.id
    })
  },
  onShow(){
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
              wx.showToast({title:"保存成功",icon:"none"})
            },
            fail(res) {
              wx.showToast({title:"保存失败",icon:"none"})
            }
          })
        },
        fail: (res) => {
          wx.showToast({title:"下载失败",icon:"none"})
        }
      })
    })

  }, // 保存视频
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
              wx.showToast({title:"保存成功",icon:"none"})
            },
            fail(res) {
              wx.showToast({title:"保存失败",icon:"none"})
            }
          })
        },
        fail: (res) => {
          wx.showToast({title:"下载失败",icon:"none"})
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