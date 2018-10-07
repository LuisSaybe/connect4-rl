export default class Episode {
  constructor() {
    this.series = [];
  }

  append(state, action, reward) {
    this.series.push({state, action, reward});
  }

  serialize() {
    let string = '';

    for (const { state, action, reward } of this.series) {
      const prefix = string === '' ? '' : '|';
      string += `${prefix}${state},${action},${reward}`;
    }

    return string;
  }
}