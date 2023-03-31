import React, { useState } from 'react';
import { Button, Form, Input, InputNumber, Space, Table, Upload, Typography, Popconfirm, Select } from 'antd';
import * as yaml from 'js-yaml';
import { UploadOutlined } from '@ant-design/icons';

interface IItem {
  key: string;
  action: string;
  param: string;
}
interface EditableCellProps extends React.HTMLAttributes<HTMLElement> {
  editing: boolean;
  dataIndex: string;
  title: any;
  inputType: 'number' | 'text';
  record: IItem;
  index: number;
  children: React.ReactNode;
}
const options = [
  { label: 'get', value: 'get' },
  { label: 'click', value: 'click' },
  { label: 'scroll', value: 'scroll' },
  { label: 'use_key', value: 'use_key' },
];
// eslint-disable-next-line react/function-component-definition
const EditableCell: React.FC<EditableCellProps> = ({
  editing,
  dataIndex,
  inputType,
  children,
  ...restProps
}) => {
  const inputNode = inputType === 'number' ? <InputNumber /> : <Input />;

  return (
    // eslint-disable-next-line react/jsx-props-no-spreading
    <td {...restProps}>
      {editing ? (
        <Form.Item name={dataIndex} style={{ margin: 0 }}>
          {inputNode}
        </Form.Item>
      ) : (
        children
      )}
    </td>
  );
};
function Index() {
  const [form] = Form.useForm();
  const [data, setData] = useState<IItem[]>([]);
  const [editingKey, setEditingKey] = useState('');
  let urlFile = '';
  const isEditing = (record: IItem) => record.key === editingKey;
  const getStepsInfo = (testInfo: any) => {
    const { steps } = testInfo;
    return steps.map((step: any) => {
      const { action } = step;
      let param;
      if (action === 'get') {
        param = testInfo.url;
      } else if (action === 'click') {
        param = step.locators[0].value;
      }
      return {
        action,
        param,
      };
    });
  };
  const beforeUpload = (file: any) => {
    const reader = new FileReader();
    reader.onload = (e: any) => {
      try {
        urlFile = e.target;
        const test = yaml.load(e.target.result);
        let counter = 0;
        const testData = getStepsInfo(test).map((item: any) => {
          counter += 1;
          return { ...item, key: counter.toString() };
        });

        setData(testData);
      } catch (err) {
        console.log(err);
      }
    };
    reader.readAsText(file);
    return false;
  };

  const editRow = (record: Partial<IItem> & { key: React.Key }) => {
    form.setFieldsValue({ action: '', param: '', ...record });
    setEditingKey(record.key);
  };

  const deleteRow = (record: Partial<IItem> & { key: React.Key }) => {
    const newData = data.filter((item: any) => item.key !== record.key);
    setData(newData);
  };

  const cancel = () => {
    setEditingKey('');
  };

  const saveRow = async (key: React.Key) => {
    try {
      const row = (await form.validateFields()) as IItem;

      const newData = [...data];
      const index = newData.findIndex((item: any) => key === item.key);
      if (index > -1) {
        const item = newData[index];
        // @ts-ignore
        newData.splice(index, 1, {
          // @ts-ignore
          ...item,
          ...row,
        });
        setData(newData);
        console.log('newData', newData);
        setEditingKey('');
      } else {
        // @ts-ignore
        newData.push(row);
        setData(newData);
        setEditingKey('');
      }
    } catch (errInfo) {
      console.log(errInfo);
    }
  };
  const columns = [
    {
      title: 'Step',
      dataIndex: 'key',
    },
    {
      title: 'Action',
      dataIndex: 'action',
      width: '25%',
      render: (text: any, record: IItem) => {
        const editable = isEditing(record);
        return !editable ? <div>{ text }</div> : <Select className="w-[100px]" options={options} defaultValue={text} />;
      },
      editable: true,
    },
    {
      title: 'Param',
      dataIndex: 'param',
      width: '35%',
      editable: true,
    },

    {
      title: 'Modify',
      dataIndex: 'operation',
      render: (_: any, record: IItem) => {
        const editable = isEditing(record);
        return editable ? (
          <div className="flex gap-8">
            <Typography.Link onClick={() => saveRow(record.key)}>Save</Typography.Link>
            <Popconfirm title="Sure to cancel?" onConfirm={cancel}>
              <Typography.Link>Cancel</Typography.Link>
            </Popconfirm>
          </div>
        ) : (
          <div className="flex gap-8">
            <Typography.Link disabled={editingKey !== ''} onClick={() => editRow(record)}>
              Edit
            </Typography.Link>
            <Typography.Link type="danger" disabled={editingKey !== ''} onClick={() => deleteRow(record)}>
              Delete
            </Typography.Link>
          </div>
        );
      },
    },
  ];
  const mergedColumns = columns.map((col) => {
    if (!col.editable) {
      return col;
    }
    return {
      ...col,
      onCell: (record: IItem) => ({
        record,
        inputType: col.dataIndex === 'action' ? 'param' : 'text',
        dataIndex: col.dataIndex,
        title: col.title,
        editing: isEditing(record),
      }),
    };
  });
  // eslint-disable-next-line global-require
  const fs = require('fs').promises;
  const onSaveDumpData = async () => {
    const saveFile = yaml.dump(data, {});
    await fs.writeFile('./', saveFile, 'utf8');
  };
  function handleAddRow() {
    const nextRow = {
      key: (data.length + 1).toString(),
      action: '',
      param: '',
    };
    // setEditingKey((data.length + 1).toString());
    setData([...data, nextRow]);
  }
  const titleRow = () => (
    <div className="flex gap-4">
      <Button
        type="primary"
        onClick={() => {
          onSaveDumpData();
        }}
      >
        {' '}
        Save{' '}
      </Button>
      <Button type="primary" onClick={handleAddRow}>
        {' '}
        Add Step{' '}
      </Button>
    </div>
  );
  return (
    <Space className="space-header m-5" direction="vertical" style={{ display: 'flex' }}>
      <Upload accept=".yaml" showUploadList={false} beforeUpload={beforeUpload}>
        <Button>
          <UploadOutlined /> Click to Upload
        </Button>
      </Upload>
      <Form form={form} component={false}>
        <Table
          rowKey="index"
          title={titleRow}
          components={{
            body: {
              cell: EditableCell,
            },
          }}
          bordered
          dataSource={data}
          columns={mergedColumns}
          rowClassName="editable-row"
          pagination={{
            onChange: cancel,
            pageSize: 20,
          }}
        />
      </Form>
    </Space>
  );
}

export default Index;
