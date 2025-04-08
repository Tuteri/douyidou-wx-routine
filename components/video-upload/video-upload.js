const { uploadFile } = require('../../utils/upload');

Component({
  properties: {},

  data: {
    filepath: null,
    fileExt: null,
    uploadTask: {
      process: 0,
      action: false
    }
  },

  methods: {
    // 选择视频文件
    onSelectFile() {
      const supportExt = ['AVI', 'FLV', 'MKV', 'MPG', 'MP4', 'TS', 'MOV', 'MXF'];

      wx.chooseMedia({
        count: 1,
        mediaType: ['video'],
        sourceType: ['album'],
        sizeType: ['original'],
        success: res => {
          const filepath = res.tempFiles[0].tempFilePath;
          const ext = filepath.split('.').pop().toUpperCase();

          if (!supportExt.includes(ext)) {
            wx.showToast({
              title: '不支持的视频格式',
              icon: 'none'
            });
            return;
          }

          this.setData({
            filepath,
            fileExt: ext.toLowerCase()
          });

          wx.getVideoInfo({
            src: filepath,
            success: info => {
              if (info.duration > 1800) {
                wx.showToast({
                  title: '视频时长不能超过30分钟',
                  icon: 'none'
                });
              }
            }
          });
          this.triggerEvent('selectFile', {
            filepath,
            fileExt: ext.toLowerCase()
          });
        }
      });
    },
    clearFile(){
      this.setData({
        filepath:null,
        fileExt:null,
      })
    },
    // 上传视频到后台
    videoUpload() {
      const { filepath, fileExt } = this.data;
      if (!filepath) {
        wx.showToast({ title: '请先选择视频', icon: 'none' });
        return;
      }
      wx.showLoading({
        title: '上传中...'
      });
      this.setData({
        uploadTask: { action: true, process: 0 }
      });
      const { promise, uploadTask } = uploadFile(filepath);
      promise
        .then(res => {
          wx.hideLoading();
          this.setData({
            uploadTask: { action: false, process: 0 }
          });
          if (res.code === 200) {
            wx.showToast({ title: '上传成功' });
            this.triggerEvent('onSuccess', res.data);
          } else {
            wx.showToast({ title: '上传失败', icon: 'none' });
          }
        })
        .catch(res => {
          wx.hideLoading();
          console.log('上传失败', err);
          wx.showToast({ title: '上传出错', icon: 'none' });
          this.setData({
            uploadTask: {  action: false,  process: 0 }
          });
        });
      // 监听上传进度
      uploadTask.onProgressUpdate(progress => {
        this.setData({
          ['uploadTask.process']: progress.progress,
          ['uploadTask.action']: true
        });
      });
    }
  }
});
