// ==== 公共参数 ====
const ruleProviderCommon = {
  type: 'http',
  format: 'yaml',
  interval: 86400
};

const BASE = 'https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash';

// ==== 规则集 ====
const ruleProviders = {
  // ---- 需代理 ----
  proxy: {
    ...ruleProviderCommon,
    behavior: 'domain',
    url: `${BASE}/Proxy/Proxy.yaml`,
    path: './ruleset/blackmatrix7/proxy.yaml'
  },
  proxy_classical: {
    ...ruleProviderCommon,
    behavior: 'classical',
    url: `${BASE}/Proxy/Proxy_Classical.yaml`,
    path: './ruleset/blackmatrix7/proxy_classical.yaml'
  },
  claude: {
    ...ruleProviderCommon,
    behavior: 'domain',
    url: `${BASE}/Claude/Claude.yaml`,
    path: './ruleset/blackmatrix7/claude.yaml'
  },
  openai: {
    ...ruleProviderCommon,
    behavior: 'domain',
    url: `${BASE}/OpenAI/OpenAI.yaml`,
    path: './ruleset/blackmatrix7/openai.yaml'
  },

  // ---- 境内直连 ----
  cnmax: {
    ...ruleProviderCommon,
    behavior: 'domain',
    url: `${BASE}/ChinaMax/ChinaMax.yaml`,
    path: './ruleset/blackmatrix7/chinamax.yaml'
  },
  cnmax_classical: {
    ...ruleProviderCommon,
    behavior: 'classical',
    url: `${BASE}/ChinaMax/ChinaMax_Classical.yaml`,
    path: './ruleset/blackmatrix7/chinamax_classical.yaml'
  },
  cnmax_ip: {
    ...ruleProviderCommon,
    behavior: 'ipcidr',
    url: `${BASE}/ChinaMax/ChinaMax_IP.yaml`,
    path: './ruleset/blackmatrix7/chinamax_ip.yaml'
  }
};

// 把原有规则里会触发本地解析的部分清理掉
function sanitize(rules) {
  return (rules || []).filter(r => {
    const s = String(r).replace(/\s/g, '').toUpperCase();
    if (s.startsWith('MATCH')) return false;                 // 兜底由脚本统一给
    if (/^(GEOIP|IP-CIDR6?|IP-ASN),/.test(s) && !s.includes('NO-RESOLVE')) return false;
    return true;
  });
}

function main(config) {
  // 1. 注入规则集
  config['rule-providers'] = {
    ...(config['rule-providers'] || {}),
    ...ruleProviders
  };

  // 2. 确定代理出口（取第一个代理组）
  let proxyTarget = 'DIRECT';
  if (config['proxy-groups'] && config['proxy-groups'].length > 0) {
    proxyTarget = config['proxy-groups'][0].name;
  }

  // 3. 规则主体
  const newRules = [
    // 本地与私有网段
    'DOMAIN-SUFFIX,local,DIRECT',
    'IP-CIDR,127.0.0.0/8,DIRECT,no-resolve',
    'IP-CIDR,10.0.0.0/8,DIRECT,no-resolve',
    'IP-CIDR,172.16.0.0/12,DIRECT,no-resolve',
    'IP-CIDR,192.168.0.0/16,DIRECT,no-resolve',
    'IP-CIDR,100.64.0.0/10,DIRECT,no-resolve',

    // 个人指定强制代理
    `DOMAIN-SUFFIX,jbbtoken.cn,${proxyTarget}`,
    `DOMAIN-SUFFIX,lobehub.com,${proxyTarget}`,

    // 需代理域名集（域名级，零解析）
    `RULE-SET,claude,${proxyTarget}`,
    `RULE-SET,openai,${proxyTarget}`,
    `RULE-SET,proxy,${proxyTarget}`,
    `RULE-SET,proxy_classical,${proxyTarget},no-resolve`,

    // 境内域名集（域名级，零解析）
    'RULE-SET,cnmax,DIRECT',
    'RULE-SET,cnmax_classical,DIRECT,no-resolve',

    // 境内 IP（只对已带真实 IP 的连接生效）
    'RULE-SET,cnmax_ip,DIRECT,no-resolve',
    'GEOIP,CN,DIRECT,no-resolve'
  ];

  // 4. 合并，兜底走代理
  config.rules = [
    ...newRules,
    ...sanitize(config.rules),
    `MATCH,${proxyTarget}`
  ];

  return config;
}