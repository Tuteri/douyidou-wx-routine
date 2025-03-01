function requestPostApi(url, params, sourceObj, successFun, failFun) {
  requestApi(url, params, 'POST', sourceObj, successFun, failFun)
}


function requestGetApi(url, params, sourceObj, successFun, failFun) {
  requestApi(url, params, 'GET', sourceObj, successFun, failFun)
}

function requestApi(url, params, method, sourceObj, successFun, failFun) {
  wx.showLoading({
    mask: true,
  })
  wx.request({
    url: url,
    method: method,
    data: params,
    header: {
      'Content-Type': "application/x-www-form-urlencoded",
    },
    success: function (res) {
      typeof successFun == 'function' && successFun(res.data, sourceObj);
    },
    fail: function (res) {
      typeof failFun == 'function' && failFun(res.data, sourceObj);
    },
    complete: function (res) {
      wx.hideLoading();
    }
  })
}

module.exports = {
  requestPostApi,
  requestGetApi
}