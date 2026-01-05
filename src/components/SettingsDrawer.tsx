import React from 'react';
import { Drawer } from 'antd';
import { SettingsForm } from './SettingsForm';

interface SettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsDrawer: React.FC<SettingsDrawerProps> = ({ isOpen, onClose }) => {
  return (
    <Drawer
      title="配置设置"
      placement="right"
      onClose={onClose}
      open={isOpen}
      width={400}
      styles={{
        body: {
          padding: 0,
        },
      }}
    >
      <div className="h-full">
        <SettingsForm />
      </div>
    </Drawer>
  );
};
