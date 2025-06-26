import React, { useState } from 'react';
import { Settings, Server, Key, TestTube, CheckCircle, XCircle } from 'lucide-react';
import { LLMProvider } from '../../types';

interface SettingsTabProps {
  currentProvider: LLMProvider;
  onProviderChange: (provider: LLMProvider) => void;
}

const SettingsTab: React.FC<SettingsTabProps> = ({ currentProvider, onProviderChange }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editProvider, setEditProvider] = useState<LLMProvider>(currentProvider);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);
  const [testMessage, setTestMessage] = useState('');

  const presetProviders = [
    {
      name: 'Local LLM',
      baseUrl: 'http://localhost:8091/v1',
      model: 'gpt-3.5-turbo',
    },
    {
      name: 'OpenAI',
      baseUrl: 'https://api.openai.com/v1',
      model: 'gpt-3.5-turbo',
    },
    {
      name: 'Custom',
      baseUrl: '',
      model: 'gpt-3.5-turbo',
    },
  ];

  const handleSave = () => {
    onProviderChange(editProvider);
    setIsEditing(false);
    setTestResult(null);
  };

  const handleCancel = () => {
    setEditProvider(currentProvider);
    setIsEditing(false);
    setTestResult(null);
  };

  const handlePresetSelect = (preset: typeof presetProviders[0]) => {
    setEditProvider({
      ...editProvider,
      name: preset.name,
      baseUrl: preset.baseUrl,
      model: preset.model,
    });
  };

  const testConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    setTestMessage('');

    try {
      const response = await fetch(`${editProvider.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(editProvider.apiKey && { 'Authorization': `Bearer ${editProvider.apiKey}` }),
        },
        body: JSON.stringify({
          model: editProvider.model || 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: 'Hello, this is a test message.' }],
          max_tokens: 10,
          temperature: 0.1,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.choices && data.choices[0]) {
          setTestResult('success');
          setTestMessage('Connection successful! LLM is responding properly.');
        } else {
          setTestResult('error');
          setTestMessage('Connection established but response format is unexpected.');
        }
      } else {
        setTestResult('error');
        setTestMessage(`Connection failed: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      setTestResult('error');
      setTestMessage(
        error instanceof Error 
          ? `Connection failed: ${error.message}` 
          : 'Connection failed: Unknown error'
      );
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="flex-1 p-6 max-w-2xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-black mb-2">Settings</h2>
        <p className="text-gray-600">Configure your AI language model provider and other preferences.</p>
      </div>

      {/* LLM Provider Settings */}
      <div className="card mb-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Server size={20} className="text-gray-600" />
            <h3 className="text-lg font-semibold text-black">LLM Provider</h3>
          </div>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="btn-secondary text-sm"
            >
              Edit
            </button>
          )}
        </div>

        {isEditing ? (
          <div className="space-y-4">
            {/* Preset Selection */}
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Quick Setup
              </label>
              <div className="grid grid-cols-3 gap-2">
                {presetProviders.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => handlePresetSelect(preset)}
                    className={`p-3 text-sm border rounded-lg transition-colors ${
                      editProvider.name === preset.name
                        ? 'border-black bg-gray-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Provider Name */}
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Provider Name
              </label>
              <input
                type="text"
                value={editProvider.name}
                onChange={(e) => setEditProvider({ ...editProvider, name: e.target.value })}
                className="input-field"
                placeholder="e.g., Local LLM, OpenAI"
              />
            </div>

            {/* Base URL */}
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Base URL
              </label>
              <input
                type="url"
                value={editProvider.baseUrl}
                onChange={(e) => setEditProvider({ ...editProvider, baseUrl: e.target.value })}
                className="input-field"
                placeholder="http://localhost:8091/v1"
              />
            </div>

            {/* Model */}
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Model
              </label>
              <input
                type="text"
                value={editProvider.model || ''}
                onChange={(e) => setEditProvider({ ...editProvider, model: e.target.value })}
                className="input-field"
                placeholder="gpt-3.5-turbo"
              />
            </div>

            {/* API Key */}
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                API Key (optional)
              </label>
              <div className="relative">
                <Key size={16} className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="password"
                  value={editProvider.apiKey || ''}
                  onChange={(e) => setEditProvider({ ...editProvider, apiKey: e.target.value })}
                  className="input-field pl-10"
                  placeholder="sk-..."
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Leave empty if your local LLM doesn't require authentication
              </p>
            </div>

            {/* Test Connection */}
            <div>
              <button
                onClick={testConnection}
                disabled={isTesting || !editProvider.baseUrl}
                className="btn-secondary flex items-center gap-2 mb-3 disabled:opacity-50"
              >
                {isTesting ? (
                  <>
                    <TestTube size={16} className="animate-pulse" />
                    Testing...
                  </>
                ) : (
                  <>
                    <TestTube size={16} />
                    Test Connection
                  </>
                )}
              </button>

              {testResult && (
                <div className={`p-3 rounded-lg flex items-start gap-2 ${
                  testResult === 'success' 
                    ? 'bg-green-50 border border-green-200'
                    : 'bg-red-50 border border-red-200'
                }`}>
                  {testResult === 'success' ? (
                    <CheckCircle size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                  ) : (
                    <XCircle size={16} className="text-red-600 mt-0.5 flex-shrink-0" />
                  )}
                  <div>
                    <p className={`text-sm font-medium ${
                      testResult === 'success' ? 'text-green-800' : 'text-red-800'
                    }`}>
                      {testResult === 'success' ? 'Connection Successful' : 'Connection Failed'}
                    </p>
                    <p className={`text-xs mt-1 ${
                      testResult === 'success' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {testMessage}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <button
                onClick={handleSave}
                disabled={!editProvider.baseUrl || !editProvider.name}
                className="btn-primary disabled:opacity-50"
              >
                Save Changes
              </button>
              <button
                onClick={handleCancel}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Provider:</span>
              <span className="text-sm text-black">{currentProvider.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Base URL:</span>
              <span className="text-sm text-black font-mono">{currentProvider.baseUrl}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Model:</span>
              <span className="text-sm text-black">{currentProvider.model || 'Default'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">API Key:</span>
              <span className="text-sm text-gray-400">
                {currentProvider.apiKey ? '••••••••' : 'Not set'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* App Info */}
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <Settings size={20} className="text-gray-600" />
          <h3 className="text-lg font-semibold text-black">About</h3>
        </div>
        <div className="space-y-2 text-sm text-gray-600">
          <p><strong>ListOnTheGo</strong> - AI-powered productivity app</p>
          <p>Version: 1.0.0</p>
          <p>Built with React, TypeScript, and Tauri</p>
          <p className="text-xs text-gray-500 mt-4">
            This app extracts actionable items from your text using AI and helps you organize
            notes with intelligent summaries and action points.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SettingsTab; 