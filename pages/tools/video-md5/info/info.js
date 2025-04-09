const app = getApp();
const parseApi = require('../../../../api/parse');
const userApi = require('../../../../api/user');
import bytes from 'bytes';
const { dayjs, openSetting, showDialog } = require('../../../../utils/util');
const RewardedVideoAd = require('../../../../utils/rewarded-video-ad');
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
          width: '327rpx'
        },
        {
          width: '327rpx'
        }
      ],
      [
        {
          width: '168rpx',
          height: '32rpx'
        },
        {
          width: '486rpx',
          height: '32rpx'
        }
      ],
      [
        {
          width: '168rpx',
          height: '32rpx'
        },
        {
          width: '486rpx',
          height: '32rpx'
        }
      ],
      [
        {
          width: '118rpx',
          height: '32rpx'
        },
        {
          width: '536rpx',
          height: '32rpx'
        }
      ],
      [
        {
          width: '100%',
          height: '32rpx'
        }
      ],
      [
        {
          width: '100%',
          height: '32rpx'
        }
      ]
    ],
    showSkeleton: true,
    videoDownloadTask: null,
    allowDownload: false,
    adSkip: false,
    isSave: false, //保存状态，只触发一次
    config: {},
    isMobile: true
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this.setData({
      id: options.id,
      isMobile: app.globalData.isMobile
    });

    app.init().then(() => {
      const config = app.globalData.config;
      this.setData({
        config
      });
      // 保存广告激励
      if (this.data.config.adSaveStatus === 'false') {
        this.setData({
          adSkip: true
        });
      }
      videoAd = new RewardedVideoAd(config.adRewardsId, 'video-md5/info');
      videoAd.init();
    });
    this.getInfo().then(res => {
      this.setData({
        showSkeleton: false
      });
    });
  },
  // 展示广告
  async showAd() {
    if (!this.data.isSave) {
      const adSkip = await app.computeAdSkipSave();
      if (adSkip) await userApi.consumer({ type: 1 });
      this.setData({
        adSkip: adSkip
      });
    }
    if (videoAd && !this.data.adSkip) {
      showDialog('您没有保存次数，继续观看广告获取保存次数？')
        .then(res => {
          videoAd.show().then(res => {
            // 发起领奖
            app.handleRewardClaim(4, this.data.config.adRewardsId, this.data.id).then(async res => {
              userApi.consumer({ type: 1 });
              this.setData({
                adSkip: true,
                isSave: true
              });
              videoAdFn();
            });
          });
        })
        .catch(res => {
          console.log('取消观看广告');
        });
    } else {
      this.setData({
        adSkip: true
      });
      videoAdFn();
    }
  },
  getInfo() {
    let data = {
      id: this.data.id
    };
    return parseApi.transcodeStats(data).then(res => {
      let allowDownload = res.data.size < bytes('200MB');
      res.data.createFromNow = dayjs(res.data.createTime).fromNow();
      res.data.doneFromNow = dayjs(res.data.doneTime).fromNow();
      res.data.size = bytes(res.data.size);
      const d = dayjs.duration(res.data.time, 'seconds');
      let m = '';
      let s = '';
      if (d.minutes() > 0) {
        m = `${String(d.minutes()).padStart(2, '0')}分`;
      }
      if (d.seconds() > 0) {
        s = `${String(d.seconds()).padStart(2, '0')}秒`;
      }
      res.data.timeText = m + s;
      this.setData({
        allowDownload: allowDownload,
        info: res.data
      });
    });
  },
  onRefresh() {
    this.setData({
      enable: true
    });
    this.getInfo().then(res => {
      this.setData({
        enable: false
      });
    });
  },
  // 保存视频
  saveVideo: function (e) {
    if (!this.data.adSkip) {
      videoAdFn = () => {
        this.saveVideo(e);
      };
      this.showAd();
      return;
    }
    let that = this;
    let curVideoDownloadTask = this.data.videoDownloadTask;
    // 正在下载中，终止下载
    console.log(curVideoDownloadTask);
    if (curVideoDownloadTask && curVideoDownloadTask.action) {
      let downloadTask = curVideoDownloadTask.downloadTask;
      downloadTask.abort();
      this.setData({
        downloadTask: null
      });
      return;
    }
    openSetting().then(res => {
      const downloadTask = wx.downloadFile({
        url: this.data.info.downloadUrl,
        useHighPerformanceMode: true,
        timeout: 1800000,
        success: res => {
          wx.saveVideoToPhotosAlbum({
            filePath: res.tempFilePath,
            success(res) {
              wx.showToast({
                title: '保存成功'
              });
            },
            fail(res) {
              wx.showToast({
                title: '保存失败',
                icon:'none'
              });
            }
          });
        },
        fail: res => {
          wx.showToast({
            title: '下载失败',
            icon: 'none'
          });
          this.setData({
            [`videoDownloadTask.action`]: false
          });
        }
      });
      this.setData({
        videoDownloadTask: {
          downloadTask,
          progress: 0,
          action: true
        }
      });
      // 下载进度
      downloadTask.onProgressUpdate(res => {
        // let progress = res.progress || 100;
        this.setData({
          [`videoDownloadTask.progress`]: res.progress
        });
        console.log(res.progress);
        if (res.progress == 100) {
          this.setData({
            [`videoDownloadTask.action`]: false
          });
        }
      });
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
      data: text
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
  onShareAppMessage() {}
});
