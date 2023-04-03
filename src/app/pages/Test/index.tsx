import React, { useState } from 'react';
import { Button, Form, Input, InputNumber, Space, Table, Upload, Typography, Popconfirm, Select } from 'antd';
import * as yaml from 'js-yaml';
import { UploadOutlined } from '@ant-design/icons';
import fs from 'fs';

interface IItem {
  key: string;
  action: string;
  param: string;
}
interface EditableCellProps extends React.HTMLAttributes<HTMLElement> {
  editing: boolean;
  dataIndex: string;
  title: any;
  inputType: 'select' | 'text';
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
const EditableCell: React.FC<EditableCellProps> = ({ editing, dataIndex, inputType, children, ...restProps }) => {
  const inputNode =
    inputType === 'select' ? <Select className="select_action w-[100px]" options={options} /> : <Input />;

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

  const beforeUpload = (file: any, actionWithFile: string) => {
    const reader = new FileReader();
    reader.onload = (e: any) => {
      try {
        const fileTarget = e.target.result;
        console.log(fs)
        if (actionWithFile === 'load') {
          const test = yaml.load(fileTarget) as any;
          console.log('1',test)
          let counter = 0;
          const testData = test.steps.map((item: any) => {
            counter += 1;
            return { ...item, key: counter.toString() };

          });
          const newTest = {...test, steps: testData}
          const testSave = yaml.dump(newTest)
          fs.writeFileSync(e.target.path, testSave)
          console.log('2',newTest)
          setData(testData);
        } else if (actionWithFile === 'save') {
          console.log(111)
        }
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
        newData.splice(index, 1, {
          ...item,
          ...row,
        });
        setData(newData);
        setEditingKey('');
      } else {
        newData.push(row);
        setData(newData);
        setEditingKey('');
      }
    } catch (errInfo) {
      console.log(errInfo);
    }
  };
  const average = (a: string, b: string) => (parseFloat(a) + parseFloat(b)) / 2;
  const sortData = (dataSort: IItem[]) => {
    const newDataSort = dataSort.sort((a, b) => parseFloat(a.key) - parseFloat(b.key));
    return newDataSort.map((item, index) => ( {...item, key: (index+1).toString()}));
  }
  function handleAddRow(record: IItem) {
    const nextKey = data.find((element) => element.key > record.key) as any;
    let nextRow: IItem
    if(nextKey){
       nextRow = {
        key: average(record.key, nextKey.key).toString(),
        action: '',
        param: '',
      };
    } else {
       nextRow = {
        key: (parseFloat(record.key) + 1).toString(),
        action: '',
        param: '',
      };
    }


    // setEditingKey((data.length + 1).toString());
    const newDataAddRow = [...data, nextRow];
    setData(sortData(newDataAddRow));
  }
  const columns = [
    {
      title: 'Step',
      dataIndex: 'key',
    },
    {
      title: 'Action',
      dataIndex: 'action',
      width: '25%',
      render: (text: any) => <div> {text}</div>,
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
          <div className="flex gap-8 ml-4">
            <Typography.Link onClick={() => saveRow(record.key)}>Save</Typography.Link>
            <Popconfirm title="Sure to cancel?" onConfirm={cancel}>
              <Typography.Link>Cancel</Typography.Link>
            </Popconfirm>
          </div>
        ) : (
          <div className="flex justify-between mr-4 ml-4">
            <div className=' flex gap-8'>
            <Typography.Link disabled={editingKey !== ''} onClick={() => editRow(record)}>
              Edit
            </Typography.Link>
            <Typography.Link type="danger" disabled={editingKey !== ''} onClick={() => deleteRow(record)}>
              Delete
            </Typography.Link>
            </div>
            <Typography.Link disabled={editingKey !== ''} onClick={() => handleAddRow(record)}>
              Add Step
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
        inputType: col.dataIndex === 'action' ? 'select' : 'text',
        dataIndex: col.dataIndex,
        title: col.title,
        editing: isEditing(record),
      }),
    };
  });

  const titleRow = () => (
    <div className="flex gap-4 ">
      <Button
        type="primary"
        onClick={(file) => {
          beforeUpload(file, 'save');
        }}
      >
        Save
      </Button>
      <Button type="primary">Create New</Button>
    </div>
  );
  return (
    <Space className="space-header m-5" direction="vertical" style={{ display: 'flex' }}>
      <Upload accept=".yaml" showUploadList={false} beforeUpload={(file) => beforeUpload(file, 'load')}>
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
