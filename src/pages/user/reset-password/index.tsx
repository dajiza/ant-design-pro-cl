import { LockOutlined, MailOutlined, SafetyOutlined } from '@ant-design/icons';
import { LoginForm, ProFormText } from '@ant-design/pro-components';
import { Helmet, history, useIntl, useModel } from '@umijs/max';
import { Alert, App, Button, Space } from 'antd';
import { createStyles } from 'antd-style';
import React, { useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { Footer } from '@/components';
import { setToken } from '@/requestErrorConfig';
import { resetPasswordWithCode, sendCode } from '@/services/ant-design-pro/api';

const useStyles = createStyles(({ token }) => ({
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    overflow: 'auto',
    backgroundImage:
      "url('https://mdn.alipayobjects.com/yuyan_qk0oxh/afts/img/V-_oS6r-i7wAAAAAAAAAAAAAFl94AQBr')",
    backgroundSize: '100% 100%',
  },
  countdownBtn: {
    minWidth: 120,
    height: 40,
  },
}));

const ResetPassword: React.FC = () => {
  const [error, setError] = useState<string>('');
  const [step, setStep] = useState<'email' | 'reset'>('email');
  const [email, setEmail] = useState('');
  const [verificationCodeId, setVerificationCodeId] = useState('');
  const [countdown, setCountdown] = useState(0);
  const { initialState, setInitialState } = useModel('@@initialState');
  const { styles } = useStyles();
  const { message } = App.useApp();
  const intl = useIntl();
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startCountdown = () => {
    setCountdown(60);
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const fetchUserInfo = async () => {
    const userInfo = await initialState?.fetchUserInfo?.();
    if (userInfo) {
      flushSync(() => {
        setInitialState((s) => ({
          ...s,
          currentUser: userInfo,
        }));
      });
    }
  };

  const handleSendCode = async (values: { email: string }) => {
    try {
      setError('');
      setEmail(values.email);
      const response = await sendCode({
        mail: values.email,
        actionType: 'RESET_PASSWORD',
      });
      setVerificationCodeId(response.verificationCodeId);
      setStep('reset');
      startCountdown();
      message.success(
        intl.formatMessage({
          id: 'pages.login.codeSent',
          defaultMessage: '验证码已发送',
        }),
      );
    } catch (error: any) {
      const errorMsg =
        error?.response?.data?.message ||
        error?.info?.errorMessage ||
        intl.formatMessage({
          id: 'pages.login.sendCodeFailure',
          defaultMessage: '发送验证码失败，请重试',
        });
      setError(errorMsg);
    }
  };

  const handleResetPassword = async (values: {
    code: string;
    newPassword: string;
  }) => {
    try {
      setError('');
      const response = await resetPasswordWithCode({
        verificationCodeId,
        code: values.code,
        newPassword: values.newPassword,
      });
      if (response.token) {
        setToken(response.token);
        message.success(
          intl.formatMessage({
            id: 'pages.resetPassword.success',
            defaultMessage: '密码重置成功，已自动登录',
          }),
        );
        await fetchUserInfo();
        const urlParams = new URL(window.location.href).searchParams;
        window.location.href = urlParams.get('redirect') || '/';
      }
    } catch (error: any) {
      const errorMsg =
        error?.response?.data?.message ||
        error?.info?.errorMessage ||
        intl.formatMessage({
          id: 'pages.resetPassword.failure',
          defaultMessage: '重置密码失败，请重试',
        });
      setError(errorMsg);
    }
  };

  const handleResend = async () => {
    try {
      setError('');
      const response = await sendCode({
        mail: email,
        actionType: 'RESET_PASSWORD',
      });
      setVerificationCodeId(response.verificationCodeId);
      startCountdown();
      message.success(
        intl.formatMessage({
          id: 'pages.login.codeSent',
          defaultMessage: '验证码已发送',
        }),
      );
    } catch (error: any) {
      const errorMsg =
        error?.response?.data?.message ||
        error?.info?.errorMessage ||
        intl.formatMessage({
          id: 'pages.login.sendCodeFailure',
          defaultMessage: '发送验证码失败，请重试',
        });
      setError(errorMsg);
    }
  };

  const backToLogin = () => {
    const urlParams = new URL(window.location.href).searchParams;
    const redirect = urlParams.get('redirect');
    const search = redirect ? `?redirect=${encodeURIComponent(redirect)}` : '';
    history.push(`/user/login${search}`);
  };

  return (
    <div className={styles.container}>
      <Helmet />
      <div style={{ flex: '1', padding: '32px 0' }}>
        {step === 'email' ? (
          <LoginForm
            contentStyle={{ minWidth: 280, maxWidth: '75vw' }}
            logo={<img alt="logo" src="/logo.svg" />}
            title="Ant Design"
            subTitle={intl.formatMessage({
              id: 'pages.resetPassword.title',
              defaultMessage: '重置密码',
            })}
            submitter={{
              searchConfig: {
                submitText: intl.formatMessage({
                  id: 'pages.login.sendCode',
                  defaultMessage: '发送验证码',
                }),
              },
            }}
            onFinish={async (values) => {
              await handleSendCode(values as { email: string });
            }}
          >
            {error && (
              <Alert
                style={{ marginBottom: 24 }}
                message={error}
                type="error"
                showIcon
              />
            )}
            <ProFormText
              name="email"
              fieldProps={{
                size: 'large',
                prefix: <MailOutlined />,
              }}
              placeholder={intl.formatMessage({
                id: 'pages.login.email.placeholder',
                defaultMessage: '邮箱',
              })}
              rules={[
                {
                  required: true,
                  message: intl.formatMessage({
                    id: 'pages.login.email.required',
                    defaultMessage: '请输入邮箱！',
                  }),
                },
                {
                  type: 'email',
                  message: intl.formatMessage({
                    id: 'pages.login.email.invalid',
                    defaultMessage: '邮箱格式不正确！',
                  }),
                },
              ]}
            />
          </LoginForm>
        ) : (
          <LoginForm
            contentStyle={{ minWidth: 280, maxWidth: '75vw' }}
            logo={<img alt="logo" src="/logo.svg" />}
            title="Ant Design"
            subTitle={intl.formatMessage({
              id: 'pages.resetPassword.title',
              defaultMessage: '重置密码',
            })}
            submitter={{
              searchConfig: {
                submitText: intl.formatMessage({
                  id: 'pages.resetPassword.submit',
                  defaultMessage: '重置密码',
                }),
              },
            }}
            onFinish={async (values) => {
              await handleResetPassword(
                values as { code: string; newPassword: string },
              );
            }}
          >
            {error && (
              <Alert
                style={{ marginBottom: 24 }}
                message={error}
                type="error"
                showIcon
              />
            )}
            <div
              style={{ marginBottom: 16, color: '#666', textAlign: 'center' }}
            >
              {intl.formatMessage(
                {
                  id: 'pages.login.codeSentTo',
                  defaultMessage: '验证码已发送至 {email}',
                },
                { email },
              )}
            </div>
            <ProFormText
              name="code"
              fieldProps={{
                size: 'large',
                prefix: <SafetyOutlined />,
                maxLength: 6,
              }}
              placeholder={intl.formatMessage({
                id: 'pages.login.code.placeholder',
                defaultMessage: '6位数字验证码',
              })}
              rules={[
                {
                  required: true,
                  message: intl.formatMessage({
                    id: 'pages.login.code.required',
                    defaultMessage: '请输入验证码！',
                  }),
                },
                {
                  pattern: /^\d{6}$/,
                  message: intl.formatMessage({
                    id: 'pages.login.code.invalid',
                    defaultMessage: '请输入6位数字验证码',
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
              placeholder={intl.formatMessage({
                id: 'pages.resetPassword.newPassword.placeholder',
                defaultMessage: '新密码（至少6位）',
              })}
              rules={[
                {
                  required: true,
                  message: intl.formatMessage({
                    id: 'pages.resetPassword.newPassword.required',
                    defaultMessage: '请输入新密码！',
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
            <div style={{ marginBottom: 24, textAlign: 'center' }}>
              <Space>
                <Button type="link" onClick={backToLogin}>
                  {intl.formatMessage({
                    id: 'pages.resetPassword.backToLogin',
                    defaultMessage: '返回登录',
                  })}
                </Button>
                <Button
                  type="link"
                  className={styles.countdownBtn}
                  disabled={countdown > 0}
                  onClick={handleResend}
                >
                  {countdown > 0
                    ? `${countdown}s`
                    : intl.formatMessage({
                        id: 'pages.login.resendCode',
                        defaultMessage: '重新发送',
                      })}
                </Button>
              </Space>
            </div>
          </LoginForm>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default ResetPassword;
