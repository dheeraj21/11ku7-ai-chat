import React, { useState } from 'react';
import ProviderSelection from './components/ProviderSelection';
import MainInterface from './components/MainInterface';
import { Provider, AppState } from './types';

function App() {
  const [isConfigured, setIsConfigured] = useState(false);
  const [appState, setAppState] = useState<Pick<AppState, 'provider' | 'model' | 'apiKey' | 'baseURL'>>({
    provider: null,
    model: null,
    apiKey: '',
    baseURL: undefined
  });

  const handleProviderSelect = (provider: Provider, model: string, apiKey: string, baseURL?: string) => {
    setAppState({
      provider,
      model,
      apiKey,
      baseURL
    });
    setIsConfigured(true);
  };

  const handleChangeProvider = () => {
    setIsConfigured(false);
    setAppState({
      provider: null,
      model: null,
      apiKey: '',
      baseURL: undefined
    });
  };

  if (!isConfigured) {
    return <ProviderSelection onProviderSelect={handleProviderSelect} />;
  }

  return (
    <MainInterface 
      initialState={appState}
      onChangeProvider={handleChangeProvider}
    />
  );
}

export default App;