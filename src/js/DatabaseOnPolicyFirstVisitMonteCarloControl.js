import mongodb from 'mongodb';
import Environment from 'js/Environment';
import Average from 'js/Average';
import { STATE_ACTION_AVERAGE_COLLECTION } from 'js/database';

export class DatabaseOnPolicyFirstVisitMonteCarloControl {
  constructor(db, policy, gamma = 1, sessionId = new mongodb.ObjectID()) {
    this.db = db;
    this.policy = policy;
    this.gamma = gamma;
    this.sessionId = sessionId;
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

        this.policy.actions.forEach((action) => {
          let probability;

          if (availableActions.includes(action)) {
            const denominator = this.policy.epsilon / availableActions.length;

            if (bestAction === action) {
              probability = 1 - this.policy.epsilon + denominator;
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
    const collection = this.db.collection(STATE_ACTION_AVERAGE_COLLECTION);
    const oldAverageReturnDB = await this.getAverageReturnHelper(state, action);

    let newAverageReturn;

    if (oldAverageReturnDB === null) {
      newAverageReturn = new Average(returnInstance);
    } else {
      newAverageReturn = new Average(oldAverageReturnDB.average, oldAverageReturnDB.count);
      newAverageReturn.append(returnInstance);
    }

    return collection.findOneAndUpdate(
      {
        state,
        action,
        sessionId: this.sessionId,
      },
      {
        $set: {
          state,
          action,
          sessionId: this.sessionId,
          average: newAverageReturn.average,
          count: newAverageReturn.count
        }
      },
      {
        returnOriginal: false,
        upsert: true
      }
    );
  }

  getAverageReturnHelper(state, action) {
    const collection = this.db.collection(STATE_ACTION_AVERAGE_COLLECTION);
    return collection.findOne({sessionId: this.sessionId, state, action });
  }

  async getAverageReturn(state, action) {
    let document = await this.getAverageReturnHelper(state, action);

    if (document === null) {
      const { value } = await this.appendAverageReturn(state, action, new Average().average);
      document = value;
    }

    return document;
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
