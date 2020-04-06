
export default class Timer {
    constructor({ count = 10 }) {
      this.countdown = count;
      this.count = count;
      this.interval = null;
      this.end = () => {}
      this.tick = () => {}
    }
    start = () => {
      if (this.interval) return;
      this.interval = setInterval(() => {
        if (this.count <= 1) {
          clearInterval(this.interval);
          return this._end();
        }
        this.count = this.count - 1;
        this.tick(this.count);
      }, 1000);
    }
    _end() {
      this.clear();
      this.end();
    }
    clear = () => {
      this.count = this.countdown;
      clearInterval(this.interval);
      this.interval = null;
    }
    reset = () => {
      this.count = this.countdown;
    } 
  }
  