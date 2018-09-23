export default class StochasticHelper {
  static arrayRandom(subject) {
    return subject[Math.floor(Math.random() * subject.length)];
  }

  static average(array) {
    let sum = 0;

    for (const number of array) {
      sum += number;
    }

    return sum / array.length;
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
      const newDistribution = [];
      const newSelections = [];
      let contributions = 0;
      let contributionsLength = 0;

      for (let index = 0; index < selections.length; index++) {
        const selecton = selections[index];
        const probability = distribution[index];

        if (disallow.includes(selecton)) {
          contributions += probability;
          contributionsLength++;
        } else {
          newDistribution.push(probability);
          newSelections.push(selecton);
        }
      }

      for (let index = 0; index < newDistribution.length; index++) {
        newDistribution[index] += contributions / contributionsLength;
      }

      return this.selectFromProbabilityDistributionHelper(newDistribution, newSelections);
  }

  static selectFromProbabilityDistributionHelper(distribution, selections) {
      const randomNumber = Math.random();
      let s = 0;

      for (let i = 0; i < selections.length - 1; i++) {
          s += distribution[i];
          const selection = selections[i];

          if (randomNumber < s) {
              return selection;
          }
      }

      return selections[selections.length - 1];
  }
}
