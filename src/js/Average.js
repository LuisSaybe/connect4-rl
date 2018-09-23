export default class Average {
  constructor(initial = Math.random()) {
    this.average = initial;
    this.count = 1;
  }

  append(number) {
    this.count++;
    this.average = this.average + (number - this.average) / this.count;
  }
}