## Redis介绍

Redis是一个开源的内存数据库，Redis提供了多种不同类型的数据结构，很多业务场景下的问题都可以很自然地映射到这些数据结构上。除此之外，通过复制、持久化和客户端分片等特性，我们可以很方便地将Redis扩展成一个能够包含数百GB数据、每秒处理上百万次请求的系统。

## Redis支持的数据结构

Redis支持诸如字符串（strings）、哈希（hashes）、列表（lists）、集合（sets）、带范围查询的排序集合（sorted sets）、位图（bitmaps）、hyperloglogs、带半径查询和流的地理空间索引等数据结构（geospatial indexes）。

## Redis应用场景

-   缓存系统，减轻主数据库（MySQL）的压力。
-   计数场景，比如微博、抖音中的关注数和粉丝数。
-   热门排行榜，需要排序的场景特别适合使用ZSET。
-   利用LIST可以实现队列的功能。

## Go操作Redis

### 安装

区别于另一个比较常用的Go语言redis client库：[redigo](https://github.com/gomodule/redigo)，我们这里采用[https://github.com/go-redis/redis](https://github.com/go-redis/redis)连接Redis数据库并进行操作，因为`go-redis`支持连接哨兵及集群模式的Redis。

使用以下命令下载并安装:

```plain
go get -u github.com/go-redis/redis
```

  

### 连接

#### 普通连接

```go
// 声明一个全局的rdb变量
var rdb *redis.Client

// 初始化连接
func initClient() (err error) {
	rdb = redis.NewClient(&redis.Options{
		Addr:     "localhost:6379",
		Password: "", // no password set
		DB:       0,  // use default DB
	})

	_, err = rdb.Ping().Result()
	if err != nil {
		return err
	}
	return nil
}
```

  

#### 连接哨兵模式

  

```go
func initClient()(err error){
	rdb := redis.NewFailoverClient(&redis.FailoverOptions{
		MasterName:    "master",
		SentinelAddrs: []string{"x.x.x.x:26379", "xx.xx.xx.xx:26379", "xxx.xxx.xxx.xxx:26379"},
	})
	_, err = rdb.Ping().Result()
	if err != nil {
		return err
	}
	return nil
}
```

  

#### 连接集群模式

```go
func initClient()(err error){
	rdb := redis.NewClusterClient(&redis.ClusterOptions{
		Addrs: []string{":7000", ":7001", ":7002", ":7003", ":7004", ":7005"},
	})
	_, err = rdb.Ping().Result()
	if err != nil {
		return err
	}
	return nil
}
```

  

### 基本使用

#### set/get

```go
func redisExample() {
	err := rdb.Set("score", 100, 0).Err()
	if err != nil {
		fmt.Printf("set score failed, err:%v\n", err)
		return
	}

	val, err := rdb.Get("score").Result()
	if err != nil {
		fmt.Printf("get score failed, err:%v\n", err)
		return
	}
	fmt.Println("score", val)

	val2, err := rdb.Get("name").Result()
	if err == redis.Nil {
		fmt.Println("name does not exist")
	} else if err != nil {
		fmt.Printf("get name failed, err:%v\n", err)
		return
	} else {
		fmt.Println("name", val2)
	}
}
```

  

#### zset

```go
func redisExample2() {
	zsetKey := "language_rank"
	languages := []*redis.Z{
		&redis.Z{Score: 90.0, Member: "Golang"},
		&redis.Z{Score: 98.0, Member: "Java"},
		&redis.Z{Score: 95.0, Member: "Python"},
		&redis.Z{Score: 97.0, Member: "JavaScript"},
		&redis.Z{Score: 99.0, Member: "C/C++"},
	}
	// ZADD
	num, err := rdb.ZAdd(zsetKey, languages...).Result()
	if err != nil {
		fmt.Printf("zadd failed, err:%v\n", err)
		return
	}
	fmt.Printf("zadd %d succ.\n", num)

	// 把Golang的分数加10
	newScore, err := rdb.ZIncrBy(zsetKey, 10.0, "Golang").Result()
	if err != nil {
		fmt.Printf("zincrby failed, err:%v\n", err)
		return
	}
	fmt.Printf("Golang's score is %f now.\n", newScore)

	// 取分数最高的3个
	ret, err := rdb.ZRevRangeWithScores(zsetKey, 0, 2).Result()
	if err != nil {
		fmt.Printf("zrevrange failed, err:%v\n", err)
		return
	}
	for _, z := range ret {
		fmt.Println(z.Member, z.Score)
	}

	// 取95~100分的
	op := &redis.ZRangeBy{
		Min: "95",
		Max: "100",
	}
	ret, err = rdb.ZRangeByScoreWithScores(zsetKey, op).Result()
	if err != nil {
		fmt.Printf("zrangebyscore failed, err:%v\n", err)
		return
	}
	for _, z := range ret {
		fmt.Println(z.Member, z.Score)
	}
}
```

  

[更多文档](https://godoc.org/github.com/go-redis/redis)

  

## 另一种操作redis

  

```go
go get github.com/gomodule/redigo/redis
```

  

### 简单操作

  

```go
package main

import (
	"fmt"
	"github.com/gomodule/redigo/redis"
)

func main(){
	conn, err := redis.Dial("tcp", "122.51.79.172:6379")
	if err != nil {
		fmt.Println("redis connect error. err: ",err)
		return
	}
	defer conn.Close()
	// 设置值
	if _, err := conn.Do("set", "name", "joker");err!=nil{
		fmt.Println("set key failed. err:",err)
	}
	// 获取值
	reply, err := conn.Do("get", "name")
	if err != nil {
		fmt.Println("get key failed. err:",err)
	}
	// 输出值
	s, err := redis.String(reply,err)
	if err != nil {
		fmt.Println("data format failed. err:",err)
	}
	fmt.Println(s)

}
```

  

说明：连接成功后，所有得操作都通过`Do()`方法，返回的是一个`接口`类型，如果要输出其值需要对其进行类型断言。这个库已经封装了需要的类型断言。

  

### 连接池

连接池的作用是维护一定数量的连接，我们需要的时候就从连接池中取一个连接进行操作，操作结束后再把它还回去，可以减少客户端每次都需要与服务端连接所造成的性能损耗。

  

代码如下：

  

```go
func myRedisPool()*redis.Pool{
	return &redis.Pool{
		Dial: func() (conn redis.Conn, err error) {
			return redis.Dial("tcp","x.x.x.x:6379")
		},
		TestOnBorrow:    nil,
		MaxIdle:         0,
		MaxActive:       0,
		IdleTimeout:     0,
		Wait:            false,
		MaxConnLifetime: 0,
	}
}
```

其中：

-   Dial：初始化连接redis的代码
-   TestOnBorrow：用于测试redis
-   MaxIdle：最大空闲数
-   MaxActive：最大连接数，0表示不限制
-   IdleTimeout：最大空闲时间
-   MaxConnLifetime：最大连接活跃时间

> 注意：要从连接池中取数据要保证连接池没有关闭

操作：

（1）、从连接池取连接

  

```go
pool := myRedisPool()
pool.Get()
```

  

（2）、关闭连接

  

```go
pool.Close()
```

  

其他操作。

```go
package main

import (
    "encoding/json"
    "errors"
    "fmt"
    "time"

    "github.com/garyburd/redigo/redis"
)

const (
    RedisURL            = "redis://*****:6379"
    redisMaxIdle        = 3   //最大空闲连接数
    redisIdleTimeoutSec = 240 //最大空闲连接时间
    RedisPassword       = "*****"
)

// NewRedisPool 返回redis连接池
func NewRedisPool(redisURL string) *redis.Pool {
    return &redis.Pool{
        MaxIdle:     redisMaxIdle,
        IdleTimeout: redisIdleTimeoutSec * time.Second,
        Dial: func() (redis.Conn, error) {
            c, err := redis.DialURL(redisURL)
            if err != nil {
                return nil, fmt.Errorf("redis connection error: %s", err)
            }
            //验证redis密码
            if _, authErr := c.Do("AUTH", RedisPassword); authErr != nil {
                return nil, fmt.Errorf("redis auth password error: %s", authErr)
            }
            return c, err
        },
        TestOnBorrow: func(c redis.Conn, t time.Time) error {
            _, err := c.Do("PING")
            if err != nil {
                return fmt.Errorf("ping redis error: %s", err)
            }
            return nil
        },
    }
}

func set(k, v string) {
    c := NewRedisPool(RedisURL).Get()
    defer c.Close()
    _, err := c.Do("SET", k, v)
    if err != nil {
        fmt.Println("set error", err.Error())
    }
}

func getStringValue(k string) string {
    c := NewRedisPool(RedisURL).Get()
    defer c.Close()
    username, err := redis.String(c.Do("GET", k))
    if err != nil {
        fmt.Println("Get Error: ", err.Error())
        return ""
    }
    return username
}

func SetKeyExpire(k string, ex int) {
    c := NewRedisPool(RedisURL).Get()
    defer c.Close()
    _, err := c.Do("EXPIRE", k, ex)
    if err != nil {
        fmt.Println("set error", err.Error())
    }
}

func CheckKey(k string) bool {
    c := NewRedisPool(RedisURL).Get()
    defer c.Close()
    exist, err := redis.Bool(c.Do("EXISTS", k))
    if err != nil {
        fmt.Println(err)
        return false
    } else {
        return exist
    }
}

func DelKey(k string) error {
    c := NewRedisPool(RedisURL).Get()
    defer c.Close()
    _, err := c.Do("DEL", k)
    if err != nil {
        fmt.Println(err)
        return err
    }
    return nil
}

func SetJson(k string, data interface{}) error {
    c := NewRedisPool(RedisURL).Get()
    defer c.Close()
    value, _ := json.Marshal(data)
    n, _ := c.Do("SETNX", k, value)
    if n != int64(1) {
        return errors.New("set failed")
    }
    return nil
}

func getJsonByte(k string) ([]byte, error) {
    jsonGet, err := redis.Bytes(c.Do("GET", key))
    if err != nil {
        fmt.Println(err)
        return nil, err
    }
    return jsonGet, nil
}
```