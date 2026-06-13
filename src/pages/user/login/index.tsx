import { LockOutlined, MailOutlined, SafetyOutlined } from '@ant-design/icons';
import { LoginForm, ProFormText } from '@ant-design/pro-components';
import { Helmet, history, SelectLang, useIntl, useModel } from '@umijs/max';
import { Alert, App, Button, Space, Tabs } from 'antd';
import { createStyles } from 'antd-style';
import React, { useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { Footer } from '@/components';
import { setToken } from '@/requestErrorConfig';
import {
  loginWithPassword,
  sendCode,
  verifyCode,
} from '@/services/ant-design-pro/api';

const useStyles = createStyles(({ token }) => {
  return {
    action: {
      marginLeft: '8px',
      color: 'rgba(0, 0, 0, 0.2)',
      fontSize: '24px',
      verticalAlign: 'middle',
      cursor: 'pointer',
      transition: 'color 0.3s',
      '&:hover': {
        color: token.colorPrimaryActive,
      },
    },
    lang: {
      width: 42,
      height: 42,
      lineHeight: '42px',
      position: 'fixed',
      right: 16,
      borderRadius: token.borderRadius,
      ':hover': {
        backgroundColor: token.colorBgTextHover,
      },
    },
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
    forgotPassword: {
      textAlign: 'right',
      marginBottom: 16,
    },
  };
});

const Lang = () => {
  const { styles } = useStyles();

  return (
    <div className={styles.lang} data-lang>
      {SelectLang && <SelectLang />}
    </div>
  );
};

const LoginMessage: React.FC<{
  content: string;
}> = ({ content }) => {
  return (
    <Alert
      style={{
        marginBottom: 24,
      }}
      message={content}
      type="error"
      showIcon
    />
  );
};

const Login: React.FC = () => {
  const [loginType, setLoginType] = useState<'password' | 'code'>('password');
  const [loginError, setLoginError] = useState<string>('');
  const [step, setStep] = useState<'email' | 'code'>('email');
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

  const handleLoginSuccess = async (token: string) => {
    setToken(token);
    message.success(
      intl.formatMessage({
        id: 'pages.login.success',
        defaultMessage: '登录成功！',
      }),
    );
    await fetchUserInfo();
    const urlParams = new URL(window.location.href).searchParams;
    window.location.href = urlParams.get('redirect') || '/';
  };

  // 密码登录
  const handlePasswordLogin = async (values: {
    email: string;
    password: string;
  }) => {
    try {
      setLoginError('');
      const response = await loginWithPassword({
        email: values.email,
        password: values.password,
      });
      if (response.token) {
        await handleLoginSuccess(response.token);
      }
    } catch (error: any) {
      const errorMsg =
        error?.response?.data?.message ||
        error?.info?.errorMessage ||
        intl.formatMessage({
          id: 'pages.login.failure',
          defaultMessage: '登录失败，请重试！',
        });
      setLoginError(errorMsg);
    }
  };

  // 验证码登录 - 发送验证码
  const handleSendCode = async (values: { email: string }) => {
    try {
      setLoginError('');
      setEmail(values.email);
      const response = await sendCode({
        mail: values.email,
        actionType: 'LOGIN',
      });
      setVerificationCodeId(response.verificationCodeId);
      setStep('code');
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
      setLoginError(errorMsg);
    }
  };

  // 验证码登录 - 验证
  const handleVerifyCode = async (values: { code: string }) => {
    try {
      setLoginError('');
      const response = await verifyCode({
        verificationCodeId,
        code: values.code,
      });
      if (response.token) {
        await handleLoginSuccess(response.token);
      }
    } catch (error: any) {
      const errorMsg =
        error?.response?.data?.message ||
        error?.info?.errorMessage ||
        intl.formatMessage({
          id: 'pages.login.failure',
          defaultMessage: '登录失败，请重试！',
        });
      setLoginError(errorMsg);
    }
  };

  const handleResend = async () => {
    try {
      setLoginError('');
      const response = await sendCode({
        mail: email,
        actionType: 'LOGIN',
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
      setLoginError(errorMsg);
    }
  };

  const renderPasswordLogin = () => (
    <LoginForm
      contentStyle={{
        minWidth: 280,
        maxWidth: '75vw',
      }}
      logo={<img alt="logo" src="/logo.svg" />}
      title="Ant Design"
      subTitle={intl.formatMessage({
        id: 'pages.layouts.userLayout.title',
      })}
      submitter={{
        searchConfig: {
          submitText: intl.formatMessage({
            id: 'pages.login.submit',
            defaultMessage: '登录',
          }),
        },
      }}
      onFinish={async (values) => {
        await handlePasswordLogin(
          values as { email: string; password: string },
        );
      }}
    >
      {loginError && <LoginMessage content={loginError} />}
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
      <ProFormText.Password
        name="password"
        fieldProps={{
          size: 'large',
          prefix: <LockOutlined />,
        }}
        placeholder={intl.formatMessage({
          id: 'pages.login.password.placeholder',
          defaultMessage: '密码',
        })}
        rules={[
          {
            required: true,
            message: intl.formatMessage({
              id: 'pages.login.password.required',
              defaultMessage: '请输入密码！',
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
      <div className={styles.forgotPassword}>
        <a
          onClick={() => {
            const urlParams = new URL(window.location.href).searchParams;
            const redirect = urlParams.get('redirect');
            const search = redirect
              ? `?redirect=${encodeURIComponent(redirect)}`
              : '';
            history.push(`/user/reset-password${search}`);
          }}
        >
          {intl.formatMessage({
            id: 'pages.login.forgotPassword',
            defaultMessage: '忘记密码？',
          })}
        </a>
      </div>
    </LoginForm>
  );

  const renderCodeLogin = () => {
    if (step === 'email') {
      return (
        <LoginForm
          contentStyle={{
            minWidth: 280,
            maxWidth: '75vw',
          }}
          logo={<img alt="logo" src="/logo.svg" />}
          title="Ant Design"
          subTitle={intl.formatMessage({
            id: 'pages.layouts.userLayout.title',
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
          {loginError && <LoginMessage content={loginError} />}
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
      );
    }

    return (
      <LoginForm
        contentStyle={{
          minWidth: 280,
          maxWidth: '75vw',
        }}
        logo={<img alt="logo" src="/logo.svg" />}
        title="Ant Design"
        subTitle={intl.formatMessage({
          id: 'pages.layouts.userLayout.title',
        })}
        submitter={{
          searchConfig: {
            submitText: intl.formatMessage({
              id: 'pages.login.submit',
              defaultMessage: '登录',
            }),
          },
        }}
        onFinish={async (values) => {
          await handleVerifyCode(values as { code: string });
        }}
      >
        {loginError && <LoginMessage content={loginError} />}
        <div style={{ marginBottom: 16, color: '#666', textAlign: 'center' }}>
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
        <div style={{ marginBottom: 24, textAlign: 'center' }}>
          <Space>
            <Button
              type="link"
              onClick={() => {
                setStep('email');
                setLoginError('');
                if (timerRef.current) clearInterval(timerRef.current);
                setCountdown(0);
              }}
            >
              {intl.formatMessage({
                id: 'pages.login.backToEmail',
                defaultMessage: '返回修改邮箱',
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
    );
  };

  return (
    <div className={styles.container}>
      <Helmet />
      <Lang />
      <div
        style={{
          flex: '1',
          padding: '32px 0',
        }}
      >
        {loginType === 'password' ? (
          <>
            {renderPasswordLogin()}
            <div style={{ textAlign: 'center', marginTop: -16 }}>
              <Tabs
                activeKey={loginType}
                centered
                items={[
                  { key: 'password', label: '密码登录' },
                  { key: 'code', label: '验证码登录' },
                ]}
                onChange={(key) => {
                  setLoginType(key as 'password' | 'code');
                  setLoginError('');
                }}
                size="small"
              />
            </div>
          </>
        ) : (
          <>
            {renderCodeLogin()}
            <div style={{ textAlign: 'center', marginTop: -16 }}>
              <Tabs
                activeKey={loginType}
                centered
                items={[
                  { key: 'password', label: '密码登录' },
                  { key: 'code', label: '验证码登录' },
                ]}
                onChange={(key) => {
                  setLoginType(key as 'password' | 'code');
                  setLoginError('');
                  setStep('email');
                }}
                size="small"
              />
            </div>
          </>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default Login;
