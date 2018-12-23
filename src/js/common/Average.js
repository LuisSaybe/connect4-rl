export class Average {
  constructor(average = Math.random(), count = 1) {
    this.average = average;
    this.count = count;
  }

  append(number) {
    this.count++;
    this.average = this.average + (number - this.average) / this.count;
  }
}
