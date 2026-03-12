import React, { useState } from 'react';
import { 
  Card, 
  Form, 
  DatePicker, 
  Button, 
  Table, 
  Space, 
  Typography, 
  message, 
  Spin,
  Modal,
  Input,
  Alert,
  Tag,
  theme
} from 'antd';
import {
  SearchOutlined,
  ClearOutlined,
  DownloadOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  LineChartOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { Title, Paragraph } = Typography;
const { RangePicker } = DatePicker;

const LttdMetrics = () => {
  const [form] = Form.useForm();
  const { token } = theme.useToken();
  
  const [loading, setLoading] = useState(false);
  const [currentRecords, setCurrentRecords] = useState([]);
  const [noLttdRecords, setNoLttdRecords] = useState([]);
  const [groupedNoLttd, setGroupedNoLttd] = useState([]);
  const [showingNoLttd, setShowingNoLttd] = useState(false);
  const [totalBeforeFilter, setTotalBeforeFilter] = useState(0);

  // Set default dates to current month
  const currentMonth = dayjs();

  const fetchLTTDRecords = async (values) => {
    setLoading(true);
    
    const fromDate = values.dateRange[0].format('YYYY-MM');
    const toDate = values.dateRange[1].format('YYYY-MM');
    const teambookId = '449';
    const level = '2';

    try {
      const response = await fetch('/api/lttd/records', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from_date: fromDate,
          to_date: toDate,
          teambook_id: teambookId,
          level: parseInt(level)
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch LTTD records');
      }

      const data = await response.json();

      if (data.status === 'success' && data.records) {
        setCurrentRecords(data.records);
        setNoLttdRecords(data.no_lttd_records || []);
        setGroupedNoLttd(data.grouped_no_lttd || []);
        setTotalBeforeFilter(data.total_before_filter || 0);
        setShowingNoLttd(false);
        message.success(`Fetched ${data.records.length} LTTD records successfully`);
      } else {
        throw new Error(data.error || 'No records found');
      }
    } catch (error) {
      console.error('Error fetching LTTD records:', error);
      message.error(error.message || 'Failed to fetch LTTD records');
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    const records = showingNoLttd ? noLttdRecords : currentRecords;
    
    if (!records || records.length === 0) {
      message.warning('No data to export');
      return;
    }

    const headers = [
      'Month-Year',
      'Change Reference',
      'Start Date',
      'Application Name',
      'Applicant Group',
      'Assign Group',
      'Report Group',
      'DTT (L7 Pod)',
      'Requested By',
      'LTTD Days',
      'CR Processing Hurdle',
      'ICE CR Link',
      'CR First Commit URL',
      'Repo Link'
    ];

    let csvContent = headers.join(',') + '\n';

    records.forEach(record => {
      const monthYear = record.month && record.year ? `${record.month}-${record.year}` : '';
      const appName = record.business_service || '';

      const row = [
        monthYear,
        record.id || record.cr_id || '',
        record.start_date || '',
        appName,
        record.requested_by || '',
        record.assignment_group || '',
        record.l3_business_unit || '',
        record.l4_business_unit || '',
        record.requested_by || '',
        record.lead_time_to_deploy_numeric_days || '',
        record.cr_processing_hurdle || '',
        record.ice_cr_link || '',
        record.cr_first_commit_url || '',
        record.repo_link || ''
      ];

      csvContent += row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',') + '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    const timestamp = new Date().toISOString().slice(0, 10);
    link.setAttribute('href', url);
    link.setAttribute('download', `lttd_records_${timestamp}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    message.success('CSV exported successfully');
  };

  const toggleNoLttdRecords = () => {
    setShowingNoLttd(!showingNoLttd);
  };

  const columns = [
    {
      title: 'Month-Year',
      dataIndex: 'monthYear',
      key: 'monthYear',
      render: (_, record) => record.month && record.year ? `${record.month}-${record.year}` : '',
      width: 120,
    },
    {
      title: 'Change Reference',
      dataIndex: 'id',
      key: 'id',
      render: (text, record) => text || record.cr_id || '',
      width: 150,
    },
    {
      title: 'Start Date',
      dataIndex: 'start_date',
      key: 'start_date',
      render: (text) => text ? dayjs(text).format('DD MMM YYYY') : '',
      width: 120,
    },
    {
      title: 'Application Name',
      dataIndex: 'business_service',
      key: 'business_service',
      width: 200,
    },
    {
      title: 'Applicant Group',
      dataIndex: 'requested_by',
      key: 'applicant_group',
      width: 150,
    },
    {
      title: 'Assign Group',
      dataIndex: 'assignment_group',
      key: 'assignment_group',
      width: 150,
    },
    {
      title: 'Report Group',
      dataIndex: 'l3_business_unit',
      key: 'l3_business_unit',
      width: 150,
    },
    {
      title: 'DTT (L7 Pod)',
      dataIndex: 'l4_business_unit',
      key: 'l4_business_unit',
      width: 150,
    },
    {
      title: 'Requested By',
      dataIndex: 'requested_by',
      key: 'requested_by',
      width: 150,
    },
    {
      title: 'LTTD Days',
      dataIndex: 'lead_time_to_deploy_numeric_days',
      key: 'lttd_days',
      render: (days) => {
        if (days === null || days === undefined) return <Tag color="red">N/A</Tag>;
        const numDays = parseFloat(days);
        const color = numDays > 15 ? 'red' : numDays > 10 ? 'orange' : 'green';
        return <Tag color={color}><strong>{numDays.toFixed(1)} days</strong></Tag>;
      },
      width: 120,
    },
    {
      title: 'CR Processing Hurdle',
      dataIndex: 'cr_processing_hurdle',
      key: 'cr_processing_hurdle',
      width: 180,
    },
    {
      title: 'ICE CR Link',
      dataIndex: 'ice_cr_link',
      key: 'ice_cr_link',
      render: (url) => url ? <a href={url} target="_blank" rel="noopener noreferrer">ICE CR</a> : '',
      width: 100,
    },
    {
      title: 'CR First Commit URL',
      dataIndex: 'cr_first_commit_url',
      key: 'cr_first_commit_url',
      render: (url) => url ? <a href={url} target="_blank" rel="noopener noreferrer">Commit</a> : '',
      width: 120,
    },
    {
      title: 'Repo Link',
      dataIndex: 'repo_link',
      key: 'repo_link',
      render: (url) => url ? <a href={url} target="_blank" rel="noopener noreferrer">Repo</a> : '',
      width: 100,
    },
  ];

  const displayRecords = showingNoLttd ? noLttdRecords : currentRecords;
  const hasRecords = currentRecords.length > 0 || noLttdRecords.length > 0;

  return (
    <div style={{ paddingRight: 5, height: '100%', overflow: 'hidden auto' }}>
      <div style={{ background: token.colorBgContainer, padding: '16px 10px' }}>
        <Title level={3} style={{ margin: 0 }}>
          <LineChartOutlined /> LTTD Metrics Dashboard
        </Title>
        <Paragraph type="secondary" style={{ margin: '8px 0 0 0' }}>
          Lead Time to Deploy - DataSight Analytics
        </Paragraph>
      </div>

      <div style={{ padding: '10px' }}>
        <Card title="Fetch LTTD Records" style={{ marginBottom: 16 }}>
          <Form
            form={form}
            layout="vertical"
            onFinish={fetchLTTDRecords}
            initialValues={{
              dateRange: [currentMonth, currentMonth]
            }}
          >
            <Form.Item
              label="Date Range (Month)"
              name="dateRange"
              rules={[{ required: true, message: 'Please select date range' }]}
            >
              <RangePicker 
                picker="month" 
                style={{ width: '100%' }}
                format="YYYY-MM"
              />
            </Form.Item>

            <Form.Item>
              <Space>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  icon={<SearchOutlined />}
                  loading={loading}
                >
                  Fetch LTTD Records
                </Button>
                <Button 
                  icon={<ClearOutlined />}
                  onClick={() => {
                    form.resetFields();
                    setCurrentRecords([]);
                    setNoLttdRecords([]);
                    setShowingNoLttd(false);
                  }}
                >
                  Clear Form
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Card>

        {hasRecords && (
          <Card 
            title={`LTTD Records (${displayRecords.length} record${displayRecords.length !== 1 ? 's' : ''})`}
            extra={
              <Space>
                {noLttdRecords.length > 0 && (
                  <Button
                    icon={showingNoLttd ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                    onClick={toggleNoLttdRecords}
                  >
                    {showingNoLttd ? 'Hide' : 'Show'} No LTTD ({noLttdRecords.length})
                  </Button>
                )}
                <Button 
                  icon={<DownloadOutlined />}
                  onClick={exportToCSV}
                >
                  Export CSV
                </Button>
              </Space>
            }
          >
            {totalBeforeFilter > 0 && !showingNoLttd && (
              <Alert
                message={`Showing ${displayRecords.length} filtered records from ${totalBeforeFilter} total`}
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
              />
            )}
            
            <Table
              columns={columns}
              dataSource={displayRecords}
              rowKey={(record) => record.id || record.cr_id}
              scroll={{ x: 2000 }}
              pagination={{ 
                pageSize: 50,
                showSizeChanger: true,
                showTotal: (total) => `Total ${total} records`
              }}
              loading={loading}
            />
          </Card>
        )}
      </div>

    </div>
  );
};

export default LttdMetrics;
