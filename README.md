# clash-verge-script
Use this script in Clash Verge for global configuration (global extension script) to achieve the following:

1. Direct connection for domain names within mainland China;
2. Use proxy for domain names that require a proxy;
3. Final: proxy, without generating mainland DNS resolution records.

Explanation:

The first four RULE-SETs (proxy sets), as well as cnmax and cnmax_classical, all rely on domain-string matching, and no DNS requests are sent during matching.

The three sets that may contain IP rules (proxy_classical, cnmax_classical, and cnmax_ip) all use no-resolve. They only take effect for connections initiated directly to IP addresses by the client and will not resolve domain names.

A domain name reaching MATCH,PROXY means that it is neither in the proxy sets nor in the mainland sets, and is therefore an “unknown overseas domain.” In fake-ip mode, it is passed to the VLESS node with the domain name unchanged and resolved by the Japanese server; the local 223.5.5.5 will not see this domain name.

Domestic domain names matching cnmax / cnmax_classical are routed to DIRECT. Only then does the core perform one local resolution—this is precisely the part you indicated is acceptable.

Location of the original rules:
The script places the rules included with the subscription after all rule sets, so the subscription's routing policies will generally be preempted by this set of rules. Currently, you are using a local single-node configuration, so this has no effect; if you switch to an airport subscription in the future and want the subscription rules to take priority, you will need to adjust the concatenation order.
