const parseApi = require('../../../../api/parse')
const {dayjs} = require('../../../../utils/util')
Component({
  /**
   * 组件的初始数据
   */
  data: {
    enable: false,
    list: [],
    param: {
      page: 1,
      limit: 10,
      total: 0,
      totalPage: 0,
      scrollTop: 0,
    },
    statsMap: {
      "-1": "不存在",
      0: "等待中",
      1: "进行中",
      2: "已完成",
      3: "失败",
      4: "终止",
    }
  },
  ready() {
    this.setData({
      enable: true
    });
    this.getList().then(res=>{
      this.setData({
        enable: false
      });
    })
  },
  /**
   * 组件的方法列表
   */
  methods: {
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
      return parseApi.transcodeList(data).then(res => {
        res.data.list.forEach(item => {
          item.createFromNow = dayjs(item.createTime).fromNow()
          item.doneFromNow = dayjs(item.doneTime).fromNow()
        });
        this.setData({
          list: this.data.list.concat(res.data.list),
          ['param.page']: res.data.nextPage,
          ['param.total']: res.data.total,
          ['param.totalPage']: res.data.totalPage,
        })
      })
    }
  }
})