import mongodb from 'mongodb';
import Environment from 'js/Environment';
import Average from 'js/Average';

export default class DatabaseOnPolicyFirstVisitMonteCarloControl {
  static stateActionAverageCollectionName = 'state_action_average';

  constructor(db, policy, epsilon, gamma = 1, controlId = new mongodb.ObjectID()) {
    this.db = db;
    this.policy = policy;
    this.epsilon = epsilon;
    this.gamma = gamma;
    this.controlId = controlId;
  }

  async update(episode) {
    let episodeReturns = 0;

    for (let index = episode.length - 2; index > -1; index--) {
      const step = episode[index];
      const stepAfter = episode[index + 1];

      episodeReturns = this.gamma * episodeReturns + stepAfter.reward;

      const previousSARs = episode.slice(0, index);
      const stepDidAppearInSeries = DatabaseOnPolicyFirstVisitMonteCarloControl.stepAppearsInSeries(step, previousSARs);

      if (!stepDidAppearInSeries) {
        await this.appendAverageReturn(step.state, step.action, episodeReturns);

        const availableActions = Environment.getActionsAvailableInState(step.state);
        const actionReturnsFutures = availableActions
          .map(action => this.getAverageReturn(step.state, action));

        const actionReturns = (await Promise.all(actionReturnsFutures))
            .sort((a, b) => a.average - b.average);

        const { action: bestAction } = actionReturns[actionReturns.length - 1];
        const actionProbabilities = {};

        Environment.getActions().forEach((action) => {
          let probability;

          if (availableActions.includes(action)) {
            const denominator = this.epsilon / availableActions.length;

            if (bestAction === action) {
              probability = 1 - this.epsilon + denominator;
            } else {
              probability = denominator;
            }
          } else {
            probability = 0;
          }

          actionProbabilities[action] = probability;
        });

        await this.policy.setProbabilities(step.state, actionProbabilities);
      }
    }
  }

  async appendAverageReturn(state, action, returnInstance) {
    const collection = this.db.collection(DatabaseOnPolicyFirstVisitMonteCarloControl.stateActionAverageCollectionName);
    const oldAverageReturnDB = await this.getAverageReturnHelper(state, action);

    let newAverageReturn;

    if (oldAverageReturnDB === null) {
      newAverageReturn = new Average(returnInstance);
    } else {
      newAverageReturn = new Average(oldAverageReturnDB.average, oldAverageReturnDB.count);
      newAverageReturn.append(returnInstance);
    }

    return new Promise((resolve, reject) => {
      collection.updateOne(
        {
          controlId: this.controlId,
          state,
          action
        },
        {
          $set: {
            controlId: this.controlId,
            state,
            action,
            average: newAverageReturn.average,
            count: newAverageReturn.count
          }
        },
        {
          upsert: true
        }, function(err, r) {
          if (err) {
            reject(err);
          } else {
            resolve(r);
          }
        }
      );
    });
  }

  getAverageReturnHelper(state, action) {
    const collection = this.db.collection(DatabaseOnPolicyFirstVisitMonteCarloControl.stateActionAverageCollectionName);

    return new Promise((resolve, reject) => {
      collection.findOne({controlId: this.controlId, state, action }, (err, document) => {
        if (err) {
          reject(err);
        } else {
          resolve(document);
        }
      });
    });
  }

  async getAverageReturn(state, action) {
    let document = await this.getAverageReturnHelper(state, action);

    if (document === null) {
      await this.appendAverageReturn(state, action, new Average().average);
    }

    return this.getAverageReturnHelper(state, action);
  }

  static stepAppearsInSeries(step, series) {
    for (const { state, action } of series) {
      if (step.state === state && step.action === action) {
        return true;
      }
    }

    return false;
  }
}
