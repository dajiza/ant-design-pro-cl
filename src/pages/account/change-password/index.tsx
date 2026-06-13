import { LockOutlined } from '@ant-design/icons';
import {
  PageContainer,
  ProForm,
  ProFormText,
} from '@ant-design/pro-components';
import { history, useIntl, useModel } from '@umijs/max';
import { App, Card } from 'antd';
import { flushSync } from 'react-dom';
import { clearTokens } from '@/requestErrorConfig';
import { changePassword } from '@/services/ant-design-pro/api';

const ChangePassword: React.FC = () => {
  const intl = useIntl();
  const { message } = App.useApp();
  const { setInitialState } = useModel('@@initialState');

  const handleSubmit = async (values: {
    currentPassword: string;
    newPassword: string;
  }) => {
    try {
      await changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      message.success(
        intl.formatMessage({
          id: 'pages.changePassword.success',
          defaultMessage: '密码修改成功，请重新登录',
        }),
      );
      // 清除登录状态，跳转到登录页
      clearTokens();
      flushSync(() => {
        setInitialState((s) => ({ ...s, currentUser: undefined }));
      });
      const { pathname, search } = window.location;
      history.push(
        `/user/login?redirect=${encodeURIComponent(pathname + search)}`,
      );
    } catch (error: any) {
      const errorMsg =
        error?.response?.data?.message ||
        error?.info?.errorMessage ||
        intl.formatMessage({
          id: 'pages.changePassword.failure',
          defaultMessage: '密码修改失败，请重试',
        });
      message.error(errorMsg);
    }
  };

  return (
    <PageContainer>
      <Card style={{ maxWidth: 480 }}>
        <ProForm
          onFinish={handleSubmit}
          submitter={{
            searchConfig: {
              submitText: intl.formatMessage({
                id: 'pages.changePassword.submit',
                defaultMessage: '修改密码',
              }),
            },
          }}
        >
          <ProFormText.Password
            name="currentPassword"
            fieldProps={{
              size: 'large',
              prefix: <LockOutlined />,
            }}
            label={intl.formatMessage({
              id: 'pages.changePassword.currentPassword',
              defaultMessage: '当前密码',
            })}
            placeholder={intl.formatMessage({
              id: 'pages.changePassword.currentPassword.placeholder',
              defaultMessage: '请输入当前密码',
            })}
            rules={[
              {
                required: true,
                message: intl.formatMessage({
                  id: 'pages.changePassword.currentPassword.required',
                  defaultMessage: '请输入当前密码',
                }),
              },
              {
                min: 6,
                message: intl.formatMessage({
                  id: 'pages.login.password.minLength',
                  defaultMessage: '密码至少6位',
                }),
              },
            ]}
          />
          <ProFormText.Password
            name="newPassword"
            fieldProps={{
              size: 'large',
              prefix: <LockOutlined />,
            }}
            label={intl.formatMessage({
              id: 'pages.changePassword.newPassword',
              defaultMessage: '新密码',
            })}
            placeholder={intl.formatMessage({
              id: 'pages.changePassword.newPassword.placeholder',
              defaultMessage: '请输入新密码（至少6位）',
            })}
            rules={[
              {
                required: true,
                message: intl.formatMessage({
                  id: 'pages.changePassword.newPassword.required',
                  defaultMessage: '请输入新密码',
                }),
              },
              {
                min: 6,
                message: intl.formatMessage({
                  id: 'pages.login.password.minLength',
                  defaultMessage: '密码至少6位',
                }),
              },
            ]}
          />
          <ProFormText.Password
            name="confirmPassword"
            fieldProps={{
              size: 'large',
              prefix: <LockOutlined />,
            }}
            label={intl.formatMessage({
              id: 'pages.changePassword.confirmPassword',
              defaultMessage: '确认新密码',
            })}
            placeholder={intl.formatMessage({
              id: 'pages.changePassword.confirmPassword.placeholder',
              defaultMessage: '请再次输入新密码',
            })}
            rules={[
              {
                required: true,
                message: intl.formatMessage({
                  id: 'pages.changePassword.confirmPassword.required',
                  defaultMessage: '请确认新密码',
                }),
              },
              {
                min: 6,
                message: intl.formatMessage({
                  id: 'pages.login.password.minLength',
                  defaultMessage: '密码至少6位',
                }),
              },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(
                    new Error(
                      intl.formatMessage({
                        id: 'pages.changePassword.confirmPassword.mismatch',
                        defaultMessage: '两次输入的密码不一致',
                      }),
                    ),
                  );
                },
              }),
            ]}
          />
        </ProForm>
      </Card>
    </PageContainer>
  );
};

export default ChangePassword;
