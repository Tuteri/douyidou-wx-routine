const app = getApp();
const configApi = require('../../../api/config')
Page({
  data: {
    list:[],
    expandIds:[],
    // list: [
    //   {
    //     title: "声明 !",
    //     desc:
    //       '功能仅供个人娱乐学习,严禁商业用途。解析出来的视频归相关网站及作者所有。本站不储存任何视频及图片。',
    //   },
    //   {
    //     title: "积分是什么？",
    //     desc:
    //       '积分即tokens，消耗一定积分可以兑换解析/下载/转码等次数，还可以使用视频OCR等AI功能',
    //   },
    //   {
    //     title: "如何去水印？",
    //     desc:
    //       '打开需要去水印的APP,点击分享按钮,选"复制链接",打开小程序后会自动抓取复制的链接,如果没有自动抓取,自行粘贴到链接文本框里,点击去除即可。',
    //   },
    //   {
    //     title: "突然使用不了,下载不了怎么办？",
    //     desc:
    //       "刚刚发布的视频或者刚取消私密的视频可能会出现解析出有水印或者无法解析的情况,需要等待一段时间再来解析。",
    //   },
    //   {
    //     title: "为什么会解析失败？",
    //     desc:
    //       "视频被删除、视频是私密的、视频在审核中、账号是私密的,都会解析失败。",
    //   },
    // ],
  },
  onLoad(){
    
  },
  onShow(){
    app.init().then(()=>{
      configApi.help().then(res=>{
        if(res.code === 200){
          let list = res.data;
          let expandIds = list.filter(i => i.expand === 0).map(i => i.id)
          console.log(expandIds)
          this.setData({
            list,expandIds
          })
        }
      })
    })
  }
});
