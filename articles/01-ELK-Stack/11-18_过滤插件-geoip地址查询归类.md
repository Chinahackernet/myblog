# 过滤插件-geoip地址查询归类

> 分类：ELK Stack / 第11章：Logstash
> 原文：https://www.cuiliangblog.cn/detail/section/30956529
> 来源：崔亮的博客

---

# 简介
geoip是常见的免费的IP地址归类查询库，geoip可以根据IP地址提供对应的地域信息，包括国别，省市，经纬度等等，此插件对于可视化地图和区域统计非常有用。

# 下载数据库
官方参考文档：[https://www.elastic.co/guide/en/logstash/current/plugins-filters-geoip.html](https://www.elastic.co/guide/en/logstash/current/plugins-filters-geoip.html)

使用geoip插件需要下载[GeoLite2](https://dev.maxmind.com/geoip/geoip2/geolite2)<font style="color:rgb(33, 37, 41);"> City数据库，需要登录</font>[<font style="color:rgb(33, 37, 41);">GeoLite2</font>](https://dev.maxmind.com/geoip/geoip2/geolite2)<font style="color:rgb(33, 37, 41);">官网注册账号，获取key后才可以免费下载，注册地址：</font>[<font style="color:rgb(33, 37, 41);">https://dev.maxmind.com/geoip/geolite2-free-geolocation-data</font>](https://dev.maxmind.com/geoip/geolite2-free-geolocation-data)

```json
# ls
GeoLite2-City_20230718.tar.gz
# tar -zxf GeoLite2-City_20230718.tar.gz
# mv GeoLite2-City_20230718 /etc/logstash/GeoLite2-City
# cd /etc/logstash/GeoLite2-City/
ls
COPYRIGHT.txt  GeoLite2-City.mmdb  LICENSE.txt  README.txt
```

# 使用示例
```json
input {
  stdin {
  }
}
filter {
  geoip {
    source => "message"
    database => "/etc/logstash/GeoLite2-City/GeoLite2-City.mmdb"
    ecs_compatibility => disabled
  }
}
output {
  stdout {
   codec => rubydebug
  }
}
```

<font style="color:rgb(64, 64, 64);">启动 logstash 后我们输入 </font><font style="color:rgb(199, 37, 78);background-color:rgb(242, 242, 242);">18.166.75.43</font><font style="color:rgb(64, 64, 64);">，得到信息如下，geoip 下的就是地区信息。</font>

```bash
18.166.75.43
{
    "@timestamp" => 2023-07-20T07:11:21.091160062Z,
          "host" => {
        "hostname" => "huanbao"
    },
       "message" => "18.166.75.43",
      "@version" => "1",
         "geoip" => {
         "country_code2" => "HK",
                    "ip" => "18.166.75.43",
         "country_code3" => "HK",
              "latitude" => 22.2578,
             "longitude" => 114.1657,
              "timezone" => "Asia/Hong_Kong",
          "country_name" => "Hong Kong",
              "location" => {
            "lon" => 114.1657,
            "lat" => 22.2578
        },
        "continent_code" => "AS"
    },
         "event" => {
        "original" => "18.166.75.43"
    }
}
```

# 其他操作
## fileds选项指定字段
```tsx
filter {
    geoip {
        fields => ["city_name", "continent_code", "country_code2", "country_code3", "country_name", "dma_code", "ip", "latitude", "longitude", "postal_code", "region_name", "timezone"]
    }
}
```

修改配置为

```json
input {
    stdin {
    }
}

filter {
    geoip {
        source => "message"
        # 指定需要的字段
        fields => ["country_name", "continent_code", "region_name", "city_name", "latitude", "longitude"]
    }
}

output {
    stdout {
        codec => rubydebug
    }
}

```

启动 logstash，输入 183.60.92.253 返回的结果

```json
{
       "message" => "183.60.92.253",
      "@version" => "1",
    "@timestamp" => 2018-11-26T02:26:37.333Z,
          "host" => "localhost.localdomain",
         "geoip" => {
             "longitude" => 113.25,
        "continent_code" => "AS",
              "latitude" => 23.1167,
             "city_name" => "Guangzhou",
          "country_name" => "China",
           "region_name" => "Guangdong"
    }
}
```

## remove_field 删除字段
```bash
filter {
    geoip {
        source => "message"
        # 删除经纬度信息
        remove_field => ["[geoip][latitude]", "[geoip][longitude]"
    }
}
```

## target重命名字段
```bash
filter {
    geoip {
        source => "message"
        fields => ["country_name", "continent_code", "region_name", "city_name", "latitude", "longitude"]
        target => "location"
    }
}
```

重命名后结果

```php
183.60.92.253
{
      "location" => {
        "continent_code" => "AS",
              "latitude" => 23.1167,
          "country_name" => "China",
           "region_name" => "Guangdong",
             "city_name" => "Guangzhou",
             "longitude" => 113.25
    },
    "@timestamp" => 2018-11-26T02:51:35.604Z,
      "@version" => "1",
          "host" => "localhost.localdomain",
       "message" => "183.60.92.253"
}

```


