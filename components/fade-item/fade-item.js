Component({
  data: {
    visible: false
  },

  lifetimes: {
    attached() {
      this.createIntersectionObserver()
        .relativeToViewport({ bottom: 0 })
        .observe('#fadeItem', (res) => {
          if (res.intersectionRatio > 0 && !this.data.visible) {
            this.setData({ visible: true });
          }
        });
    }
  }
});
