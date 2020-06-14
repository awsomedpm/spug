/**
 * Copyright (c) OpenSpug Organization. https://github.com/openspug/spug
 * Copyright (c) <spug.dev@gmail.com>
 * Released under the AGPL-3.0 License.
 */
import React from 'react';
import { observer } from 'mobx-react';
import { Table, Divider, Modal, Tag, Dropdown, Icon, Menu, message } from 'antd';
import ComForm from './Form';
import http from 'libs/http';
import store from './store';
import { LinkButton } from "components";
import Info from './Info';
import Record from './Record';

@observer
class ComTable extends React.Component {
  componentDidMount() {
    store.fetchRecords()
  }

  colors = ['green', 'orange', 'red'];

  moreMenus = (info) => (
    <Menu>
      <Menu.Item>
        <LinkButton onClick={() => this.handleTest(info)}>执行测试</LinkButton>
      </Menu.Item>
      <Menu.Item>
        <LinkButton auth="schedule.schedule.edit" onClick={() => this.handleActive(info)}>{info.is_active ? '禁用任务' : '激活任务'}</LinkButton>
      </Menu.Item>
      <Menu.Item>
        <LinkButton onClick={() => store.showRecord(info)}>历史记录</LinkButton>
      </Menu.Item>
      <Menu.Divider/>
      <Menu.Item>
        <LinkButton auth="schedule.schedule.del" onClick={() => this.handleDelete(info)}>删除</LinkButton>
      </Menu.Item>
    </Menu>
  );

  columns = [{
    title: '序号',
    key: 'series',
    render: (_, __, index) => index + 1,
    width: 80,
  }, {
    title: '任务名称',
    dataIndex: 'name',
  }, {
    title: '任务类型',
    dataIndex: 'type',
  }, {
    title: '最新状态',
    render: info => {
      if (info.is_active) {
        if (info['latest_status_alias']) {
          return <Tag color={this.colors[info['latest_status']]}>{info['latest_status_alias']}</Tag>
        } else {
          return <Tag color="blue">待调度</Tag>
        }
      } else {
        return <Tag>未激活</Tag>
      }
    },
  }, {
    title: '更新于',
    dataIndex: 'latest_run_time_alias',
    sorter: (a, b) => a.latest_run_time.localeCompare(b.latest_run_time)
  }, {
    title: '描述信息',
    dataIndex: 'desc',
    ellipsis: true
  }, {
    title: '操作',
    width: 180,
    render: info => (
      <span>
        <LinkButton disabled={!info['latest_run_time']} onClick={() => store.showInfo(info)}>详情</LinkButton>
        <Divider type="vertical"/>
        <LinkButton auth="schedule.schedule.edit" onClick={() => store.showForm(info)}>编辑</LinkButton>
        <Divider type="vertical"/>
        <Dropdown overlay={() => this.moreMenus(info)} trigger={['click']}>
          <LinkButton>
            更多 <Icon type="down"/>
          </LinkButton>
        </Dropdown>
      </span>
    )
  }];

  handleActive = (text) => {
    Modal.confirm({
      title: '删除确认',
      content: `确定要${text.is_active ? '禁用' : '激活'}任务【${text['name']}】?`,
      onOk: () => {
        return http.patch('/api/schedule/', {id: text.id, is_active: !text.is_active})
          .then(() => {
            message.success('操作成功');
            store.fetchRecords()
          })
      }
    })
  };

  handleDelete = (text) => {
    Modal.confirm({
      title: '删除确认',
      content: `确定要删除【${text['name']}】?`,
      onOk: () => {
        return http.delete('/api/schedule/', {params: {id: text.id}})
          .then(() => {
            message.success('删除成功');
            store.fetchRecords()
          })
      }
    })
  };

  handleTest = (text) => {
    Modal.confirm({
      title: '操作确认',
      content: '立即执行该任务（不影响调度规则）？',
      onOk: () => http.post(`/api/schedule/${text.id}/`)
        .then(res => store.showInfo(text, res))
    })
  };

  render() {
    let data = store.records;
    if (store.f_status !== undefined) {
      if (store.f_status === -3) {
        data = data.filter(item => !item['is_active'])
      } else if (store.f_status === -2) {
        data = data.filter(item => item['is_active'])
      } else if (store.f_status === -1) {
        data = data.filter(item => item['is_active'] && !item['latest_status_alias'])
      } else {
        data = data.filter(item => item['latest_status'] === store.f_status)
      }
    }
    if (store.f_status === 0) data = data.filter(item => item['is_active']);
    if (store.f_name) {
      data = data.filter(item => item['name'].toLowerCase().includes(store.f_name.toLowerCase()))
    }
    if (store.f_type) {
      data = data.filter(item => item['type'].toLowerCase().includes(store.f_type.toLowerCase()))
    }
    return (
      <React.Fragment>
        <Table
          rowKey="id"
          loading={store.isFetching}
          dataSource={data}
          pagination={{
            showSizeChanger: true,
            showLessItems: true,
            hideOnSinglePage: true,
            pageSizeOptions: ['10', '20', '50', '100']
          }}
          columns={this.columns}/>
        {store.formVisible && <ComForm/>}
        {store.infoVisible && <Info/>}
        {store.recordVisible && <Record/>}
      </React.Fragment>
    )
  }
}

export default ComTable
