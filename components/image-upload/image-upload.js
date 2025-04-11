const { uploadFile } = require('../../utils/upload');
Component({
  /**
   * 组件的属性列表
   */
  properties: {},

  /**
   * 组件的初始数据
   */
  data: {
    fileList: [],
    uploadList:[],
  },

  /**
   * 组件的方法列表
   */
  methods: {
    handleAdd(e) {
      const { fileList } = this.data;
      const { files } = e.detail;

      // 方法1：选择完所有图片之后，统一上传，因此选择完就直接展示
      // this.setData({
      //   fileList: [...fileList, ...files] // 此时设置了 fileList 之后才会展示选择的图片
      // });
      // 方法2
      files.forEach(file => this.onUpload(file));
    },
    onSelectChange(e) {
      console.log(e);
    },
    onUpload(file) {
      const { fileList,uploadList } = this.data;
      this.setData({
        fileList: [...fileList, { ...file, status: 'loading' }],
        uploadList: [...uploadList, {  }]
      });
      const { length } = fileList;
      const { promise, uploadTask } = uploadFile(file.url);
      promise.then(res => {
        if (res.code !== 200) {
          wx.showToast({
            title: '图片上传失败',
            icon: 'none'
          });
          this.setData({
            [`fileList[${length}].status`]: 'done'
          });
        }else{
          this.setData({
            [`fileList[${length}].status`]: 'done',
            [`fileList[${length}].data`]: res.data,
          });
          this.triggerEvent('success', this.data.fileList);
        }
      });
      uploadTask.onProgressUpdate(res => {
        this.setData({
          [`fileList[${length}].percent`]: res.progress
        });
      });
    },
    onSuccess() {
      // this.triggerEvent('success', JSON.stringify(this.data.uploadList),{
      //   bubbles: true,
      //   composed: true
      // });
    },
    handleRemove(e) {
      const { index } = e.detail;
      const { fileList } = this.data;
      fileList.splice(index, 1);
      this.setData({
        fileList
      });
    }
  }
});
