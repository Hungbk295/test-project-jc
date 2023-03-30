import React, { useState } from 'react';
import {Button, Form, Input, InputNumber, Space, Table, Upload, Typography, Popconfirm, Select} from 'antd';
import * as yaml from 'js-yaml';
import { UploadOutlined } from '@ant-design/icons';
import { ColumnsType } from 'antd/es/table';

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
    ];
// eslint-disable-next-line react/function-component-definition
const EditableCell: React.FC<EditableCellProps> = ({
  editing,
  dataIndex,
  title,
  inputType,
  record,
  index,
  children,
  ...restProps
}) => {
  const inputNode = inputType === 'number' ? <InputNumber /> : <Input />;

  return (
    // eslint-disable-next-line react/jsx-props-no-spreading
    <td {...restProps}>
      {editing ? (
        <Form.Item
          name={dataIndex}
          style={{ margin: 0 }}

        >
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
  const [data, setData] = useState([]);
  const [editingKey, setEditingKey] = useState('');

  const isEditing = (record: IItem) => record.key === editingKey;

  const edit = (record: Partial<IItem> & { key: React.Key }) => {
    form.setFieldsValue({ action: '', param: '', ...record });
    setEditingKey(record.key);
  };

  const cancel = () => {
    setEditingKey('');
  };
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
        const test = yaml.load(e.target.result);
        let counter = 0;
        const testData = getStepsInfo(test).map((item: any) => {
          counter += 1;
          return { ...item, key: counter };
        });

        setData(testData);
        console.log(testData);
      } catch (err) {
        console.log(err);
      }
    };
    reader.readAsText(file);
    return false;
  };

  const save = async (key: React.Key) => {
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
        setEditingKey('');
      } else {
        // @ts-ignore
        newData.push(row);
        setData(newData);
        setEditingKey('');
      }
    } catch (errInfo) {
      console.log('Validate Failed:', errInfo);
    }
  };
  const columns = [
    {
      title: 'Action',
      dataIndex: 'action',
      width: '25%',
      render: (text: any) => <Select options={options} value={text} >{text}</Select>,
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
          <span>
            <Typography.Link onClick={() => save(record.key)} style={{ marginRight: 8 }}>
              Save
            </Typography.Link>
            <Popconfirm title="Sure to cancel?" onConfirm={cancel}>
              <p>Cancel</p>
            </Popconfirm>
          </span>
        ) : (
          <Typography.Link disabled={editingKey !== ''} onClick={() => edit(record)}>
            Edit
          </Typography.Link>
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

  const titleRow = () => (
    <div className='flex gap-8'>
      <Button type='primary' onClick={()=> yaml.dump(data,)}> Save </Button>
      <Button type = 'primary'> Add Step </Button>
    </div>
)
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
          }}
        />
      </Form>
    </Space>
  );
}

export default Index;
