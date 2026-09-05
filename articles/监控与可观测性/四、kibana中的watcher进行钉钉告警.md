创建告警监视中的json

```plain
{
  "trigger": {
    "schedule": {
      "interval": "1m"
    }
  },
  "input": {
    "search": {
      "request": {
        "search_type": "query_then_fetch",
        "indices": [
          "holder_error*"
        ],
        "rest_total_hits_as_int": true,
        "body": {
          "query": {
            "bool": {
              "must": [
                {
                  "query_string": {
                    "query": "java.lang.OutOfMemoryError"
                  }
                },
                {
                  "range": {
                    "@timestamp": {
                      "gte": "now-1m"
                    }
                  }
                }
              ]
            }
          },
          "sort": [
            {
              "@timestamp": {
                "order": "desc"
              }
            }
          ]
        }
      }
    }
  },
  "condition": {
    "compare": {
      "ctx.payload.hits.total": {
        "gt": 0
      }
    }
  },
  "actions": {
    "my_webhook": {
      "webhook": {
        "scheme": "https",
        "host": "oapi.dingtalk.com",
        "port": 443,
        "method": "post",
        "path": "/robot/send",
        "params": {
          "access_token": "d31af951b216b34dbd2428a89bfb7e416b70373f132200f89ad214ed7d50718f"
        },
        "headers": {
          "Content-Type": "application/json"
        },
        "body": "{\"msgtype\": \"text\",\"text\": {\"content\": \"kibana 报警：触发{{ ctx.payload.hits.total }}次报警。\\n问题服务： {{#ctx.payload.hits.hits}}{{_source.log.file.path}}{{/ctx.payload.hits.hits}}\\n宿主机为: {{#ctx.payload.hits.hits}}{{_source.host.name}}{{/ctx.payload.hits.hits}}\\n问题类型： java.lang.OutOfMemoryError \"} }"
      }
    }
  },
  "throttle_period_in_millis": 900000
}
```