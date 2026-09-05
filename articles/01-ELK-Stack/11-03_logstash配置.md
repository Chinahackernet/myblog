# logstash配置

> 分类：ELK Stack / 第11章：Logstash
> 原文：https://www.cuiliangblog.cn/detail/section/31174745
> 来源：崔亮的博客

---

# 命令行参数
## -e：执行
  
这个参数的默认值是下面这样：

```json
input { stdin { } } output { stdout {} }
```

## <font style="background-color:transparent;">-f：指定文件</font>
<font style="background-color:transparent;">或者使用--config</font>

• 通过bin/logstash-f agent.conf来运行指定配置文件。  
• 直接用bin/logstash-f/etc/logstash.d/来运行。Logstash会自动读取/etc/logstash.d/目录下所有的文本文件，然后拼接成一个完整的大配置文件，再去执行。  
• Logstash列出目录下所有文件时是字母排序的。所以顺序非常重要。推荐采用数字编号方式命名配置文件。

## -r：监听重载
或者使用--reload

当pipeline文件发生变化时，会自动reload服务。

## -t：测试配置文件
或者使用--configtest

用来测试Logstash读取到的配置文件语法是否能正常解析。

## -l：输出日志
或者使用--log  
Logstash默认输出日志到标准错误。可以通过bin/logstash-l logs/logstash.log命令来统一存储日志。

## -w：设置线程数
或者使用--pipeline-workers  
运行filter和output的pipeline线程数量，默认是CPU核数。

## -b：积累日志数
或者使用--pipeline-batch-size  
每个Logstash pipeline线程，在执行具体的filter和output函数之前，最多能累积的日志条数，默认是125条。

## -u：打包日志等待时间
或者使用--pipeline-batch-delay  
每个Logstash pipeline线程，在打包批量日志的时候，最多等待几毫秒，默认是5 ms。

## -p：加载插件
或者使用--pluginpath  
可以写自己的插件，然后用bin/logstash——pluginpath/path/to/own/plugins加载它们。

## --config.debug：调试
  
将完整编译的配置显示为调试日志消息（还必须--log.level=debug启用）

# 配置文件参数
可参考官方文档，地址为：[https://www.elastic.co/guide/en/logstash/8.8/logstash-settings-file.html](https://www.elastic.co/guide/en/logstash/8.8/logstash-settings-file.html)

## 常用配置参数
```json
#使用分层表单来设置管道的批处理大小和批处理延迟
   pipeline:
     batch:
       size: 125        #管道批处理大小
       delay: 5             #管道批处理延迟
 
#若要表示与平面键相同的值：
   pipeline.batch.size: 125
   pipeline.batch.delay: 5
 
 
#节点名称，在集群中具备唯一性，默认为logstash主机的主机名
node.name: logstast-node1
 
#logstash及其插件所使用的数据路径，默认路径为logstash家目录下的data目录
path.data: /usr/local/logstash-7.0.0/data/
 
#管道的ID，默认为main
pipeline.id: main
 
#输入、输出及过滤器的总工作数量，也就是logstash的工作进程，此工作进程默认为主机的cpu核心数量
pipeline.workers: 16 
 
#在输入阶段，单个工作线程将从输入中收集的最大事件数，此事件数堆内存开销较大，内存开销可在jvm.options中设置堆内存大小来优化此选项
pipeline.batch.size: 125
 
#在将一个较小的批发送到filters+output之前,轮询下一个事件时等待的时间(以毫秒为单位)
pipeline.batch.delay: 50
 
#设置为true时，在强制关闭logstash期间，即使内存中还有事件，那么为true将会强制关闭，导致数据丢失；默认为false，false在强制关闭logstash期间，将拒绝退出，直到所有在管道中的事件被安全输出，再关闭。
pipeline.unsafe_shutdown: false
 
#指定管道配置的目录，在此目录下的所有管道配置文件都将被logstash读取，除管道配置外，不要放任何文件
path.config: /usr/local/logstash-7.0.0/conf.d/
 
#在启动时，测试配置是否有效并退出，检测配置文件是否正确，包括检测管道配置文件，默认为false
config.test_and_exit: true
 
#定期检查配置是否更改并重新加载管道，默认为false
config.reload.automatic: true
 
#logstash间隔多久检查一次配置中的更改，默认为3秒
config.reload.interval: 600s
 
#设置为true时，将完全编译的配置显示为调试日志消息
config.debug: false
 
#用于事件缓冲的内部排队模型;可以指定内存memory或者磁盘persisted，内存处理速度相对磁盘来说效率要高，默认为内存
queue.type: memory
 
#启用持久队列时将存储数据文件的目录路径,默认为logstash路径下的queue
path.queue: /usr/local/logstash-7.0.0/queue/
 
#启用持久队列时使用的页面数据文件的大小(queue.type: persisted)队列数据由分成页面的仅附加数据文件组成
queue.page_capacity: 64mb
 
#启用持久队列时队列中未读事件的最大数量(queue.type: persisted)，默认为0，0为无限制
queue.max_events: 0
 
#队列的总容量，以字节数表示，默认为1G，根据业务需求而定
queue.max_bytes: 1024mb
 
#启用持久队列时强制检查点之前最大的ACK事件数量(queue.type: persisted)，设置为0，表示无限制，默认为1024
queue.checkpoint.acks: 1024
 
#启用持久队列时强制检查点之前写入事件的最大数量(queue,type: persisted)，设置为0，表示无限制，默认为1024
queue.checkpoint.writes: 1024
 
#启用持久队列(queue,type: persisted)，强制在头部页面上设置检查点的间隔(以毫秒为单位)，有周期性检查点的默认值是1000毫秒
queue.checkpoint.interval: 1000
 
#用于指示logstast启用插件支持DLQ功能的标志，默认为false
dead_letter_queue.enable: false
 
#每个死信队列的最大大小，如果条目超过此设置会增加死信队列的大小，则会删除条目，默认为1024mb
dead_letter_queue.max_bytes: 1024mb
 
#为死信队列存储数据文件的目录路径
path.dead_letter_queue: /usr/local/logstash-7.0.0/letter-queue
 
#度量标准REST端点的绑定地址，默认为127.0.0.1
http.host: "127.0.0.1"
 
#度量标准REST端点的绑定端口，默认为9600
http.port: 9600
 
#日志级别，可以设置为以下几种级别，默认为info
log.level: info
           fatal
           error
           warn
           info (default)
           debug
           trace
 
#logstash日志目录位置，默认为logstash路径下的logs
path.logs: /usr/local/logstash-7.0.0/logs
 
 
#logstash插件路径
path.plugins: []
```


