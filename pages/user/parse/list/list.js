const parseApi = require('../../../../api/parse')
const {
  dayjs
} = require('../../../../utils/util')
Page({
  /**
   * 组件的初始数据
   */
  data: {
    enable: false,
    list: [],
    scrollTop: 0,
    param: {
      page: 1,
      limit: 20,
      total: 0,
      totalPage: 0,
    },
    statsMap: {
      0: "失败",
      1: "已完成",
    }
  },
  onReady() {
    this.setData({
      enable: true
    });
    this.getList().then(res => {
      this.setData({
        enable: false
      });
    })
  },
  /**
   * 组件的方法列表
   */
  onRefresh() {
    this.setData({
      enable: true
    });
    this.setData({
      ['param.page']: 1,
      ['param.total']: 0,
      ['param.totalPage']: 0,
      list: [],
    })
    this.getList().then(res => {
      this.setData({
        enable: false
      });
    });
  },
  onScroll(e) {
    const {
      scrollTop
    } = e.detail;
    this.setData({
      scrollTop
    });
  },
  onScrollToLower(e) {
    console.log("滚动到页面底部")
    if (this.data.param.page != 0) {
      this.getList();
    }
  },
  // 获取数据
  getList() {
    let data = {
      page: this.data.param.page,
      limit: this.data.param.limit,
    }
    return parseApi.urlList(data).then(res => {
      res.data.list.forEach(item => {
        item.createFromNow = dayjs(item.createTime).fromNow();
        if(!item.text) {
          item.text = "Unknow";
        }else if(item.text.length>10){
          item.text = item.text.substr(0,10)+"...";
        }
        if(item.cover){
          item.cellImage = item.cover;
        }else if(item.images && item.images.length>0){
          item.cellImage = item.images[0];
        }else{
          item.cellImage = "http://imgurl.diadi.cn/imgs/2025/03/aff0533d65b6a30d.png";
        }
      });
      this.setData({
        list: this.data.list.concat(res.data.list),
        ['param.page']: res.data.nextPage,
        ['param.total']: res.data.total,
        ['param.totalPage']: res.data.totalPage,
      })
    })
  }
})