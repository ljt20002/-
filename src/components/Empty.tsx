import React from 'react';
import { Empty as AntEmpty, Typography } from 'antd';
import { RobotOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

export const Empty: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full mt-20">
      <AntEmpty
        image={<RobotOutlined style={{ fontSize: 64, color: '#1890ff' }} />}
        description={
          <div className="flex flex-col items-center gap-2">
            <Title level={4} style={{ margin: 0 }}>开始新的对话</Title>
            <Text type="secondary">配置 API Key 后即可开始聊天</Text>
          </div>
        }
      />
    </div>
  );
};
