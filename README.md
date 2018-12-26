## What is this?

I had the idea in 2017 to make an agent capable of doing some task without human knowledge. I did not know what task I wanted to train it for but I figured that [Connect Four](https://en.wikipedia.org/wiki/Connect_Four) would be a pretty good starting project as the state space is neither too large nor too trivial. I asked a friend (Rumi) who works as a machine learning scientist and biologist what kinds of texts I should read to start such a project and he pointed me to a book by [Dr. Richard Sutton](https://en.wikipedia.org/wiki/Richard_S._Sutton).

Over the summer of 2018 I finished up to Chapter 5 of Dr. Sutton's 2nd Edition of [Reinforcement Learning](https://www.amazon.com/Reinforcement-Learning-Introduction-Adaptive-Computation/dp/0262039249). So I decided to make a project out of it.

The book does a much better job of explaining the fundamental concepts of reinforcement learning, so I'll present a brief breakdown of the experiment I devised. The project performs On-policy first-visit Monte Control described on page 101 of the aforementioned book. If you're interested, the book is actually available for free on Dr. Sutton's [website](http://incompleteideas.net). If you don't like reading, [DeepMind](https://www.youtube.com/channel/UCP7jMXSY2xbc3KCAE0MHQ-A) has great lectures on their YouTube channel about reinforcement learning.

#### experiment

- Let `policy1` be an epsilon-greedy policy epsilon = `0.1`

- Generate `2000000` episodes having `policy1` play against `policy1`

- Copy the state-action probabilities of `policy1` to a new agent `policy2`, an epsilon greedy policy with epsilon = `0.1`

- Perform On-policy first-visit Monte Control for for estimating π <sub>* </sub> on `policy1` <sup>1</sup>

- update `policy1`'s epsilon value to `0`

- Generate `100000` episodes with `policy1` vs `policy2`, episode statistics output shown below


 <sup>1</sup> In this step for each episode we observe the state-action-reward sequence from the perspective of the both of getting a `WIN_REWARD` and `LOSE_REWARD`, even though we are updating only 1 agent. For example, if we lose, we can still use the episode from the perspective of the "opponent" who won. In the cases of a tie, it doesn't matter.

##### experiment output

`policy1` wins: 61155

`policy2` wins: 30247

ties: 236

## Building & Running

#### build image

```sh
npm -g install yarn
yarn
cd docker
docker build --rm -t connect4-rl .
```

#### run from github

```sh
docker-compose up
```

#### run local

To run locally, mount the root directory under `api` in `docker-compose.yml`

```sh
  volumes:
    - ./:/root/connect4-rl
```

#### watch for web changes

```sh
npm run watch-web
```

#### watch for server changes

```sh
npm run watch-server
```

## API Methods

#### Create an epsilon-greedy policy

```
POST /policy

{
  "epsilon": 0.1
}
```

#### Get information about an epsilon greedy policy

```
GET /policy/{policyId}
```

#### Update an ϵ-greedy policy

```
POST /policy/{policyId}

{
  "epsilon": 0
}
```

#### Generate {count} episodes

```
POST /episode/{policyId1}/{policyId2}/{count}
```

###### example response

```json
{
    "seriesId": "5c23b56f14f7f90053ef9c76"
}
```

#### Get information about a series of episodes

```
GET /series/{seriesId}
```

###### example response

```json
{
    "count": 187086,
    "data": [
        {
            "winRate": 0.6497334487142506,
            "lossRate": 0.3472858775893935,
            "defaultRate": 0.0029806736963558862,
            "_id": "5c1fd56a14f7f90053d48309",
            "win": 60817,
            "loss": 32507,
            "default": 279
        },
        {
            "winRate": 0.34777446166682713,
            "lossRate": 0.6492410384775842,
            "defaultRate": 0.0029844998555887165,
            "_id": "5c23b55d14f7f90053ef9c75",
            "win": 32511,
            "loss": 60693,
            "default": 279
        }
    ]
}
```


#### Update a policy from a series of episodes

```http
POST /policy/{policyId}/update/{seriesId}
```

###### example response

```json
{
    "seriesId": "5c23b56f14f7f90053ef9c76"
}
```

#### Get information about an update session

```http
GET /session/{sessionId}
```

###### example response

The end key present in the response when the update is complete

```json
{
    "_id": "5c209afc14f7f90053ef9c73",
    "count": 3911479,
    "start": "2018-12-24T08:38:20.576Z",
    "type": "MONTE_CARLO_ON_POLICY_FIRST_VISIT",
    "index": 3911400,
    "policyId": "5c1fd56a14f7f90053d48309",
    "end": "2018-12-26T14:36:28.161Z"
}
```
