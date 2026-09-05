# pipeline调试

> 分类：ELK Stack / 第11章：Logstash
> 原文：https://www.cuiliangblog.cn/detail/section/133531983
> 来源：崔亮的博客

---

在logstash配置中，经常需要多次反复修改filter规则配置才能达到预期效果，因此如何快速进行pipeline的调试显得尤为重要。

# 准备原始数据文件
```bash
# vim /tmp/demo.log
{"@timestamp":"2023-07-19T08:49:17+08:00","server_addr":"172.28.8.169","remote_addr":"112.30.57.100","host":"www.cuiliangblog.cn","uri":"/assets/Home.909aa1a3.js","body_bytes_sent":3298,"request":"GET /assets/Home.909aa1a3.js HTTP/2.0","request_length":76,"request_time":0.001,"status":"200","http_referer":"","http_x_forwarded_for":"","http_user_agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36"}
{"@timestamp":"2023-07-19T08:49:17+08:00","server_addr":"172.28.8.169","remote_addr":"112.30.57.100","host":"www.cuiliangblog.cn","uri":"/assets/Loading.d4acccb9.css","body_bytes_sent":155,"request":"GET /assets/Loading.d4acccb9.css HTTP/2.0","request_length":37,"request_time":0.001,"status":"200","http_referer":"https://www.cuiliangblog.cn/","http_x_forwarded_for":"","http_user_agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36"}
{"@timestamp":"2023-07-19T08:49:17+08:00","server_addr":"172.28.8.169","remote_addr":"112.30.57.100","host":"www.cuiliangblog.cn","uri":"/assets/Loading.ddc8df8c.js","body_bytes_sent":607,"request":"GET /assets/Loading.ddc8df8c.js HTTP/2.0","request_length":36,"request_time":0.001,"status":"200","http_referer":"","http_x_forwarded_for":"","http_user_agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36"}
{"@timestamp":"2023-07-19T08:49:17+08:00","server_addr":"172.28.8.169","remote_addr":"112.30.57.100","host":"www.cuiliangblog.cn","uri":"/assets/Aside.d54f38e4.js","body_bytes_sent":8943,"request":"GET /assets/Aside.d54f38e4.js HTTP/2.0","request_length":35,"request_time":0.000,"status":"200","http_referer":"","http_x_forwarded_for":"","http_user_agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36"}
{"@timestamp":"2023-07-19T08:49:17+08:00","server_addr":"172.28.8.169","remote_addr":"112.30.57.100","host":"www.cuiliangblog.cn","uri":"/assets/ArticleItem.4fb45ea7.js","body_bytes_sent":1696,"request":"GET /assets/ArticleItem.4fb45ea7.js HTTP/2.0","request_length":39,"request_time":0.000,"status":"200","http_referer":"","http_x_forwarded_for":"","http_user_agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36"}
{"@timestamp":"2023-07-19T08:49:17+08:00","server_addr":"172.28.8.169","remote_addr":"112.30.57.100","host":"umami.cuiliangblog.cn","uri":"/api/send","body_bytes_sent":603,"request":"POST /api/send HTTP/2.0","request_length":291,"request_time":0.016,"status":"200","http_referer":"https://www.cuiliangblog.cn/","http_x_forwarded_for":"","http_user_agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36"}
{"@timestamp":"2023-07-19T08:49:17+08:00","server_addr":"172.28.8.169","remote_addr":"112.30.57.100","host":"api.cuiliangblog.cn","uri":"/v1/management/siteConfig/1/","body_bytes_sent":1098,"request":"GET /v1/management/siteConfig/1/ HTTP/2.0","request_length":37,"request_time":0.007,"status":"200","http_referer":"https://www.cuiliangblog.cn/","http_x_forwarded_for":"","http_user_agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36"}
{"@timestamp":"2023-07-19T08:49:17+08:00","server_addr":"172.28.8.169","remote_addr":"112.30.57.100","host":"api.cuiliangblog.cn","uri":"/v1/blog/category/","body_bytes_sent":290,"request":"GET /v1/blog/category/ HTTP/2.0","request_length":30,"request_time":0.010,"status":"200","http_referer":"https://www.cuiliangblog.cn/","http_x_forwarded_for":"","http_user_agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36"}
{"@timestamp":"2023-07-19T08:49:17+08:00","server_addr":"172.28.8.169","remote_addr":"112.30.57.100","host":"api.cuiliangblog.cn","uri":"/v1/blog/note/","body_bytes_sent":2613,"request":"GET /v1/blog/note/ HTTP/2.0","request_length":27,"request_time":0.011,"status":"200","http_referer":"https://www.cuiliangblog.cn/","http_x_forwarded_for":"","http_user_agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36"}
{"@timestamp":"2023-07-19T08:49:17+08:00","server_addr":"172.28.8.169","remote_addr":"112.30.57.100","host":"api.cuiliangblog.cn","uri":"/v1/blog/tag/","body_bytes_sent":240,"request":"GET /v1/blog/tag/ HTTP/2.0","request_length":27,"request_time":0.013,"status":"200","http_referer":"https://www.cuiliangblog.cn/","http_x_forwarded_for":"","http_user_agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36"}
{"@timestamp":"2023-07-19T08:49:17+08:00","server_addr":"172.28.8.169","remote_addr":"112.30.57.100","host":"api.cuiliangblog.cn","uri":"/v1/management/carousel/","body_bytes_sent":744,"request":"GET /v1/management/carousel/ HTTP/2.0","request_length":34,"request_time":0.011,"status":"200","http_referer":"https://www.cuiliangblog.cn/","http_x_forwarded_for":"","http_user_agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36"}
{"@timestamp":"2023-07-19T08:49:17+08:00","server_addr":"172.28.8.169","remote_addr":"112.30.57.100","host":"api.cuiliangblog.cn","uri":"/v1/management/siteStatistics/","body_bytes_sent":130,"request":"GET /v1/management/siteStatistics/ HTTP/2.0","request_length":38,"request_time":0.013,"status":"200","http_referer":"https://www.cuiliangblog.cn/","http_x_forwarded_for":"","http_user_agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36"}
{"@timestamp":"2023-07-19T08:49:17+08:00","server_addr":"172.28.8.169","remote_addr":"112.30.57.100","host":"api.cuiliangblog.cn","uri":"/v1/management/info/1/","body_bytes_sent":615,"request":"GET /v1/management/info/1/ HTTP/2.0","request_length":33,"request_time":0.018,"status":"200","http_referer":"https://www.cuiliangblog.cn/","http_x_forwarded_for":"","http_user_agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36"}
{"@timestamp":"2023-07-19T08:49:17+08:00","server_addr":"172.28.8.169","remote_addr":"112.30.57.100","host":"api.cuiliangblog.cn","uri":"/v1/blog/article/","body_bytes_sent":4466,"request":"GET /v1/blog/article/?page=1&size=6&ordering=-is_recommend,-created_time HTTP/2.0","request_length":66,"request_time":0.030,"status":"200","http_referer":"https://www.cuiliangblog.cn/","http_x_forwarded_for":"","http_user_agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36"}
{"@timestamp":"2023-07-19T08:49:17+08:00","server_addr":"172.28.8.169","remote_addr":"112.30.57.100","host":"api.cuiliangblog.cn","uri":"/v1/blog/article/","body_bytes_sent":2922,"request":"GET /v1/blog/article/?page=1&size=5&ordering=-created_time HTTP/2.0","request_length":56,"request_time":0.028,"status":"200","http_referer":"https://www.cuiliangblog.cn/","http_x_forwarded_for":"","http_user_agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36"}
{"@timestamp":"2023-07-19T08:49:17+08:00","server_addr":"172.28.8.169","remote_addr":"112.30.57.100","host":"api.cuiliangblog.cn","uri":"/v1/management/siteConfig/1/","body_bytes_sent":1098,"request":"GET /v1/management/siteConfig/1/ HTTP/2.0","request_length":37,"request_time":0.005,"status":"200","http_referer":"https://www.cuiliangblog.cn/","http_x_forwarded_for":"","http_user_agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36"}
{"@timestamp":"2023-07-19T08:49:17+08:00","server_addr":"172.28.8.169","remote_addr":"112.30.57.100","host":"api.cuiliangblog.cn","uri":"/v1/blog/article/","body_bytes_sent":6974,"request":"GET /v1/blog/article/?page=1&size=10&ordering=-view HTTP/2.0","request_length":52,"request_time":0.038,"status":"200","http_referer":"https://www.cuiliangblog.cn/","http_x_forwarded_for":"","http_user_agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36"}
```

# 编写pipeline
其中input指定原始数据文件的路径，output为控制台打印，并且每次重启logstash服务都可以从头开始读取文件，便于调试。

```bash
[root@huanbao ~]# vim pipeline.conf 
input {
    file {
        path => ["/tmp/demo.log"]
        type => "system"
        start_position => "beginning"
      	sincedb_path => "/dev/null"
    }
}
#filter { #过滤，对数据进行分割、截取等处理
#	...
#}
output {
    stdout {
        codec => rubydebug { } 
    }   
}
# 也可以输出至文件
output {
    file {
        path => "/tmp/logstash.txt"
        codec => line { format => "custom format: %{message}"}
    }  
}
```

# 执行（rpm方式）
-f 指定pipeline时记得使用绝对路径。-r参数可以监听pipeline文件的变化，自动reload

```bash
# logstash -r -f /root/pipeline.conf
```

# 执行（docker方式）
```bash
# 目录结构
# tree .    
.
├── config
│   └── pipeline.conf
└── input
    └── demo-log.txt
# docker run -it -v $PWD/config:/conf -v $PWD/input:/input docker.elastic.co/logstash/logstash:8.8.2 bash
# logstash@133e3afee924:/$ logstash -r -f /conf/pipeline.conf
```

 修改宿主机pipeline即可


