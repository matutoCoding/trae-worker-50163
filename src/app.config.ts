export default defineAppConfig({
  pages: [
    'pages/home/index',
    'pages/billing/index',
    'pages/queue/index',
    'pages/settings/index',
    'pages/openRoom/index',
    'pages/billDetail/index',
    'pages/ruleConfig/index',
    'pages/report/index',
    'pages/member/index',
    'pages/memberDetail/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#D4380D',
    navigationBarTitleText: '棋牌室计时系统',
    navigationBarTextStyle: 'white',
    backgroundColor: '#FAF5F0'
  },
  tabBar: {
    color: '#86909C',
    selectedColor: '#D4380D',
    backgroundColor: '#FFFFFF',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/home/index',
        text: '首页'
      },
      {
        pagePath: 'pages/billing/index',
        text: '计费'
      },
      {
        pagePath: 'pages/queue/index',
        text: '叫号'
      },
      {
        pagePath: 'pages/settings/index',
        text: '设置'
      }
    ]
  }
})
