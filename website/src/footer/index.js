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
      <MendableFloatingButton anon_key={customFields.mendableAnonKey} />
    </>
  );
}
