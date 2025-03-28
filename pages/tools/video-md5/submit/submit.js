const parseApi = require("../../../../api/parse")
Component({
  /**
   * 页面的初始数据
   */
  data: {
    name: '',
    url: '', // 用户输入的视频 URL
  },
  methods: {
    // 输入框变化事件
    onUrlInputChange(e) {
      this.setData({
        url: e.detail.value
      });
    },

    // 提交表单事件
    onSubmit() {
      const {
        name,
        url,
      } = this.data;
      if (!this.extractUrl(url)) {
        wx.showToast({
          title: '请输入正确的视频 URL',
          icon: 'none'
        });
        return;
      }
      let data = {
        url,
        name,
      }
      wx.showLoading({
        title:"提交中...",
        mask:true,
      })
      parseApi.videoMd5(data).then(res => {
        wx.hideLoading()
        if (res.code == 200) {
          this.setData({
            url:"",
            name:"",
          })
          // 提交表单
          wx.showToast({
            title: '任务已提交',
            icon: 'success'
          });
        }
      }).catch(res=>{
        wx.hideLoading()
        console.log(res)
        wx.showToast({
          title: res.message,
          icon:'none'
        });
      })
    },
    extractUrl: function (text) {
      // 正则表达式匹配 http 或 https 开头的 URL
      // let regex = /https?:\/\/[^\s,;，。\(\)【】]+/g;
      let regex = /(http|https):\/\/[\w\-_]+(\.[\w\-_]+)+([\w\-\.,@?^=%&:/~\+#]*[\w\-\@?^=%&/~\+#])?/;
      let matches = text.match(regex);
      return matches ? matches[0] : null; // 返回第一个匹配的 URL
    },
  },
})