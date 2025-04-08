const app = getApp();
const parseApi = require("../../../../api/parse");
import bytes from "bytes";
let videoAd = null;
let videoAdFn = () => {};
const { dayjs ,showDialog} = require("../../../../utils/util");
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
    audioDownloadTask: null,
    allowDownload: false,
    isMobile: true,
    adSkip: false,
    isSave: false, //保存状态，只触发一次
    config: {},
    isMobile: true,
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
      // 保存广告激励
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
              .handleRewardClaim(4, config.adRewardsId, this.data.id)
              .then(async (res) => {
                userApi.consumer({ type: 1 });
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
    this.getInfo().then((res) => {
      this.setData({
        showSkeleton: false,
      });
    });
  },
  // 展示广告
  async showAd() {
    if (!this.data.isSave) {
      const adSkip = await app.computeAdSkipSave();
      if (adSkip) await userApi.consumer({ type: 1 });
      this.setData({
        adSkip: adSkip,
      });
    }
    if (videoAd && !this.data.adSkip) {
      showDialog("您没有保存次数，继续观看广告获取保存次数？")
        .then((res) => {
          videoAd.show().catch(() => {
            // 失败重试
            videoAd
              .load()
              .then(() => videoAd.show())
              .catch((err) => {
                wx.showToast({
                  title: "系统发生错误，请联系管理员",
                  icon: "none",
                });
              });
          });
        })
        .catch((res) => {
          console.log("取消观看广告");
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
    return parseApi.transcodeStats(data).then((res) => {
      let allowDownload = res.data.size < bytes("200MB");
      res.data.createFromNow = dayjs(res.data.createTime).fromNow();
      res.data.doneFromNow = dayjs(res.data.doneTime).fromNow();
      res.data.size = bytes(res.data.size);
      const d = dayjs.duration(res.data.time, "seconds");
      res.data.timeText = `${String(d.minutes()).padStart(2, "0")}分${String(
        d.seconds()
      ).padStart(2, "0")}秒`;
      this.setData({
        allowDownload: allowDownload,
        info: res.data,
      });
    });
  },
  onRefresh() {
    this.setData({
      enable: true,
    });
    this.getInfo().then((res) => {
      this.setData({
        enable: false,
      });
    });
  },
  // 保存音频
  saveVideo: function (e) {
    if (!this.data.adSkip) {
      videoAdFn = () => {
        this.saveVideo(e);
      };
      this.showAd();
      return;
    }
    let that = this;
    let curAudioDownloadTask = this.data.audioDownloadTask;
    // 正在下载中，终止下载
    console.log(curAudioDownloadTask);
    if (curAudioDownloadTask && curAudioDownloadTask.action) {
      let downloadTask = curAudioDownloadTask.downloadTask;
      downloadTask.abort();
      this.setData({
        downloadTask: null,
      });
      return;
    }
    const downloadTask = wx.downloadFile({
      url: this.data.info.downloadUrl,
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
              wx.showToast({ title: "保存失败", icon: "none" });
              that.setData({
                [`audioDownloadTask`]: null,
              });
            },
          });
        } else {
          wx.saveFileToDisk({
            filePath: res.tempFilePath,
            success(res) {
              console.log(res);
              wx.showToast({ title: "保存成功", icon: "none" });
            },
            fail(res) {
              console.log(res);
              wx.showToast({ title: "保存失败", icon: "none" });
              that.setData({
                [`audioDownloadTask`]: null,
              });
            },
          });
        }
      },
      fail: (res) => {
        wx.showToast({
          title: "下载失败",
          icon: "none",
        });
        this.setData({
          [`audioDownloadTask.action`]: false,
        });
      },
    });
    this.setData({
      audioDownloadTask: {
        downloadTask,
        progress: 0,
        action: true,
      },
    });
    // 下载进度
    downloadTask.onProgressUpdate((res) => {
      // let progress = res.progress || 100;
      this.setData({
        [`audioDownloadTask.progress`]: res.progress,
      });
      console.log(res.progress);
      if (res.progress == 100) {
        this.setData({
          [`audioDownloadTask.action`]: false,
        });
      }
    });
  },
  copyText() {
    this.copy(this.data.info.downloadUrl);
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
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {},

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {},

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
