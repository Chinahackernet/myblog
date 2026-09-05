# snapshot

> 分类：ELK Stack / 第7章：ECE认证
> 原文：https://www.cuiliangblog.cn/detail/section/133061473
> 来源：崔亮的博客

---

# 题目
创建my_backup快照存储库，然后对data_stream_1创建快照

## 答案
```json
# 创建快照存储库
PUT /_snapshot/my_backup
{
  "type": "fs",
  "settings": {
    "location": "my_backup_location"
  }
}
# 查看快照存储库
GET /_snapshot/my_backup
# 创建快照
PUT /_snapshot/my_backup/snapshot_1?wait_for_completion=true
{
  "indices": "data_stream_1",
  "ignore_unavailable": true,
  "include_global_state": false
}
```

## 

