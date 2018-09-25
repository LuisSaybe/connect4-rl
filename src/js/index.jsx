import React from 'react';
import ReactDOM from 'react-dom';
import Application from 'js/Application';
import MutableEpsilonPolicy from 'js/MutableEpsilonPolicy';
import Board from 'js/Board';

fetch('http://127.0.0.1/output/output.json')
  .then(r => r.json())
  .then(r => {
    const { policy } = r;

    const epsilonPolicy = new MutableEpsilonPolicy(0, Board.ACTIONS);
    epsilonPolicy.policy = policy.policy;

    const rootDiv = document.querySelector('body > div');
    ReactDOM.render(<Application policy={epsilonPolicy} />, rootDiv);
  });
