/**
 * @name umi 的路由配置
 * @description 只支持 path,component,routes,redirect,wrappers,name,icon 的配置
 * @param path  path 只支持两种占位符配置，第一种是动态参数 :id 的形式，第二种是 * 通配符，通配符只能出现路由字符串的最后。
 * @param component 配置 location 和 path 匹配后用于渲染的 React 组件路径。可以是绝对路径，也可以是相对路径，如果是相对路径，会从 src/pages 开始找起。
 * @param routes 配置子路由，通常在需要为多个路径增加 layout 组件时使用。
 * @param redirect 配置路由跳转
 * @param wrappers 配置路由组件的包装组件，通过包装组件可以为当前的路由组件组合进更多的功能。 比如，可以用于路由级别的权限校验
 * @param name 配置路由的标题，默认读取国际化文件 menu.ts 中 menu.xxxx 的值，如配置 name 为 login，则读取 menu.ts 中 menu.login 的取值作为标题
 * @param icon 配置路由的图标，取值参考 https://ant.design/components/icon-cn， 注意去除风格后缀和大小写，如想要配置图标为 <StepBackwardOutlined /> 则取值应为 stepBackward 或 StepBackward，如想要配置图标为 <UserOutlined /> 则取值应为 user 或者 User
 * @doc https://umijs.org/docs/guides/routes
 */
export default [
  {
    path: '/user',
    layout: false,
    routes: [
      {
        name: 'login',
        path: '/user/login',
        component: './user/login',
      },
      {
        name: 'reset-password',
        path: '/user/reset-password',
        component: './user/reset-password',
      },
      // register route disabled - DynamoAuth has no registration endpoint
      // {
      //   name: 'register',
      //   path: '/user/register',
      //   component: './user/register',
      // },
    ],
  },
  {
    path: '/welcome',
    name: 'welcome',
    icon: 'smile',
    component: './Welcome',
  },
  {
    path: '/admin',
    name: 'admin',
    icon: 'crown',
    access: 'canAdmin',
    routes: [
      {
        path: '/admin',
        redirect: '/admin/sub-page',
      },
      {
        path: '/admin/sub-page',
        name: 'sub-page',
        component: './Admin',
      },
    ],
  },
  {
    name: 'list.table-list',
    icon: 'table',
    path: '/list',
    component: './table-list',
  },
  {
    path: '/sync-data',
    name: 'sync-data',
    icon: 'cloudServer',
    routes: [
      {
        path: '/sync-data/business',
        name: 'sync-business',
        component: './sync-data/business',
      },
      {
        path: '/sync-data/client',
        name: 'sync-client',
        component: './sync-data/client',
      },
      {
        path: '/sync-data/location',
        name: 'sync-location',
        component: './sync-data/location',
      },
      {
        path: '/sync-data/service',
        name: 'sync-service',
        component: './sync-data/service',
      },
      {
        path: '/sync-data/service-category',
        name: 'sync-service-category',
        component: './sync-data/service-category',
      },
      {
        path: '/sync-data/staff',
        name: 'sync-staff',
        component: './sync-data/staff',
      },
      {
        path: '/sync-data',
        redirect: '/sync-data/business',
      },
    ],
  },
  {
    path: '/clients',
    name: 'clients',
    icon: 'team',
    component: './clients',
  },
  {
    path: '/rooms',
    name: 'rooms',
    icon: 'home',
    component: './rooms',
  },
  {
    path: '/equipment',
    name: 'equipment',
    icon: 'tool',
    component: './equipment',
  },
  {
    path: '/appointments',
    name: 'appointments',
    icon: 'calendar',
    routes: [
      {
        path: '/appointments',
        name: 'appointments',
        component: './appointments',
      },
      {
        path: '/appointments/calendar',
        name: 'calendar',
        component: './appointments/calendar',
      },
      {
        path: '/appointments/new',
        name: 'new-appointment',
        component: './appointments/new',
      },
    ],
  },
  {
    path: '/staff',
    name: 'staff',
    icon: 'team',
    component: './staff',
  },
  {
    path: '/employees',
    name: 'employees',
    icon: 'user',
    component: './employees',
  },
  {
    path: '/locations',
    name: 'locations',
    icon: 'environment',
    component: './locations',
  },
  {
    path: '/service-categories',
    name: 'service-categories',
    icon: 'appstore',
    component: './service-categories',
  },
  {
    path: '/services',
    name: 'services',
    icon: 'scissor',
    component: './services',
  },
  {
    path: '/shifts',
    name: 'shifts',
    icon: 'schedule',
    component: './shifts',
  },
  {
    path: '/timeblocks',
    name: 'timeblocks',
    icon: 'stop',
    component: './timeblocks',
  },
  {
    path: '/account',
    routes: [
      {
        path: '/account/change-password',
        name: 'change-password',
        component: './account/change-password',
      },
    ],
  },
  {
    path: '/kanban',
    name: 'front-desk',
    icon: 'appstore',
    component: './kanban',
  },
  {
    path: '/deposits',
    name: 'deposits',
    icon: 'dollar',
    component: './deposits',
  },
  {
    path: '/',
    redirect: '/welcome',
  },
  {
    component: '404',
    layout: false,
    path: './*',
  },
];
