import React from 'react';
import ReactDOM from 'react-dom';
import Application from 'js/Application';
import MutableEpsilonPolicy from 'js/MutableEpsilonPolicy';
import Board from 'js/Board';

fetch('http://127.0.0.1/output/output.json')
  .then(r => r.json())
  .then(r => {
    const { statistics, agent } = r;
    console.log('statistics', statistics);

    const policy = new MutableEpsilonPolicy(0, Board.ACTIONS);
    policy.policy = agent.policy;

    console.log('policy', policy);

    const rootDiv = document.querySelector('body > div');
    ReactDOM.render(<Application policy={policy} />, rootDiv);
  });
