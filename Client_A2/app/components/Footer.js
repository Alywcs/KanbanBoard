import React from 'react';
import { Link } from 'react-router-dom';

function Footer() {
  return (
    <footer className="border-top text-center small text-muted py-3">
      <p className="m-0">
        Copyright &copy; {new Date().getFullYear()}{' '}
        <a href="/" className="text-muted">
          Task Management System
        </a>
        . All rights reserved.
      </p>
    </footer>
  );
}

export default Footer;
