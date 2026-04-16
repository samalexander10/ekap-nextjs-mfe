import React from 'react';
import { NameChangeForm } from './components/NameChangeForm';
import './index.css';

interface Props { onComplete: (requestId: string) => void; }

const NameChangeApp: React.FC<Props> = ({ onComplete }) => (
  <div>
    <h3 style={{ marginTop: 0, color: '#1e3a5f' }}>Legal Name Change Request</h3>
    <NameChangeForm onComplete={onComplete} />
  </div>
);

export default NameChangeApp;
