删除现有规则

iptables -F

  

设置默认的chain策略

iptables -P INPUT DROP

iptables -P FORWARD DROP

iptables -P OUTPUT DROP

  

允许全部进来的SSH

iptables -A INPUT -i eth0 -p tcp --dport 22 -m state --state NEW,ESTABLISHED -j ACCEPT

iptables -A OUTPUT -o eth0 -p tcp --sport 22 -m state --state ESTABLISHED -j ACCEPT

  

只允许某个特定网络进来的SSH

iptables -A INPUT -i eth0 -p tcp -s 192.168.1.2 --dport 22 -m state --state NEW,ESTABLISHED -j ACCEPT

iptables -A OUTPUT -o eth0 -p tcp --sport 22 -m state --state ESTABLISHED -j ACCEPT

  

允许进来的HTTP

iptables -A INPUT -i eth0 -p tcp --dport 80 -m state --state NEW,ESTABLISHED -j ACCEPT

iptables -A OUTPUT -o eth0 -p tcp --sport 80 -m state --state ESTABLISHED -j ACCEPT

  

多端口（SSH,HTTP,HTTPS）

iptables -A INPUT -i eth0 -p tcp -m multiport --dports 22,80,443 -m state --state NEW,ESTABLISHED -j ACCEPT

iptables -A OUTPUT -o eth0 -p tcp -m multiport --sports 22,80,443 -m state --state ESTABLISHED -j ACCEPT

  

允许出去的SSH

iptables -A OUTPUT-o eth0 -p tcp --dport 22 -m state --state NEW,ESTABLISHED -j ACCEPT

iptables -A input -i eth0 -p tcp --sport 22 -m state --state ESTABLISHED -j ACCEPT

  

允许外出的SSH，但仅访问某个特定的网络

iptables -A OUTPUT-o eth0 -p tcp -d 192.168.1.0/24 --dport 22 -m state --state NEW,ESTABLISHED -j ACCEPT

iptables -A input -i eth0 -p tcp --sport 22 -m state --state ESTABLISHED -j ACCEPT 1

  

允许外出的HTTPS

iptables -A OUTPUT-o eth0 -p tcp --dport 443 -m state --state NEW,ESTABLISHED -j ACCEPT

iptables -A input -i eth0 -p tcp --sport 443 -m state --state ESTABLISHED -j ACCEPT

  

对进来的HTTPS流量做负载均衡

iptables -A PREROUTING -i eth0 -p tcp --dport 443 -m state --state NEW -m nth --counter 0 --every 3 --packet 0 -j DNAT --to-destination 192.168.1.101:443

iptables -A PREROUTING -i eth0 -p tcp --dport 443 -m state --state NEW -m nth --counter 0 --every 3 --packet 1 -j DNAT --to-destination 192.168.1.102:443

iptables -A PREROUTING -i eth0 -p tcp --dport 443 -m state --state NEW -m nth --counter 0 --every 3 --packet 2 -j DNAT --to-destination 192.168.1.103:443

  

从内部向外部PING

iptables -A OUTPUT -p icmp --icmp-type echo-request -j ACCEPT

iptables -A INPUT -p icmp --icmp-type echo-reply -j ACCEPT

  

从外部向内部PING

iptables -A INPUT -p icmp --icmp-type echo-request -j ACCEPT

iptables -A OUTPUT -p icmp --icmp-type echo-reply -j ACCEPT

  

允许环回（lookback）访问

iptables -A INPUT -i lo -j ACCEPT

iptables -A OUTPUT -i lo -j ACCEPT

  

允许packets从内网访问外网

iptables -A FORWARD -i eth0 -o eth1 -j ACCEPT

  

允许外出的DNS

iptables -A OUTPUT -p udp -o eth0 --dport 53 -j ACCEPT

iptables -A INPUT -p udp -i eth0 --sport 53 -j ACCEPT

  

允许NIS链接

iptables -A INPUT -p tcp --dport 111 -j ACCEPT

iptables -A INPUT -p tcp --dport 853 -j ACCEPT

iptables -A INPUT -p tcp --dport 850 -j ACCEPT

iptables -A INPUT -p udp --dport 111 -j ACCEPT

iptables -A INPUT -p udp--dport 853 -j ACCEPT

iptables -A INPUT -p udp--dport 850 -j ACCEPT

  

允许某个特定网络rsyncj进入本机

iptables -A INPUT -i eth0 -p tcp -s 192.168.1.0/24 --dport 873 -m state --state NEW,ESTABLISHED -j ACCEPT

iptables -A OUTPUT -o eth0 -p tcp --sport 873 -m state --state ESTABLISHED -j ACCEPT

  

允许某个特定网络的MYSQL连接

iptables -A INPUT -i eth0 -p tcp -s 192.168.1.0/24 --dport 3306 -m state --state NEW,ESTABLISHED -j ACCEPT

iptables -A OUTPUT -o eth0 -p tcp --sport 3306 -m state --state ESTABLISHED -j ACCEPT

  

允许sendmail或postfix

iptables -A INPUT -i eth0 -p tcp  --dport 25 -m state --state NEW,ESTABLISHED -j ACCEPT

iptables -A OUTPUT -o eth0 -p tcp --sport 25 -m state --state ESTABLISHED -j ACCEPT

  

允许IMAP和IMAPS

iptables -A INPUT -i eth0 -p tcp  --dport 143-m state --state NEW,ESTABLISHED -j ACCEPT

iptables -A OUTPUT -o eth0 -p tcp --sport 143 -m state --state ESTABLISHED -j ACCEPT

iptables -A INPUT -i eth0 -p tcp  --dport 993 m state --state NEW,ESTABLISHED -j ACCEPT

iptables -A OUTPUT -o eth0 -p tcp --sport 993 -m state --state ESTABLISHED -j ACCEPT

  

允许POP3和POP3S

iptables -A INPUT -i eth0 -p tcp  --dport 110 -m state --state NEW,ESTABLISHED -j ACCEPT

iptables -A OUTPUT -o eth0 -p tcp --sport 110 -m state --state ESTABLISHED -j ACCEPT

iptables -A INPUT -i eth0 -p tcp  --dport 995 -m state --state NEW,ESTABLISHED -j ACCEPT

iptables -A OUTPUT -o eth0 -p tcp --sport 995 -m state --state ESTABLISHED -j ACCEPT

  

防止DOS攻击

iptables -A INPUT -p tcp --dport 80 -m limit --limit 25/minute --limit-burst 100 -j ACCEPT

  

设置442端口转发到22端口

iptables -t nat -A PREROUTING -p tcp -d 192.168.1.100     --dport 442 -j DNAT --to 192.168.1.100:22

iptables -A INPUT -i eth0 -p tcp --dport 442 -m state --state NEW,ESTABLISHED -j ACCEPT

iptables -A OUTPUT -o eth0 -p tcp --sport 442-m state --state ESTABLISHED -j ACCEPT

  

为丢弃的包做日志LOG

iptabels -N LOGGING

iptables -A INPUT -j LOGGING

iptables -A LOGGING -m limit --limit 2/min -j LOG --log-prefix "Iptables Packets Dropped" --log-level 7

iptables -A LOGGING -j DROP