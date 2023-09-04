import React from 'react';
import Footer from '@theme-original/Footer';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import {MendableFloatingButton} from '@mendable/search';

export default function FooterWrapper(props) {
  const {
    siteConfig: {customFields},
  } = useDocusaurusContext();

  return (
    <>
      <MendableFloatingButton
        icon={
          <img src="img/jest.png" alt="Mendable Robot Icon" width={'40px'} />
        }
        floatingButtonStyle={{
          color: '#ffffff',
          backgroundColor: '#99424F',
        }}
        dialogCustomStyle={{
          dialogTopMargin: '64px',
        }}
        cmdShortcutKey="j"
        anon_key={customFields.mendableAnonKey}
        dismissPopupAfter={5}
        dialogPlaceholder="What is Jest?"
        welcomeMessage="Welcome! How can I help?"
      />
      <Footer {...props} />
    </>
  );
}
