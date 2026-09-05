# Elastic7.13认证大纲

> 分类：ELK Stack / 第7章：ECE认证
> 原文：https://www.cuiliangblog.cn/detail/section/88366814
> 来源：崔亮的博客

---

## 文档入口地址


### 官方考纲地址


[https://www.elastic.co/cn/training/elastic-certified-engineer-exam](https://www.elastic.co/cn/training/elastic-certified-engineer-exam)



### 核心文档 95%


[https://www.elastic.co/guide/en/elasticsearch/reference/7.13/index.html](https://www.elastic.co/guide/en/elasticsearch/reference/7.13/index.html)



### script文档 5%


[https://www.elastic.co/guide/en/elasticsearch/painless/7.13/index.html](https://www.elastic.co/guide/en/elasticsearch/painless/7.13/index.html)



## 数据管理(Data Management)


### 创建index


Define an index that satisfies a given set of requirements



+ 文档路径：REST APIs——>Index APIs——>Create Index
+ 文档链接：[https://www.elastic.co/guide/en/elasticsearch/reference/7.13/indices-create-index.html](https://www.elastic.co/guide/en/elasticsearch/reference/7.13/indices-create-index.html)
+ 考点梳理：  
创建满足给定条件的索引  
主分片数、副本分片数修改主分片、副本分片数 setting设置（参数建议都过一下，如：刷新频率等）



### kibana导入数据


Use the Data Visualizer to upload a text file into Elasticsearch



+ 文档路径：Set up——>Add data
+ 文档链接：[https://www.elastic.co/guide/en/kibana/7.13/connect-to-elasticsearch.html](https://www.elastic.co/guide/en/kibana/7.13/connect-to-elasticsearch.html)
+ 考点梳理：使用kibana页面操作完成导入文件生成index



### 索引模板


Define and use an index template for a given pattern that satisfies a given set of requirements



+ 文档路径：Index templates
+ 文档链接：[https://www.elastic.co/guide/en/elasticsearch/reference/7.13/index-templates.html](https://www.elastic.co/guide/en/elasticsearch/reference/7.13/index-templates.html)
+ 考点梳理：  
创建满足给定条件的索引模板  
组合考点：创建模板同时，指定mapping，指定setting，指定ingest，指定analyzer，指定别名，指定order优先级



### 动态索引模板


Define and use a dynamic template that satisfies a given set of requirements



+ 文档路径：Mapping——>Dynamic mapping——>Dynamic templates
+ 文档链接：[https://www.elastic.co/guide/en/elasticsearch/reference/7.13/dynamic-templates.html](https://www.elastic.co/guide/en/elasticsearch/reference/7.13/dynamic-templates.html)
+ 考点梳理：  
创建满足给定模板条件的索引，如：text_*开头指定为text类型  
创建满足给定模板条件的模板



### 索引生命周期管理


Define an Index Lifecycle Management policy for a time-series index



+ 文档路径：ILM：Manage the index lifecycle
+ 文档链接：[https://www.elastic.co/guide/en/elasticsearch/reference/7.13/index-lifecycle-management.html](https://www.elastic.co/guide/en/elasticsearch/reference/7.13/index-lifecycle-management.html)
+ 考点：  
为给定时序数据添加索引生命周期管理  
两种实现方式：Kibana + DSL命令行



### 数据流


Define an index template that creates a new data stream



+ 文档路径：Data streams
+ 文档链接：[https://www.elastic.co/guide/en/elasticsearch/reference/7.13/data-streams.html](https://www.elastic.co/guide/en/elasticsearch/reference/7.13/data-streams.html)
+ 考点：为 data stream数据流类型添加索引模板处理。



## 检索数据(Searching Data)


### DSL查询


Write and execute a search query for terms and/or phrases in one or more fields of an index



+ 文档路径：Query DSL
+ 文档链接：[https://www.elastic.co/guide/en/elasticsearch/reference/7.13/query-dsl.html](https://www.elastic.co/guide/en/elasticsearch/reference/7.13/query-dsl.html)
+ 考点：  
区分 全文检索（打分）和非评分检索（无需打分）， filter 和 query  
各种query 都要熟悉  
bool组合query  
自定义评分的四种方式检索



### 布尔查询


Write and execute a search query that is a Boolean combination of multiple queries and filters



+ 文档路径：Query DSL——>Compound queries——>Boolean
+ 文档链接：[https://www.elastic.co/guide/en/elasticsearch/reference/7.13/query-dsl-bool-query.html](https://www.elastic.co/guide/en/elasticsearch/reference/7.13/query-dsl-bool-query.html)
+ 考点：  
bool组合query（重点）  
filter, should, must, must_not 组合及嵌套使用  
minimum_should_match 的正确使用



### 异步检索


Write an asynchronous search



+ 文档路径：REST APIs——>Search APIS——>Async search
+ 文档链接：[https://www.elastic.co/guide/en/elasticsearch/reference/7.13/async-search.html](https://www.elastic.co/guide/en/elasticsearch/reference/7.13/async-search.html)
+ 考点：执行异步检索



### 聚合查询


Write and execute metric and bucket aggregations



+ 文档路径：Aggregations
+ 文档链接：[https://www.elastic.co/guide/en/elasticsearch/reference/7.13/search-aggregations.html](https://www.elastic.co/guide/en/elasticsearch/reference/7.13/search-aggregations.html)
+ 考点：  
指标聚合  
分桶聚合



### 子聚合


Write and execute aggregations that contain sub-aggregations



+ 文档路径：Aggregations——>Pipeline aggregations
+ 文档链接：[https://www.elastic.co/guide/en/elasticsearch/reference/7.13/search-aggregations-pipeline.html](https://www.elastic.co/guide/en/elasticsearch/reference/7.13/search-aggregations-pipeline.html)
+ 考点：  
基于聚合的子聚合



### 跨集群检索


Write and execute a query that searches across multiple clusters



+  文档路径：Search your data——>Search across clusters 
+  文档链接：[https://www.elastic.co/guide/en/elasticsearch/reference/7.13/modules-cross-cluster-search.html](https://www.elastic.co/guide/en/elasticsearch/reference/7.13/modules-cross-cluster-search.html) 
+  考点：  
跨集群组合检索  
跨集群设置（setting可以动态配置，每个集群都要设置的） 



## 开发搜索应用程序(Developing Search Applications)


### 结果高亮


Highlight the search terms in the response of a query



+  文档路径：Search your data——>Highlighting 
+  文档链接：[https://www.elastic.co/guide/en/elasticsearch/reference/7.13/highlighting.html](https://www.elastic.co/guide/en/elasticsearch/reference/7.13/highlighting.html) 
+  考点：  
为指定字段设置给定条件的高亮 



### 结果排序


Sort the results of a query by a given set of requirements



+  文档路径：Search your data——> Sort search results 
+  文档链接：[https://www.elastic.co/guide/en/elasticsearch/reference/7.13/sort-search-results.html](https://www.elastic.co/guide/en/elasticsearch/reference/7.13/sort-search-results.html) 
+  考点：  
为指定字段设置给定条件的排序 sort  
一个字段排序，多个字段不同条件排序（升序、降序） 



### 结果分页


Implement pagination of the results of a search query



+  文档路径：Search your data——> Paginate search results 
+  文档链接：[https://www.elastic.co/guide/en/elasticsearch/reference/7.13/paginate-search-results.html](https://www.elastic.co/guide/en/elasticsearch/reference/7.13/paginate-search-results.html) 
+  考点：  
为指定字段设置给定条件的分页（from， size   from——起始值默认为0）  
会和query，sort等一起考，作为其中一个条件  
注意：聚合的时候，不需要返回查询的时候，size设置为0。 



### 别名


Define and use index aliases



+  文档路径：REST APIS——>Index APIs——>Aliases 
+  文档链接：[https://www.elastic.co/guide/en/elasticsearch/reference/7.13/indices-aliases.html](https://www.elastic.co/guide/en/elasticsearch/reference/7.13/indices-aliases.html) 
+  考点：  
新建索引指定别名  
新建模板指定别名  
为已有索引添加别名 



### 搜索模板


Define and use a search template



+ 文档路径：Search your data——>Search templates
+ 文档链接：[https://www.elastic.co/guide/en/elasticsearch/reference/7.13/search-template.html](https://www.elastic.co/guide/en/elasticsearch/reference/7.13/search-template.html)
+ 考点：设置满足给定条件的search_template

## 数据处理(Data Processing)


### 结构定义


Define a mapping that satisfies a given set of requirements



+  文档路径：Mapping 
+  文档链接：[https://www.elastic.co/guide/en/elasticsearch/reference/7.13/mapping.html](https://www.elastic.co/guide/en/elasticsearch/reference/7.13/mapping.html) 
+  考点：  
设置给定条件的mapping  
不同字段类型选型（简单字段：如keyword，integer；复杂字段如：join，nested等）  
不同字段的细节配置（如：正排索引docvalue取消等） 



### 自定义分词器


Define and use a custom analyzer that satisfies a given set of requirements



+ 文档路径：Text analysis——>Configure text analysis——>Create a custom analyzer
+ 文档链接：  
[https://www.elastic.co/guide/en/elasticsearch/reference/7.13/analysis.html](https://www.elastic.co/guide/en/elasticsearch/reference/7.13/analysis.html)  
[https://www.elastic.co/guide/en/elasticsearch/reference/7.13/analysis-custom-analyzer.html](https://www.elastic.co/guide/en/elasticsearch/reference/7.13/analysis-custom-analyzer.html)
+ 考点：  
自定义分词器  
能区分：analyzer的含义（如：keyword，whitespace，standard等）  
能实现给定条件自定义分词（很重要，有难度）



### 多字段匹配


Define and use multi-fields with different data types and/or analyzers



+ 文档路径：Mapping——>Mapping parameters——>fields
+ 文档链接：[https://www.elastic.co/guide/en/elasticsearch/reference/7.13/multi-fields.html](https://www.elastic.co/guide/en/elasticsearch/reference/7.13/multi-fields.html)
+ 考点：  
一个字段设置不同的分词器（必考）  
考试100%不会考中文分词器，一般会是：standard，english或者其他组合



### 数据重建


Use the Reindex API and Update By Query API to reindex and/or update documents



+  文档路径：  
REST APIs——>Document APIs——>Reindex/Update by query  
Scriptins 
+  文档链接：  
[https://www.elastic.co/guide/en/elasticsearch/reference/7.13/docs-reindex.html](https://www.elastic.co/guide/en/elasticsearch/reference/7.13/docs-reindex.html)  
[https://www.elastic.co/guide/en/elasticsearch/reference/7.13/docs-update-by-query.html](https://www.elastic.co/guide/en/elasticsearch/reference/7.13/docs-update-by-query.html)  
[https://www.elastic.co/guide/en/elasticsearch/reference/7.13/modules-scripting.html](https://www.elastic.co/guide/en/elasticsearch/reference/7.13/modules-scripting.html) 
+  考点：  
单纯redinex操作  
reindex结合query 条件  
组合考点：reindex结合script-painless操作  
组合考点：（难点）redinex结合 ingest操作 



### 数据处理


Define and use an ingest pipeline that satisfies a given set of requirements, including the use of Painless to modify documents



+  文档路径：Ingest pipelines 
+  文档链接：  
[https://www.elastic.co/guide/en/elasticsearch/reference/7.13/ingest.html](https://www.elastic.co/guide/en/elasticsearch/reference/7.13/ingest.html)  
[https://www.elastic.co/guide/en/elasticsearch/reference/7.13/modules-scripting.html](https://www.elastic.co/guide/en/elasticsearch/reference/7.13/modules-scripting.html)  
[https://www.elastic.co/guide/en/elasticsearch/painless/7.13/painless-lang-spec.html](https://www.elastic.co/guide/en/elasticsearch/painless/7.13/painless-lang-spec.html) 
+  考点：  
单纯 ingest操作（修改字段，新增字段等）  
redinex结合 ingest操作（难点）  
update 组合 ingest操作（难点） 



### 字段组合类型


Configure an index so that it properly maintains the relationships of nested arrays of objects



+  文档路径：Mapping——>Field data types 
+  链接：  
[https://www.elastic.co/guide/en/elasticsearch/reference/7.13/nested.html](https://www.elastic.co/guide/en/elasticsearch/reference/7.13/nested.html)  
[https://www.elastic.co/guide/en/elasticsearch/reference/7.13/parent-join.html](https://www.elastic.co/guide/en/elasticsearch/reference/7.13/parent-join.html)  
[https://www.elastic.co/guide/en/elasticsearch/reference/7.13/inner-hits.html](https://www.elastic.co/guide/en/elasticsearch/reference/7.13/inner-hits.html)  
[https://www.elastic.co/guide/en/elasticsearch/reference/7.13/joining-queries.html](https://www.elastic.co/guide/en/elasticsearch/reference/7.13/joining-queries.html)  
[https://www.elastic.co/guide/en/elasticsearch/reference/7.13/query-dsl-terms-query.html#query-dsl-terms-lookup](https://www.elastic.co/guide/en/elasticsearch/reference/7.13/query-dsl-terms-query.html#query-dsl-terms-lookup) 
+  考点：  
组合类型：nested类型  
组合类型：join类型  
nested类型的查询和聚合  
join类型的查询（子查父，父查子）和聚合  
注意：inner_hits的潜在考点  
隐藏考点：terms-lookup（没有明确不考，注意下）

## 集群管理(Cluster Management)


### 集群故障排查


Diagnose shard issues and repair a cluster's health



+  文档路径：REST APIS——>Cluster APIs 
+  文档链接：  
[https://www.elastic.co/guide/en/elasticsearch/reference/7.13/cluster-health.html](https://www.elastic.co/guide/en/elasticsearch/reference/7.13/cluster-health.html)  
[https://www.elastic.co/guide/en/elasticsearch/reference/7.13/cluster-allocation-explain.html](https://www.elastic.co/guide/en/elasticsearch/reference/7.13/cluster-allocation-explain.html)  
[https://www.elastic.co/guide/en/elasticsearch/reference/7.13/cluster-reroute.html](https://www.elastic.co/guide/en/elasticsearch/reference/7.13/cluster-reroute.html) 
+  考点：  
cat api使用（很多，都要熟悉）  
诊断集群健康状态，找到黄色或红色非健康能找到原因，并变成健康绿色状态  
诊断集群分配未分配的原因，并恢复正常  
集群分配迁移等重新路由实现 



### 快照备份与恢复


Backup and restore a cluster and/or specific indices



+  文档路径：Snapshot and restore 
+  文档链接：  
[https://www.elastic.co/guide/en/elasticsearch/reference/7.13/backup-cluster.html](https://www.elastic.co/guide/en/elasticsearch/reference/7.13/backup-cluster.html) 



[https://www.elastic.co/guide/en/elasticsearch/reference/7.13/snapshot-restore.html](https://www.elastic.co/guide/en/elasticsearch/reference/7.13/snapshot-restore.html)



+ 考点：  
快照备份集群并恢复  
快照备份指定索引并恢复  
一定要验证一下恢复是否正确，是否满足给定题目的条件



### 可搜索快照


Configure a snapshot to be searchable



+  文档路径：Snapshot and restore——> searchable snapshots 
+  文档链接：  
[https://www.elastic.co/guide/en/elasticsearch/reference/7.13/searchable-snapshots.html](https://www.elastic.co/guide/en/elasticsearch/reference/7.13/searchable-snapshots.html)  
[https://www.elastic.co/guide/en/elasticsearch/reference/7.13/ilm-searchable-snapshot.html](https://www.elastic.co/guide/en/elasticsearch/reference/7.13/ilm-searchable-snapshot.html) 
+  考点：  
配置可搜索快照  
执行快照检索 



### 跨集群检索


Configure a cluster for cross-cluster search



+ 文档路径：Search your data——>search across clusters
+ 文档链接：[https://www.elastic.co/guide/en/elasticsearch/reference/7.13/modules-cross-cluster-search.html](https://www.elastic.co/guide/en/elasticsearch/reference/7.13/modules-cross-cluster-search.html)
+ 考点：  
能实现跨集群检索配置  
能实现跨集群检索  
考试的时候，一定要验证返回结果是不同集群返回的才可以



### 跨集群复制


Implement cross-cluster replication



+  文档路径：Search your data——>search across clusters 
+  文档链接：REST APIS——>Cross-cluster replication APIs  
[https://www.elastic.co/guide/en/elasticsearch/reference/current/xpack-ccr.html](https://www.elastic.co/guide/en/elasticsearch/reference/current/xpack-ccr.html)  
[https://www.elastic.co/guide/en/elasticsearch/reference/7.13/ccr-apis.html](https://www.elastic.co/guide/en/elasticsearch/reference/7.13/ccr-apis.html) 
+  考点：  
跨集群复制 



### 角色权限


Define role-based access control using Elasticsearch Security



+  文档路径：REST APIs——>Security APIs——>Create or update roles/users 
+  文档链接：  
[https://www.elastic.co/guide/en/elasticsearch/reference/7.13/security-api-put-role.html](https://www.elastic.co/guide/en/elasticsearch/reference/7.13/security-api-put-role.html)  
[https://www.elastic.co/guide/en/elasticsearch/reference/7.13/security-api-put-user.html](https://www.elastic.co/guide/en/elasticsearch/reference/7.13/security-api-put-user.html) 
+  考点：  
x-pack 一般会结合role 角色一起考  
新建角色  
新建用户&密码，修改密码  
kibana权限设置，一定要加上能访问kibana，否则新建了用户会无法登录（可能会扣分）  
举例：设置x-pack属性后（默认未开启），设置用户名、密码（可以kibana设置）、设置访问权限等。 

## 7.2 考纲 VS 7.13 考纲
### 删除考点（7.13 版本不再考！）


+  删除考点 1、部署和启动满足给定要求的 Elasticsearch 集群  
Deploy and start an Elasticsearch cluster that satisfies a given set of requirements 
+  删除考点 2、配置满足给定要求的节点  
Configure the nodes of a cluster to satisfy a given set of requirements 
+  删除考点 3、Elasticsearch 安全配置  
Secure a cluster using Elasticsearch Security 
+  删除考点 4、执行增删改查文档操作  
Perform index, create, read, update, and delete operations on the documents of an index 
+  删除考点 5、应用 fuzzy 匹配检索  
Apply fuzzy matching to a query 
+  删除考点 6、为索引配置分片分配感知和强制分片分配感知策略  
Configure shard allocation awareness and forced awareness for an index 
+  删除考点 7、配置冷热集群架构  
Configure a cluster for use with a hot/warm architecture 

### 新增考点


+  新增考点 1、* 使用 Kibana的Data Visualizer 上传文本文件到 Elasticsearch  
Use the Data Visualizer to upload a text file into Elasticsearch 
+  新增考点 2、* 为基于时间序列的索引设置索引生命周期管理策略（ILM）  
Define an Index Lifecycle Management policy for a time-series index 
+  新增考点 3、*定义基于 data stream 的索引模板  
Define an index template that creates a new data stream 
+  新增考点 4、* 写异步检索  
Write an asynchronous search 
+  新增考点 5、* 配置可搜索快照  
Configure a snapshot to be searchable 
+  新增考点6、* 跨集群复制  
Implement cross-cluster replication  

## 常用文档路径
![画板](assets/01-ELK-Stack/9aa50aa4a539a47c5560.jpeg)


