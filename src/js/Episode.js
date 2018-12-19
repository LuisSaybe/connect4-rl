export default class Episode {
  constructor() {
    this.sars = [];
    this.serialization = null;
    this.seriesId = null;
    this.policyId = null;
  }

  append(state, action, reward) {
    this.sars.push({state, action, reward});
  }

  serialize() {
    return JSON.stringify(
      this.sars.map(({ state, action, reward }) => [state, action, reward])
    );
  }
}
