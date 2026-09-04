window.$docsify = {
  name: '运维日常笔记',
  auto2top: true,
  loadNavbar: false,
  loadSidebar: '_sidebar.md',
  mergeNavbar: true,
  subMaxLevel: 2,
  homepage: 'articles/README.md',

  search: {
    noData: {
      '/': '找不到结果！'
    },
    paths: 'auto',
    placeholder: {
      '/': '搜索'
    }
  }
};