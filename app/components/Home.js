import React, { useEffect, useContext } from 'react';
import Page from './Page';
import UseContext from '../UseContext';

function Home() {
  const { username } = useContext(UseContext);
  return (
    <Page title="Home">
      <h2 className="text-center">
        Hello <strong>{username}</strong>, there is no task.
      </h2>
      <p className="lead text-muted text-center">...</p>
    </Page>
  );
}

export default Home;
