### zookeeper监控要点

```groovy
zk_avg/min/max_latency           响应一个客户端请求的时间，建议这个时间大于10个Tick就报警
zk_outstanding_requests          排队请求的数量，当ZooKeeper超过了它的处理能力时，这个值会增大，建议设置报警阀值为10
zk_packets_received              接收到客户端请求的包数量
zk_packets_sent                  发送给客户单的包数量，主要是响应和通知
zk_max_file_descriptor_count     最大允许打开的文件数，由ulimit控制
zk_open_file_descriptor_count    打开文件数量，当这个值大于允许值得85%时报警
Mode                             运行的角色，如果没有加入集群就是standalone,加入集群式follower或者leader
zk_followers                     leader角色才会有这个输出,集合中follower的个数。正常的值应该是集合成员的数量减1
zk_pending_syncs                 leader角色才会有这个输出，pending syncs的数量
zk_znode_count                   znodes的数量
zk_watch_count                   watches的数量
Java Heap Size                   ZooKeeper Java进程的
```

  

### 配置监控

> 在各节点操作

（1）、安装依赖包

```shell
yum install -y nc
yum install -y zabbix-sender
```

  

（2）、用nc获取数据测试

  

```shell
# echo ruok|nc 127.0.0.1 2181
imok

# echo mntr|nc 127.0.0.1 2181
zk_version 3.4.6-1569965, built on 03/16/2020 09:09 GMT
zk_avg_latency 0
zk_max_latency 6
zk_min_latency 0
zk_packets_received 93114
zk_packets_sent 93113
zk_num_alive_connections 4
zk_outstanding_requests 0
zk_server_state leader
zk_znode_count 29
zk_watch_count 0
zk_ephemerals_count 14
zk_approximate_data_size 1087
zk_open_file_descriptor_count 39
zk_max_file_descriptor_count 1000000
zk_followers 4
zk_synced_followers 4
zk_pending_syncs 0

# echo srvr|nc 127.0.0.1 2181
Zookeeper version: 3.4.6-1569965, built on 03/16/2020 09:09 GMT
Latency min/avg/max: 0/0/6
Received: 93121
Sent: 93120
Connections: 4
Outstanding: 0
Zxid: 0x900000020
Mode: leader
Node count: 29

```

  

要让Zabbix收集到这些监控数据，有两种方法:

（1）、每个监控项目通过zabbix agent单独获取，主动监控和被动监控都可以。

（2）、将这些监控数据一次性使用zabbix\_sender全部发送给zabbix。

  

这里我们选择第二种方式。那么采用zabbix\_sender一次性发送全部监控数据的脚本就不能像通过zabbix agent这样逐个获取监控项目来编写脚本。

首先想办法将监控项目汇集成一个字典，然后遍历这个字典，将字典中的key:value对通过zabbix\_sender的-k和-o参数指定发送出去。

  

echo mntr|nc 127.0.0.1 2181

  

这条命令可以使用Python的subprocess模块调用，也可以使用socket模块去访问2181端口然后发送命令获取数据，获取到mntr执行的数据后还需要将其转化成为字典数据。

  

详细代码如下：

  

```python
#!/usr/bin/env python

""" Check Zookeeper Cluster  

zookeeper version should be newer than 3.4.x  

# echo mntr|nc 127.0.0.1 2181  
zk_version  3.4.6-1569965, built on 02/20/2014 09:09 GMT  
zk_avg_latency  0  
zk_max_latency  4  
zk_min_latency  0  
zk_packets_received 84467  
zk_packets_sent 84466  
zk_num_alive_connections    3  
zk_outstanding_requests 0  
zk_server_state follower  
zk_znode_count  17159  
zk_watch_count  2  
zk_ephemerals_count 1  
zk_approximate_data_size    6666471  
zk_open_file_descriptor_count   29  
zk_max_file_descriptor_count    102400  

# echo ruok|nc 127.0.0.1 2181  
imok  

"""
import sys
import socket
import re
import subprocess
from StringIO import StringIO
import os

zabbix_sender = '/usr/local/zabbix/bin/zabbix_sender'
zabbix_conf = '/usr/local/zabbix/etc/zabbix_agentd.conf'
send_to_zabbix = 1

############# get zookeeper server status
class ZooKeeperServer(object):
    def __init__(self, host='localhost', port='2181', timeout=1):
        self._address = (host, int(port))
        self._timeout = timeout
        self._result = {}

    def _create_socket(self):
        return socket.socket()

    def _send_cmd(self, cmd):
        """ Send a 4letter word command to the server """
        s = self._create_socket()
        s.settimeout(self._timeout)

        s.connect(self._address)
        s.send(cmd)

        data = s.recv(2048)
        s.close()

        return data

    def get_stats(self):
        """ Get ZooKeeper server stats as a map """
        data_mntr = self._send_cmd('mntr')
        data_ruok = self._send_cmd('ruok')
        if data_mntr:
            result_mntr = self._parse(data_mntr)
        if data_ruok:
            result_ruok = self._parse_ruok(data_ruok)

        self._result = dict(result_mntr.items() + result_ruok.items())

        if not self._result.has_key('zk_followers') and not self._result.has_key(
                'zk_synced_followers') and not self._result.has_key('zk_pending_syncs'):
            ##### the tree metrics only exposed on leader role zookeeper server, we just set the followers' to 0
            leader_only = {'zk_followers': 0, 'zk_synced_followers': 0, 'zk_pending_syncs': 0}
            self._result = dict(result_mntr.items() + result_ruok.items() + leader_only.items())

        return self._result

    def _parse(self, data):
        """ Parse the output from the 'mntr' 4letter word command """
        h = StringIO(data)

        result = {}
        for line in h.readlines():
            try:
                key, value = self._parse_line(line)
                result[key] = value
            except ValueError:
                pass  # ignore broken lines

        return result

    def _parse_ruok(self, data):
        """ Parse the output from the 'ruok' 4letter word command """

        h = StringIO(data)

        result = {}

        ruok = h.readline()
        if ruok:
            result['zk_server_ruok'] = ruok

        return result

    def _parse_line(self, line):
        try:
            key, value = map(str.strip, line.split('\t'))
        except ValueError:
            raise ValueError('Found invalid line: %s' % line)

        if not key:
            raise ValueError('The key is mandatory and should not be empty')

        try:
            value = int(value)
        except (TypeError, ValueError):
            pass

        return key, value

    def get_pid(self):
        pidarg = '''/opt/software/jdk/bin/jps -l |grep zookeeper  |awk '{print $1}' '''
        pidout = subprocess.Popen(pidarg, shell=True, stdout=subprocess.PIPE)
        pid = pidout.stdout.readline().strip('\n')
        return pid

    def send_to_zabbix(self, metric):
        key = "zookeeper.status[" + metric + "]"

        if send_to_zabbix > 0:
            # print key + ":" + str(self._result[metric])
            try:

                subprocess.call([zabbix_sender, "-c", zabbix_conf, "-k", key, "-o", str(self._result[metric])],
                                stdout=FNULL, stderr=FNULL, shell=False)
            except OSError, detail:
                print "Something went wrong while exectuting zabbix_sender : ", detail
        else:
            print "Simulation: the following command would be execucted :\n", zabbix_sender, "-c", zabbix_conf, "-k", key, "-o", \
            self._result[metric], "\n"

def usage():
    """Display program usage"""

    print "\nUsage : ", sys.argv[0], " alive|all"
    print "Modes : \n\talive : Return pid of running zookeeper\n\tall : Send zookeeper stats as well"
    sys.exit(1)

accepted_modes = ['alive', 'all']

if len(sys.argv) == 2 and sys.argv[1] in accepted_modes:
    mode = sys.argv[1]
else:
    usage()

zk = ZooKeeperServer()
#  print zk.get_stats()
pid = zk.get_pid()

if pid != "" and mode == 'all':
    zk.get_stats()
    # print zk._result
    FNULL = open(os.devnull, 'w')
    for key in zk._result:
        zk.send_to_zabbix(key)
    FNULL.close()
    print pid

elif pid != "" and mode == "alive":
    print pid
else:
    print 0
```

  

注意，有几个地方需要修改：

-   zabbix\_sender的目录
-   zabbix\_conf的目录
-   jps的目录，在代码126行

  

（3）、添加可执行脚本

```shell
chmod +x  /usr/local/zabbix-agent/scripts/check_zookeeper.py
```

  

（4）、修改zabbix\_agent的配置文件

vim /etc/zabbix/zabbix\_agentd.d/check\_zookeeper.conf

```shell
UserParameter=zookeeper.status[*],/usr/bin/python /usr/local/zabbix-agent/scripts/check_zookeeper.py $1
```

  

（5）、重启zabbix\_agent

```shell
service zabbix-agent restart
```

  

### 制作模板并导入

zk.xml

```shell
<?xml version="1.0" encoding="UTF-8"?>
<zabbix_export>
    <version>3.0</version>
    <date>2017-12-11T08:02:58Z</date>
    <groups>
        <group>
            <name>Zabbix servers</name>
        </group>
    </groups>
    <templates>
        <template>
            <template>Zookeeper</template>
            <name>Zookeeper</name>
            <description/>
            <groups>
                <group>
                    <name>Zabbix servers</name>
                </group>
            </groups>
            <applications>
                <application>
                    <name>ZooKeeper Status</name>
                </application>
            </applications>
            <items>
                <item>
                    <name>zookeeper pid</name>
                    <type>2</type>
                    <snmp_community/>
                    <multiplier>0</multiplier>
                    <snmp_oid/>
                    <key>zookeeper.status[alive]</key>
                    <delay>10</delay>
                    <history>90</history>
                    <trends>365</trends>
                    <status>0</status>
                    <value_type>3</value_type>
                    <allowed_hosts/>
                    <units/>
                    <delta>0</delta>
                    <snmpv3_contextname/>
                    <snmpv3_securityname/>
                    <snmpv3_securitylevel>0</snmpv3_securitylevel>
                    <snmpv3_authprotocol>0</snmpv3_authprotocol>
                    <snmpv3_authpassphrase/>
                    <snmpv3_privprotocol>0</snmpv3_privprotocol>
                    <snmpv3_privpassphrase/>
                    <formula>1</formula>
                    <delay_flex/>
                    <params/>
                    <ipmi_sensor/>
                    <data_type>0</data_type>
                    <authtype>0</authtype>
                    <username/>
                    <password/>
                    <publickey/>
                    <privatekey/>
                    <port/>
                    <description/>
                    <inventory_link>0</inventory_link>
                    <applications>
                        <application>
                            <name>ZooKeeper Status</name>
                        </application>
                    </applications>
                    <valuemap/>
                    <logtimefmt/>
                </item>
                <item>
                    <name>zookeeper approximate data size</name>
                    <type>2</type>
                    <snmp_community/>
                    <multiplier>0</multiplier>
                    <snmp_oid/>
                    <key>zookeeper.status[zk_approximate_data_size]</key>
                    <delay>0</delay>
                    <history>90</history>
                    <trends>365</trends>
                    <status>0</status>
                    <value_type>3</value_type>
                    <allowed_hosts/>
                    <units/>
                    <delta>0</delta>
                    <snmpv3_contextname/>
                    <snmpv3_securityname/>
                    <snmpv3_securitylevel>0</snmpv3_securitylevel>
                    <snmpv3_authprotocol>0</snmpv3_authprotocol>
                    <snmpv3_authpassphrase/>
                    <snmpv3_privprotocol>0</snmpv3_privprotocol>
                    <snmpv3_privpassphrase/>
                    <formula>1</formula>
                    <delay_flex/>
                    <params/>
                    <ipmi_sensor/>
                    <data_type>0</data_type>
                    <authtype>0</authtype>
                    <username/>
                    <password/>
                    <publickey/>
                    <privatekey/>
                    <port/>
                    <description/>
                    <inventory_link>0</inventory_link>
                    <applications>
                        <application>
                            <name>ZooKeeper Status</name>
                        </application>
                    </applications>
                    <valuemap/>
                    <logtimefmt/>
                </item>
                <item>
                    <name>zookeeper average latency</name>
                    <type>2</type>
                    <snmp_community/>
                    <multiplier>0</multiplier>
                    <snmp_oid/>
                    <key>zookeeper.status[zk_avg_latency]</key>
                    <delay>0</delay>
                    <history>90</history>
                    <trends>365</trends>
                    <status>0</status>
                    <value_type>3</value_type>
                    <allowed_hosts/>
                    <units/>
                    <delta>0</delta>
                    <snmpv3_contextname/>
                    <snmpv3_securityname/>
                    <snmpv3_securitylevel>0</snmpv3_securitylevel>
                    <snmpv3_authprotocol>0</snmpv3_authprotocol>
                    <snmpv3_authpassphrase/>
                    <snmpv3_privprotocol>0</snmpv3_privprotocol>
                    <snmpv3_privpassphrase/>
                    <formula>1</formula>
                    <delay_flex/>
                    <params/>
                    <ipmi_sensor/>
                    <data_type>0</data_type>
                    <authtype>0</authtype>
                    <username/>
                    <password/>
                    <publickey/>
                    <privatekey/>
                    <port/>
                    <description/>
                    <inventory_link>0</inventory_link>
                    <applications>
                        <application>
                            <name>ZooKeeper Status</name>
                        </application>
                    </applications>
                    <valuemap/>
                    <logtimefmt/>
                </item>
                <item>
                    <name>zookeeper ephemerals count</name>
                    <type>2</type>
                    <snmp_community/>
                    <multiplier>0</multiplier>
                    <snmp_oid/>
                    <key>zookeeper.status[zk_ephemerals_count]</key>
                    <delay>0</delay>
                    <history>90</history>
                    <trends>365</trends>
                    <status>0</status>
                    <value_type>3</value_type>
                    <allowed_hosts/>
                    <units/>
                    <delta>0</delta>
                    <snmpv3_contextname/>
                    <snmpv3_securityname/>
                    <snmpv3_securitylevel>0</snmpv3_securitylevel>
                    <snmpv3_authprotocol>0</snmpv3_authprotocol>
                    <snmpv3_authpassphrase/>
                    <snmpv3_privprotocol>0</snmpv3_privprotocol>
                    <snmpv3_privpassphrase/>
                    <formula>1</formula>
                    <delay_flex/>
                    <params/>
                    <ipmi_sensor/>
                    <data_type>0</data_type>
                    <authtype>0</authtype>
                    <username/>
                    <password/>
                    <publickey/>
                    <privatekey/>
                    <port/>
                    <description/>
                    <inventory_link>0</inventory_link>
                    <applications>
                        <application>
                            <name>ZooKeeper Status</name>
                        </application>
                    </applications>
                    <valuemap/>
                    <logtimefmt/>
                </item>
                <item>
                    <name>zookeeper leader's followers</name>
                    <type>2</type>
                    <snmp_community/>
                    <multiplier>0</multiplier>
                    <snmp_oid/>
                    <key>zookeeper.status[zk_followers]</key>
                    <delay>0</delay>
                    <history>90</history>
                    <trends>365</trends>
                    <status>0</status>
                    <value_type>3</value_type>
                    <allowed_hosts/>
                    <units/>
                    <delta>0</delta>
                    <snmpv3_contextname/>
                    <snmpv3_securityname/>
                    <snmpv3_securitylevel>0</snmpv3_securitylevel>
                    <snmpv3_authprotocol>0</snmpv3_authprotocol>
                    <snmpv3_authpassphrase/>
                    <snmpv3_privprotocol>0</snmpv3_privprotocol>
                    <snmpv3_privpassphrase/>
                    <formula>1</formula>
                    <delay_flex/>
                    <params/>
                    <ipmi_sensor/>
                    <data_type>0</data_type>
                    <authtype>0</authtype>
                    <username/>
                    <password/>
                    <publickey/>
                    <privatekey/>
                    <port/>
                    <description/>
                    <inventory_link>0</inventory_link>
                    <applications>
                        <application>
                            <name>ZooKeeper Status</name>
                        </application>
                    </applications>
                    <valuemap/>
                    <logtimefmt/>
                </item>
                <item>
                    <name>zookeeper max file descriptor count</name>
                    <type>2</type>
                    <snmp_community/>
                    <multiplier>0</multiplier>
                    <snmp_oid/>
                    <key>zookeeper.status[zk_max_file_descriptor_count]</key>
                    <delay>10</delay>
                    <history>90</history>
                    <trends>365</trends>
                    <status>0</status>
                    <value_type>3</value_type>
                    <allowed_hosts/>
                    <units/>
                    <delta>0</delta>
                    <snmpv3_contextname/>
                    <snmpv3_securityname/>
                    <snmpv3_securitylevel>0</snmpv3_securitylevel>
                    <snmpv3_authprotocol>0</snmpv3_authprotocol>
                    <snmpv3_authpassphrase/>
                    <snmpv3_privprotocol>0</snmpv3_privprotocol>
                    <snmpv3_privpassphrase/>
                    <formula>1</formula>
                    <delay_flex/>
                    <params/>
                    <ipmi_sensor/>
                    <data_type>0</data_type>
                    <authtype>0</authtype>
                    <username/>
                    <password/>
                    <publickey/>
                    <privatekey/>
                    <port/>
                    <description/>
                    <inventory_link>0</inventory_link>
                    <applications>
                        <application>
                            <name>ZooKeeper Status</name>
                        </application>
                    </applications>
                    <valuemap/>
                    <logtimefmt/>
                </item>
                <item>
                    <name>zookeeper max latency</name>
                    <type>2</type>
                    <snmp_community/>
                    <multiplier>0</multiplier>
                    <snmp_oid/>
                    <key>zookeeper.status[zk_max_latency]</key>
                    <delay>10</delay>
                    <history>90</history>
                    <trends>365</trends>
                    <status>0</status>
                    <value_type>3</value_type>
                    <allowed_hosts/>
                    <units/>
                    <delta>0</delta>
                    <snmpv3_contextname/>
                    <snmpv3_securityname/>
                    <snmpv3_securitylevel>0</snmpv3_securitylevel>
                    <snmpv3_authprotocol>0</snmpv3_authprotocol>
                    <snmpv3_authpassphrase/>
                    <snmpv3_privprotocol>0</snmpv3_privprotocol>
                    <snmpv3_privpassphrase/>
                    <formula>1</formula>
                    <delay_flex/>
                    <params/>
                    <ipmi_sensor/>
                    <data_type>0</data_type>
                    <authtype>0</authtype>
                    <username/>
                    <password/>
                    <publickey/>
                    <privatekey/>
                    <port/>
                    <description/>
                    <inventory_link>0</inventory_link>
                    <applications>
                        <application>
                            <name>ZooKeeper Status</name>
                        </application>
                    </applications>
                    <valuemap/>
                    <logtimefmt/>
                </item>
                <item>
                    <name>zookeeper min latency</name>
                    <type>2</type>
                    <snmp_community/>
                    <multiplier>0</multiplier>
                    <snmp_oid/>
                    <key>zookeeper.status[zk_min_latency]</key>
                    <delay>10</delay>
                    <history>90</history>
                    <trends>365</trends>
                    <status>0</status>
                    <value_type>3</value_type>
                    <allowed_hosts/>
                    <units/>
                    <delta>0</delta>
                    <snmpv3_contextname/>
                    <snmpv3_securityname/>
                    <snmpv3_securitylevel>0</snmpv3_securitylevel>
                    <snmpv3_authprotocol>0</snmpv3_authprotocol>
                    <snmpv3_authpassphrase/>
                    <snmpv3_privprotocol>0</snmpv3_privprotocol>
                    <snmpv3_privpassphrase/>
                    <formula>1</formula>
                    <delay_flex/>
                    <params/>
                    <ipmi_sensor/>
                    <data_type>0</data_type>
                    <authtype>0</authtype>
                    <username/>
                    <password/>
                    <publickey/>
                    <privatekey/>
                    <port/>
                    <description/>
                    <inventory_link>0</inventory_link>
                    <applications>
                        <application>
                            <name>ZooKeeper Status</name>
                        </application>
                    </applications>
                    <valuemap/>
                    <logtimefmt/>
                </item>
                <item>
                    <name>zookeeper alive connections</name>
                    <type>2</type>
                    <snmp_community/>
                    <multiplier>0</multiplier>
                    <snmp_oid/>
                    <key>zookeeper.status[zk_num_alive_connections]</key>
                    <delay>0</delay>
                    <history>90</history>
                    <trends>365</trends>
                    <status>0</status>
                    <value_type>3</value_type>
                    <allowed_hosts/>
                    <units/>
                    <delta>0</delta>
                    <snmpv3_contextname/>
                    <snmpv3_securityname/>
                    <snmpv3_securitylevel>0</snmpv3_securitylevel>
                    <snmpv3_authprotocol>0</snmpv3_authprotocol>
                    <snmpv3_authpassphrase/>
                    <snmpv3_privprotocol>0</snmpv3_privprotocol>
                    <snmpv3_privpassphrase/>
                    <formula>1</formula>
                    <delay_flex/>
                    <params/>
                    <ipmi_sensor/>
                    <data_type>0</data_type>
                    <authtype>0</authtype>
                    <username/>
                    <password/>
                    <publickey/>
                    <privatekey/>
                    <port/>
                    <description/>
                    <inventory_link>0</inventory_link>
                    <applications>
                        <application>
                            <name>ZooKeeper Status</name>
                        </application>
                    </applications>
                    <valuemap/>
                    <logtimefmt/>
                </item>
                <item>
                    <name>zookeeper opened file descriptor count</name>
                    <type>2</type>
                    <snmp_community/>
                    <multiplier>0</multiplier>
                    <snmp_oid/>
                    <key>zookeeper.status[zk_open_file_descriptor_count]</key>
                    <delay>10</delay>
                    <history>90</history>
                    <trends>365</trends>
                    <status>0</status>
                    <value_type>3</value_type>
                    <allowed_hosts/>
                    <units/>
                    <delta>0</delta>
                    <snmpv3_contextname/>
                    <snmpv3_securityname/>
                    <snmpv3_securitylevel>0</snmpv3_securitylevel>
                    <snmpv3_authprotocol>0</snmpv3_authprotocol>
                    <snmpv3_authpassphrase/>
                    <snmpv3_privprotocol>0</snmpv3_privprotocol>
                    <snmpv3_privpassphrase/>
                    <formula>1</formula>
                    <delay_flex/>
                    <params/>
                    <ipmi_sensor/>
                    <data_type>0</data_type>
                    <authtype>0</authtype>
                    <username/>
                    <password/>
                    <publickey/>
                    <privatekey/>
                    <port/>
                    <description/>
                    <inventory_link>0</inventory_link>
                    <applications>
                        <application>
                            <name>ZooKeeper Status</name>
                        </application>
                    </applications>
                    <valuemap/>
                    <logtimefmt/>
                </item>
                <item>
                    <name>zookeeper outstanding requests</name>
                    <type>2</type>
                    <snmp_community/>
                    <multiplier>0</multiplier>
                    <snmp_oid/>
                    <key>zookeeper.status[zk_outstanding_requests]</key>
                    <delay>10</delay>
                    <history>90</history>
                    <trends>365</trends>
                    <status>0</status>
                    <value_type>3</value_type>
                    <allowed_hosts/>
                    <units/>
                    <delta>0</delta>
                    <snmpv3_contextname/>
                    <snmpv3_securityname/>
                    <snmpv3_securitylevel>0</snmpv3_securitylevel>
                    <snmpv3_authprotocol>0</snmpv3_authprotocol>
                    <snmpv3_authpassphrase/>
                    <snmpv3_privprotocol>0</snmpv3_privprotocol>
                    <snmpv3_privpassphrase/>
                    <formula>1</formula>
                    <delay_flex/>
                    <params/>
                    <ipmi_sensor/>
                    <data_type>0</data_type>
                    <authtype>0</authtype>
                    <username/>
                    <password/>
                    <publickey/>
                    <privatekey/>
                    <port/>
                    <description/>
                    <inventory_link>0</inventory_link>
                    <applications>
                        <application>
                            <name>ZooKeeper Status</name>
                        </application>
                    </applications>
                    <valuemap/>
                    <logtimefmt/>
                </item>
                <item>
                    <name>zookeeper packages received</name>
                    <type>2</type>
                    <snmp_community/>
                    <multiplier>0</multiplier>
                    <snmp_oid/>
                    <key>zookeeper.status[zk_packets_received]</key>
                    <delay>10</delay>
                    <history>90</history>
                    <trends>365</trends>
                    <status>0</status>
                    <value_type>3</value_type>
                    <allowed_hosts/>
                    <units/>
                    <delta>0</delta>
                    <snmpv3_contextname/>
                    <snmpv3_securityname/>
                    <snmpv3_securitylevel>0</snmpv3_securitylevel>
                    <snmpv3_authprotocol>0</snmpv3_authprotocol>
                    <snmpv3_authpassphrase/>
                    <snmpv3_privprotocol>0</snmpv3_privprotocol>
                    <snmpv3_privpassphrase/>
                    <formula>1</formula>
                    <delay_flex/>
                    <params/>
                    <ipmi_sensor/>
                    <data_type>0</data_type>
                    <authtype>0</authtype>
                    <username/>
                    <password/>
                    <publickey/>
                    <privatekey/>
                    <port/>
                    <description>收包数量</description>
                    <inventory_link>0</inventory_link>
                    <applications>
                        <application>
                            <name>ZooKeeper Status</name>
                        </application>
                    </applications>
                    <valuemap/>
                    <logtimefmt/>
                </item>
                <item>
                    <name>zookeeper packages sent</name>
                    <type>2</type>
                    <snmp_community/>
                    <multiplier>0</multiplier>
                    <snmp_oid/>
                    <key>zookeeper.status[zk_packets_sent]</key>
                    <delay>10</delay>
                    <history>90</history>
                    <trends>365</trends>
                    <status>0</status>
                    <value_type>3</value_type>
                    <allowed_hosts/>
                    <units/>
                    <delta>0</delta>
                    <snmpv3_contextname/>
                    <snmpv3_securityname/>
                    <snmpv3_securitylevel>0</snmpv3_securitylevel>
                    <snmpv3_authprotocol>0</snmpv3_authprotocol>
                    <snmpv3_authpassphrase/>
                    <snmpv3_privprotocol>0</snmpv3_privprotocol>
                    <snmpv3_privpassphrase/>
                    <formula>1</formula>
                    <delay_flex/>
                    <params/>
                    <ipmi_sensor/>
                    <data_type>0</data_type>
                    <authtype>0</authtype>
                    <username/>
                    <password/>
                    <publickey/>
                    <privatekey/>
                    <port/>
                    <description>发包数据量</description>
                    <inventory_link>0</inventory_link>
                    <applications>
                        <application>
                            <name>ZooKeeper Status</name>
                        </application>
                    </applications>
                    <valuemap/>
                    <logtimefmt/>
                </item>
                <item>
                    <name>zookeeper leader's pending syncs</name>
                    <type>2</type>
                    <snmp_community/>
                    <multiplier>0</multiplier>
                    <snmp_oid/>
                    <key>zookeeper.status[zk_pending_syncs]</key>
                    <delay>10</delay>
                    <history>90</history>
                    <trends>365</trends>
                    <status>0</status>
                    <value_type>3</value_type>
                    <allowed_hosts/>
                    <units/>
                    <delta>0</delta>
                    <snmpv3_contextname/>
                    <snmpv3_securityname/>
                    <snmpv3_securitylevel>0</snmpv3_securitylevel>
                    <snmpv3_authprotocol>0</snmpv3_authprotocol>
                    <snmpv3_authpassphrase/>
                    <snmpv3_privprotocol>0</snmpv3_privprotocol>
                    <snmpv3_privpassphrase/>
                    <formula>1</formula>
                    <delay_flex/>
                    <params/>
                    <ipmi_sensor/>
                    <data_type>0</data_type>
                    <authtype>0</authtype>
                    <username/>
                    <password/>
                    <publickey/>
                    <privatekey/>
                    <port/>
                    <description/>
                    <inventory_link>0</inventory_link>
                    <applications>
                        <application>
                            <name>ZooKeeper Status</name>
                        </application>
                    </applications>
                    <valuemap/>
                    <logtimefmt/>
                </item>
                <item>
                    <name>zookeeper response checking</name>
                    <type>2</type>
                    <snmp_community/>
                    <multiplier>0</multiplier>
                    <snmp_oid/>
                    <key>zookeeper.status[zk_server_ruok]</key>
                    <delay>10</delay>
                    <history>90</history>
                    <trends>0</trends>
                    <status>0</status>
                    <value_type>1</value_type>
                    <allowed_hosts/>
                    <units/>
                    <delta>0</delta>
                    <snmpv3_contextname/>
                    <snmpv3_securityname/>
                    <snmpv3_securitylevel>0</snmpv3_securitylevel>
                    <snmpv3_authprotocol>0</snmpv3_authprotocol>
                    <snmpv3_authpassphrase/>
                    <snmpv3_privprotocol>0</snmpv3_privprotocol>
                    <snmpv3_privpassphrase/>
                    <formula>1</formula>
                    <delay_flex/>
                    <params/>
                    <ipmi_sensor/>
                    <data_type>0</data_type>
                    <authtype>0</authtype>
                    <username/>
                    <password/>
                    <publickey/>
                    <privatekey/>
                    <port/>
                    <description/>
                    <inventory_link>0</inventory_link>
                    <applications>
                        <application>
                            <name>ZooKeeper Status</name>
                        </application>
                    </applications>
                    <valuemap/>
                    <logtimefmt/>
                </item>
                <item>
                    <name>zookeeper state role</name>
                    <type>2</type>
                    <snmp_community/>
                    <multiplier>0</multiplier>
                    <snmp_oid/>
                    <key>zookeeper.status[zk_server_state]</key>
                    <delay>10</delay>
                    <history>90</history>
                    <trends>0</trends>
                    <status>0</status>
                    <value_type>1</value_type>
                    <allowed_hosts/>
                    <units/>
                    <delta>0</delta>
                    <snmpv3_contextname/>
                    <snmpv3_securityname/>
                    <snmpv3_securitylevel>0</snmpv3_securitylevel>
                    <snmpv3_authprotocol>0</snmpv3_authprotocol>
                    <snmpv3_authpassphrase/>
                    <snmpv3_privprotocol>0</snmpv3_privprotocol>
                    <snmpv3_privpassphrase/>
                    <formula>1</formula>
                    <delay_flex/>
                    <params/>
                    <ipmi_sensor/>
                    <data_type>0</data_type>
                    <authtype>0</authtype>
                    <username/>
                    <password/>
                    <publickey/>
                    <privatekey/>
                    <port/>
                    <description/>
                    <inventory_link>0</inventory_link>
                    <applications>
                        <application>
                            <name>ZooKeeper Status</name>
                        </application>
                    </applications>
                    <valuemap/>
                    <logtimefmt/>
                </item>
                <item>
                    <name>zookeeper leader's synced followers</name>
                    <type>2</type>
                    <snmp_community/>
                    <multiplier>0</multiplier>
                    <snmp_oid/>
                    <key>zookeeper.status[zk_synced_followers]</key>
                    <delay>10</delay>
                    <history>90</history>
                    <trends>365</trends>
                    <status>0</status>
                    <value_type>3</value_type>
                    <allowed_hosts/>
                    <units/>
                    <delta>0</delta>
                    <snmpv3_contextname/>
                    <snmpv3_securityname/>
                    <snmpv3_securitylevel>0</snmpv3_securitylevel>
                    <snmpv3_authprotocol>0</snmpv3_authprotocol>
                    <snmpv3_authpassphrase/>
                    <snmpv3_privprotocol>0</snmpv3_privprotocol>
                    <snmpv3_privpassphrase/>
                    <formula>1</formula>
                    <delay_flex/>
                    <params/>
                    <ipmi_sensor/>
                    <data_type>0</data_type>
                    <authtype>0</authtype>
                    <username/>
                    <password/>
                    <publickey/>
                    <privatekey/>
                    <port/>
                    <description/>
                    <inventory_link>0</inventory_link>
                    <applications>
                        <application>
                            <name>ZooKeeper Status</name>
                        </application>
                    </applications>
                    <valuemap/>
                    <logtimefmt/>
                </item>
                <item>
                    <name>zookeeper version</name>
                    <type>2</type>
                    <snmp_community/>
                    <multiplier>0</multiplier>
                    <snmp_oid/>
                    <key>zookeeper.status[zk_version]</key>
                    <delay>10</delay>
                    <history>90</history>
                    <trends>0</trends>
                    <status>0</status>
                    <value_type>1</value_type>
                    <allowed_hosts/>
                    <units/>
                    <delta>0</delta>
                    <snmpv3_contextname/>
                    <snmpv3_securityname/>
                    <snmpv3_securitylevel>0</snmpv3_securitylevel>
                    <snmpv3_authprotocol>0</snmpv3_authprotocol>
                    <snmpv3_authpassphrase/>
                    <snmpv3_privprotocol>0</snmpv3_privprotocol>
                    <snmpv3_privpassphrase/>
                    <formula>1</formula>
                    <delay_flex/>
                    <params/>
                    <ipmi_sensor/>
                    <data_type>0</data_type>
                    <authtype>0</authtype>
                    <username/>
                    <password/>
                    <publickey/>
                    <privatekey/>
                    <port/>
                    <description/>
                    <inventory_link>0</inventory_link>
                    <applications>
                        <application>
                            <name>ZooKeeper Status</name>
                        </application>
                    </applications>
                    <valuemap/>
                    <logtimefmt/>
                </item>
                <item>
                    <name>zookeeper watches count</name>
                    <type>2</type>
                    <snmp_community/>
                    <multiplier>0</multiplier>
                    <snmp_oid/>
                    <key>zookeeper.status[zk_watch_count]</key>
                    <delay>10</delay>
                    <history>90</history>
                    <trends>365</trends>
                    <status>0</status>
                    <value_type>3</value_type>
                    <allowed_hosts/>
                    <units/>
                    <delta>0</delta>
                    <snmpv3_contextname/>
                    <snmpv3_securityname/>
                    <snmpv3_securitylevel>0</snmpv3_securitylevel>
                    <snmpv3_authprotocol>0</snmpv3_authprotocol>
                    <snmpv3_authpassphrase/>
                    <snmpv3_privprotocol>0</snmpv3_privprotocol>
                    <snmpv3_privpassphrase/>
                    <formula>1</formula>
                    <delay_flex/>
                    <params/>
                    <ipmi_sensor/>
                    <data_type>0</data_type>
                    <authtype>0</authtype>
                    <username/>
                    <password/>
                    <publickey/>
                    <privatekey/>
                    <port/>
                    <description/>
                    <inventory_link>0</inventory_link>
                    <applications>
                        <application>
                            <name>ZooKeeper Status</name>
                        </application>
                    </applications>
                    <valuemap/>
                    <logtimefmt/>
                </item>
                <item>
                    <name>zookeeper znodes count</name>
                    <type>2</type>
                    <snmp_community/>
                    <multiplier>0</multiplier>
                    <snmp_oid/>
                    <key>zookeeper.status[zk_znode_count]</key>
                    <delay>10</delay>
                    <history>90</history>
                    <trends>365</trends>
                    <status>0</status>
                    <value_type>3</value_type>
                    <allowed_hosts/>
                    <units/>
                    <delta>0</delta>
                    <snmpv3_contextname/>
                    <snmpv3_securityname/>
                    <snmpv3_securitylevel>0</snmpv3_securitylevel>
                    <snmpv3_authprotocol>0</snmpv3_authprotocol>
                    <snmpv3_authpassphrase/>
                    <snmpv3_privprotocol>0</snmpv3_privprotocol>
                    <snmpv3_privpassphrase/>
                    <formula>1</formula>
                    <delay_flex/>
                    <params/>
                    <ipmi_sensor/>
                    <data_type>0</data_type>
                    <authtype>0</authtype>
                    <username/>
                    <password/>
                    <publickey/>
                    <privatekey/>
                    <port/>
                    <description/>
                    <inventory_link>0</inventory_link>
                    <applications>
                        <application>
                            <name>ZooKeeper Status</name>
                        </application>
                    </applications>
                    <valuemap/>
                    <logtimefmt/>
                </item>
            </items>
            <discovery_rules/>
            <macros/>
            <templates/>
            <screens/>
        </template>
    </templates>
    <triggers>
        <trigger>
            <expression>{Zookeeper:zookeeper.status[zk_outstanding_requests].last()}&gt;10</expression>
            <name>big outstanding requests number</name>
            <url/>
            <status>0</status>
            <priority>0</priority>
            <description/>
            <type>0</type>
            <dependencies/>
        </trigger>
        <trigger>
            <expression>{Zookeeper:zookeeper.status[zk_pending_syncs].last()}&gt;10</expression>
            <name>big pending syncs</name>
            <url/>
            <status>0</status>
            <priority>0</priority>
            <description/>
            <type>0</type>
            <dependencies/>
        </trigger>
        <trigger>
            <expression>{Zookeeper:zookeeper.status[zk_avg_latency].last()}&gt;10</expression>
            <name>large average latency</name>
            <url/>
            <status>0</status>
            <priority>0</priority>
            <description/>
            <type>0</type>
            <dependencies/>
        </trigger>
        <trigger>
            <expression>{Zookeeper:zookeeper.status[zk_open_file_descriptor_count].last()} &gt; {Zookeeper:zookeeper.status[zk_max_file_descriptor_count].last()}*0.85</expression>
            <name>large file descriptor used</name>
            <url/>
            <status>0</status>
            <priority>0</priority>
            <description/>
            <type>0</type>
            <dependencies/>
        </trigger>
        <trigger>
            <expression>{Zookeeper:zookeeper.status[zk_server_ruok].str(imok)}&lt;&gt;1</expression>
            <name>zookeeper is abnormal</name>
            <url/>
            <status>0</status>
            <priority>4</priority>
            <description/>
            <type>0</type>
            <dependencies/>
        </trigger>
        <trigger>
            <expression>{Zookeeper:zookeeper.status[alive].last()}=0</expression>
            <name>zookeeper is not running</name>
            <url/>
            <status>0</status>
            <priority>4</priority>
            <description/>
            <type>0</type>
            <dependencies/>
        </trigger>
        <trigger>
            <expression>{Zookeeper:zookeeper.status[zk_server_state].abschange()}&gt;0</expression>
            <name>zookeeper state role has been changed</name>
            <url/>
            <status>0</status>
            <priority>1</priority>
            <description/>
            <type>0</type>
            <dependencies/>
        </trigger>
    </triggers>
    <graphs>
        <graph>
            <name>ZooKeeper Alive Connections</name>
            <width>900</width>
            <height>200</height>
            <yaxismin>0.0000</yaxismin>
            <yaxismax>100.0000</yaxismax>
            <show_work_period>1</show_work_period>
            <show_triggers>1</show_triggers>
            <type>0</type>
            <show_legend>1</show_legend>
            <show_3d>0</show_3d>
            <percent_left>0.0000</percent_left>
            <percent_right>0.0000</percent_right>
            <ymin_type_1>0</ymin_type_1>
            <ymax_type_1>0</ymax_type_1>
            <ymin_item_1>0</ymin_item_1>
            <ymax_item_1>0</ymax_item_1>
            <graph_items>
                <graph_item>
                    <sortorder>0</sortorder>
                    <drawtype>0</drawtype>
                    <color>1A7C11</color>
                    <yaxisside>0</yaxisside>
                    <calc_fnc>2</calc_fnc>
                    <type>0</type>
                    <item>
                        <host>Zookeeper</host>
                        <key>zookeeper.status[zk_num_alive_connections]</key>
                    </item>
                </graph_item>
            </graph_items>
        </graph>
        <graph>
            <name>ZooKeeper Latency</name>
            <width>900</width>
            <height>200</height>
            <yaxismin>0.0000</yaxismin>
            <yaxismax>100.0000</yaxismax>
            <show_work_period>1</show_work_period>
            <show_triggers>1</show_triggers>
            <type>0</type>
            <show_legend>1</show_legend>
            <show_3d>0</show_3d>
            <percent_left>0.0000</percent_left>
            <percent_right>0.0000</percent_right>
            <ymin_type_1>0</ymin_type_1>
            <ymax_type_1>0</ymax_type_1>
            <ymin_item_1>0</ymin_item_1>
            <ymax_item_1>0</ymax_item_1>
            <graph_items>
                <graph_item>
                    <sortorder>0</sortorder>
                    <drawtype>0</drawtype>
                    <color>1A7C11</color>
                    <yaxisside>0</yaxisside>
                    <calc_fnc>2</calc_fnc>
                    <type>0</type>
                    <item>
                        <host>Zookeeper</host>
                        <key>zookeeper.status[zk_avg_latency]</key>
                    </item>
                </graph_item>
            </graph_items>
        </graph>
    </graphs>
</zabbix_export>
```

  

然后导入模板。

![image.png](assets/监控与可观测性/zabbix监控zookeeper/zabbix监控zookeeper-1.png)

  

效果图：

![image.png](assets/监控与可观测性/zabbix监控zookeeper/zabbix监控zookeeper-2.png)