import React from 'react';
import { BrowserRouter, Route, Switch } from 'react-router-dom';

import { PolicyGame } from 'js/web/policyGame';

export class Application extends React.Component {
  render() {
    return (
      <BrowserRouter>
        <Switch>
          <Route path='/play/:policyId' component={PolicyGame} />
        </Switch>
      </BrowserRouter>
    );
  }
}
