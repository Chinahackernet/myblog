## 什么是NSQ

NSQ就是一个简单的队列，是用Golang开发，它类似于kafka、MQ。

下面附一张对比图（图片来自golang2017开发者大会）：

![](assets/go开发/第三章_操作NSQ/第三章_操作NSQ-1.png)

从上面图来看，NSQ完爆其他两种中间件（虽然我觉得有点吹牛逼的感觉）。

  

## NSQ的优势

NSQ的优势主要有以下几点：

-   支持拓扑的高可用性和避免单点故障(SPOFs)。
-   更强的消息递交保证
-   为单次处理绑定着内存的足迹(通过把一些持久话的消息放入磁盘)
-   对生产者和消费者的配置进行极大的简化
-   提供直接的升级路径
-   提升效率

  

## NSQ的组成

NSQ由三个组件组成，它们是：

-   nsqd 用于接收消息，排队消息，投递消息，我们的客户端(生产者，消费者)主要和它打交道
-   nsqlookupd 管理nsqd,nsqadmin拓扑信息。 我们的客户端(消费者)询问此组件来发现nsqd等
-   nsqadmin web UI 查询各种NSQ组件的信息，消息信息

  

### nsqlookupd

nsqlookupd是守护进程负责管理拓扑信息。客户端通过查询 nsqlookupd 来发现指定话题（topic）的生产者，并且 nsqd 节点广播话题（topic）和通道（channel）信息

简单的说nsqlookupd就是中心管理服务，它使用tcp(默认端口4160)管理nsqd服务，使用http(默认端口4161)管理nsqadmin服务。同时为客户端提供查询功能

总的来说，nsqlookupd具有以下功能或特性

-   唯一性，在一个Nsq服务中只有一个nsqlookupd服务。当然也可以在集群中部署多个nsqlookupd，但它们之间是没有关联的
-   去中心化，即使nsqlookupd崩溃，也会不影响正在运行的nsqd服务
-   充当nsqd和naqadmin信息交互的中间件
-   提供一个http查询服务，给客户端定时更新nsqd的地址目录 

  

### nsqadmin

nsqadmin是一套 WEB UI，用来汇集集群的实时统计，并执行不同的管理任务

总的来说，nsqadmin具有以下功能或特性

-   提供一个对topic和channel统一管理的操作界面以及各种实时监控数据的展示，界面设计的很简洁，操作也很简单
-   展示所有message的数量，恩....装X利器
-   能够在后台创建topic和channel，这个应该不常用到
-   nsqadmin的所有功能都必须依赖于nsqlookupd，nsqadmin只是向nsqlookupd传递用户操作并展示来自nsqlookupd的数据

nsqadmin默认的访问地址是[http://127.0.0.1:4171/](http://127.0.0.1:4171/)

### nsqd

nsqd 是一个守护进程，负责接收，排队，投递消息给客户端

简单的说，真正干活的就是这个服务，它主要负责message的收发，队列的维护。nsqd会默认监听一个tcp端口(4150)和一个http端口(4151)以及一个可选的https端口

总的来说，nsqd 具有以下功能或特性

-   对订阅了同一个topic，同一个channel的消费者使用负载均衡策略（不是轮询）
-   只要channel存在，即使没有该channel的消费者，也会将生产者的message缓存到队列中（注意消息的过期处理）
-   保证队列中的message至少会被消费一次，即使nsqd退出，也会将队列中的消息暂存磁盘上(结束进程等意外情况除外)
-   限定内存占用，能够配置nsqd中每个channel队列在内存中缓存的message数量，一旦超出，message将被缓存到磁盘中
-   topic，channel一旦建立，将会一直存在，要及时在管理台或者用代码清除无效的topic和channel，避免资源的浪费

  

每个nsqd实例旨在一次处理多个数据流。这些数据流称为`“topics”`，一个`topic`具有1个或多个`“channels”`。每个`channel`都会收到`topic`所有消息的副本，实际上下游的服务是通过对应的`channel`来消费`topic`消息。

`topic`和`channel`不是预先配置的。`topic`在首次使用时创建，方法是将其发布到指定`topic`，或者订阅指定`topic`上的`channel`。`channel`是通过订阅指定的`channel`在第一次使用时创建的。

`topic`和`channel`都相互独立地缓冲数据，防止缓慢的消费者导致其他`chennel`的积压（同样适用于`topic`级别）。

`channel`可以并且通常会连接多个客户端。假设所有连接的客户端都处于准备接收消息的状态，则每条消息将被传递到随机客户端。例如：

![](assets/go开发/第三章_操作NSQ/第三章_操作NSQ-2.gif)

  

## NSQ的使用步骤

NSQ的使用步骤如下：

1.  启动nsqlookupd组件
2.  启动nsqd并向nsqlookupd注册
3.  启动nsqadmin并向nsqlookupd注册
4.  生产者推送一个message到其中一个nsqd，并将此消息设置到一个topic里面
5.  消费者向nsqlookupd询问指定topic的消息，nsqlookupd把有此topic的nsqd地址给到消费者
6.  消费者建立channel和topic之间的订阅关系，通过channel向nsqd获取指定topic里面的消息
7.  nsqd向所有订阅该topic的channel推送message， 然后其中一个消费者可以通过其中一个channel获取该topic的message

如图：

![image.png](assets/go开发/第三章_操作NSQ/第三章_操作NSQ-3.png)

  

## 搭建服务端NSQ

下载[二进制包](https://github.com/nsqio/nsq/releases)，按着上面的顺序启动服务。

  

比如我这里在Linux上搭建：

```shell
# 下载二进制包
wget https://github.com/nsqio/nsq/releases/download/v1.2.0/nsq-1.2.0.linux-amd64.go1.12.9.tar.gz

# 解压包
nsq-1.2.0.linux-amd64.go1.12.9.tar.gz

# 启动nsqlookud
./nsqlookupd

# 启动nsqd，并接入刚刚启动的nsqlookud
./nsqd --lookupd-tcp-address=127.0.0.1:4160 -tcp-address=0.0.0.0:4152 -http-address=0.0.0.0:4153

# 启动nqsadmin
./nsqadmin --lookupd-http-address=127.0.0.1:4161
```

  

> 更多配置项可以使用 二进制文件 --help

  

浏览器输入：http://IP:4171 访问WEB UI，如下：

![image.png](assets/go开发/第三章_操作NSQ/第三章_操作NSQ-4.png)

  

## 客户端使用NSQ

官方提供了Go语言版的客户端：[go-nsq](https://github.com/nsqio/go-nsq)，更多客户端支持请查看[CLIENT LIBRARIES](https://nsq.io/clients/client_libraries.html)。

### 安装

```go
go get -u github.com/nsqio/go-nsq
```

  

### 生成者

```go
package main

import (
	"bufio"
	"fmt"
	"os"
	"strings"

	"github.com/nsqio/go-nsq"
)

// 定义一个全局的producer
var producer *nsq.Producer

// 初始化生成者
func initProducer(nsqAddr string) (err error) {
	producer, err = nsq.NewProducer(nsqAddr, nsq.NewConfig())
	if err != nil {
		fmt.Println("创建producer失败. err:", err)
		return
	}
	return
}

func main() {
	//初始化生成者
	nsqAddr := "122.51.79.172:4152"
	err := initProducer(nsqAddr)
	if err != nil {
		fmt.Println("producer初始化失败. err:", err)
		return
	}

	reader := bufio.NewReader(os.Stdin)
	for {
		data, err := reader.ReadString('\n')
		if err != nil {
			fmt.Printf("read string from stdin failed, err:%v\n", err)
			continue
		}
		data = strings.TrimSpace(data)
		if strings.ToUpper(data) == "Q" { // 输入Q退出
			break
		}
		// 向 'topic_demo' publish 数据
		err = producer.Publish("topic_demo", []byte(data))
		if err != nil {
			fmt.Printf("publish msg to nsq failed, err:%v\n", err)
			continue
		}
	}
}

```

  

`go build`运行二进制文件，输入如下：

```go
 .\producer.exe
11
2020/03/26 15:13:08 INF    1 (192.168.1.12:4152) connecting to nsqd
22
33
44
```

  

然后在网页上看到创建的topic，如下：

![image.png](assets/go开发/第三章_操作NSQ/第三章_操作NSQ-5.png)

  

点击topic可以看到里面的消息信息：

![image.png](assets/go开发/第三章_操作NSQ/第三章_操作NSQ-6.png)

  

在Nodes界面可以看到当前接入`lookupd`的`nsqd`节点：

![image.png](assets/go开发/第三章_操作NSQ/第三章_操作NSQ-7.png)

  

在Counter页面显示了处理的消息数量，因为我们没有接入消费者，所以处理的消息数量为0:

![image.png](assets/go开发/第三章_操作NSQ/第三章_操作NSQ-8.png)

  

在Lookup页面支持创建topic和channel：

![image.png](assets/go开发/第三章_操作NSQ/第三章_操作NSQ-9.png)

  

### 消费者

```go
// nsq_consumer/main.go
package main

import (
	"fmt"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/nsqio/go-nsq"
)

// NSQ Consumer Demo

// MyHandler 是一个消费者类型
type MyHandler struct {
	Title string
}

// HandleMessage 是需要实现的处理消息的方法
func (m *MyHandler) HandleMessage(msg *nsq.Message) (err error) {
	fmt.Printf("%s recv from %v, msg:%v\n", m.Title, msg.NSQDAddress, string(msg.Body))
	return
}

// 初始化消费者
func initConsumer(topic string, channel string, address string) (err error) {
	config := nsq.NewConfig()
	config.LookupdPollInterval = 15 * time.Second
	c, err := nsq.NewConsumer(topic, channel, config)
	if err != nil {
		fmt.Printf("create consumer failed, err:%v\n", err)
		return
	}
	consumer := &MyHandler{
		Title: "测试",
	}
	c.AddHandler(consumer)

	if err := c.ConnectToNSQD(address); err != nil { // 直接连NSQD
		// if err := c.ConnectToNSQLookupd(address); err != nil { // 通过lookupd查询
		return err
	}
	return nil

}

func main() {
	err := initConsumer("topic_demo", "first", "122.51.79.172:4152")
	if err != nil {
		fmt.Printf("init consumer failed, err:%v\n", err)
		return
	}
	c := make(chan os.Signal)        // 定义一个信号的通道
	signal.Notify(c, syscall.SIGINT) // 转发键盘中断信号到c
	<-c                              // 阻塞
}

```