import React from 'react';
import './src/helpers/tracing.js';

import { NotificationProvider } from './src/context/AddItemNotificationProvider';

export const wrapRootElement = ({ element }) => (
  <NotificationProvider>{element}</NotificationProvider>
);
