这里使用官方的[etcd/clientv3](https://github.com/etcd-io/etcd/tree/master/clientv3)包来连接etcd并进行相关操作。

### 安装

```plain
go get go.etcd.io/etcd/clientv3
```

### put和get操作

`put`命令用来设置键值对数据，`get`命令用来根据key获取值。

  

```go
package main

import (
	"context"
	"fmt"
	"time"
	"go.etcd.io/etcd/clientv3"
)

func main(){
	cli, err := clientv3.New(clientv3.Config{
		Endpoints:   []string{"122.51.79.172:2379"},
		DialTimeout: 5 * time.Second,
	})
	if err != nil {
		// handle error!
		fmt.Printf("connect to etcd failed, err:%v\n", err)
		return
	}
	fmt.Println("connect to etcd success")
	defer cli.Close()
	// put
	ctx, cancel := context.WithTimeout(context.Background(), time.Second)
	_, err = cli.Put(ctx, "coolops", "test")
	cancel()
	if err != nil {
		fmt.Printf("put to etcd failed, err:%v\n", err)
		return
	}
	// get
	ctx, cancel = context.WithTimeout(context.Background(), time.Second)
	resp, err := cli.Get(ctx, "coolops")
	cancel()
	if err != nil {
		fmt.Printf("get from etcd failed, err:%v\n", err)
		return
	}
	for _, ev := range resp.Kvs {
		fmt.Printf("%s:%s\n", ev.Key, ev.Value)
	}
}
```

  

### watch操作

`watch`用来获取未来更改的通知。

  

```go
package main

import (
	"context"
	"fmt"
	"time"
	"go.etcd.io/etcd/clientv3"
)

func main(){
	cli, err := clientv3.New(clientv3.Config{
		Endpoints:   []string{"122.51.79.172:2379"},
		DialTimeout: 5 * time.Second,
	})
	if err != nil {
		// handle error!
		fmt.Printf("connect to etcd failed, err:%v\n", err)
		return
	}
	fmt.Println("connect to etcd success")
	defer cli.Close()
	// watch 操作，返回的是一个通道
	rch := cli.Watch(context.Background(), "coolops") // <-chan WatchResponse
	for wresp := range rch {
		for _, ev := range wresp.Events {
			fmt.Printf("Type: %s Key:%s Value:%s\n", ev.Type, ev.Kv.Key, ev.Kv.Value)
		}
	}
}
```

  

### 安装报错：

```go
go: finding github.com/coreos/pkg latest
# github.com/coreos/etcd/clientv3/balancer/resolver/endpoint
E:\DEV\Go\pkg\mod\github.com\coreos\etcd@v3.3.19+incompatible\clientv3\balancer\resolver\endpoint\endpoint.go:114:78: undefined: resolver.BuildOption
E:\DEV\Go\pkg\mod\github.com\coreos\etcd@v3.3.19+incompatible\clientv3\balancer\resolver\endpoint\endpoint.go:182:31: undefined: resolver.ResolveNowOption
# github.com/coreos/etcd/clientv3/balancer/picker
E:\DEV\Go\pkg\mod\github.com\coreos\etcd@v3.3.19+incompatible\clientv3\balancer\picker\err.go:37:44: undefined: balancer.PickOptions
E:\DEV\Go\pkg\mod\github.com\coreos\etcd@v3.3.19+incompatible\clientv3\balancer\picker\roundrobin_balanced.go:55:54: undefined: balancer.PickOptions

```

  

解决：

将go.mod里的prpc改为1.26.0版本

```go
google.golang.org/grpc v1.26.0
```