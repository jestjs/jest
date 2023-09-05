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
        style={{
          darkMode: true,
          accentColor: '#15C213',
        }}
        icon={
          <img
            src="/img/jest-white.svg"
            alt="Mendable Robot Icon"
            width={'40px'}
          />
        }
        floatingButtonStyle={{
          color: '#ffffff',
          backgroundColor: '#15C213',
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
