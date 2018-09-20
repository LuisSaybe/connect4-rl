export default class StochasticHelper {
  static arrayRandom(subject) {
    return subject[Math.floor(Math.random() * subject.length)];;
  }

  static getRandomProbabilityDistribution(length) {
    const max = 20;
    const result = [];

    for (let index = 0; index < length; index++) {
      result.push(Math.floor(Math.random() * max));
    }

    const sum = result.reduce((a, b) => a + b, 0);

    for (let index = 0; index < length; index++) {
      result[index] /= sum;
    }

    return result;
  }

  static selectFromProbabilityDistribution(distribution, selections, disallow = []) {
      const randomNumber = Math.random();
      let s = 0;
      const set = new Set();
      disallow.forEach(subject => set.add(subject));

      for (let i = 0; i < selections.length - 1; i++) {
          s += distribution[i];
          const selection = selections[i];

          if (randomNumber < s && !set.has(selection)) {
              return selection;
          }
      }

      return selections[selections.length - 1];
  }
}
