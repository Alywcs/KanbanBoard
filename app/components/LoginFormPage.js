import React, { useEffect, useContext } from 'react';
import Page from './Page';

function LoginFormPage() {
  return (
    <Page title="Login">
      <div className="text-center">
        <h3 style={{ color: '#000', fontWeight: 'bold' }}>
          WELCOME TO TASK MANAGEMENT SYSTEM!
        </h3>
        <p style={{ color: '#000', width: '80%', margin: '30px 50px' }}>
          We're excited to have you on board. <br />
          To get started, please log in using your credentials. <br />
          Once you log in, you'll have access to all the powerful features and tools our
          system has to offer.
        </p>
        <p style={{ color: '#000', fontSize: '20px', fontWeight: 'bold' }}>
          Happy task managing! <br />
          Let's make every day productive and efficient together!
        </p>
      </div>
    </Page>
  );
}

export default LoginFormPage;
