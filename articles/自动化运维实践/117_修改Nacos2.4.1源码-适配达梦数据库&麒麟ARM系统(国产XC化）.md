---
title: "修改Nacos2.4.1源码-适配达梦数据库&麒麟ARM系统(国产XC化）"
---

**前言：应集团公司推广XC化，其中基础环境需要用麒麟ARM操作系统和达梦数据库，而官网的nacos默认适配mysql，需要重新编译源码来适配需要对接的数据库，2.4.2试验了一把，安装启动后 nacos 控制台出现 “创建命名空间失败 / 数据库语法问题”，经分析，问题出在源码的sql语法上，参考以下链接1。鉴于项目架构搭建时间紧急，最快的解决办法是重新编译 一版2.4.1 版本的源码包。下面将具体修改源码的方法和心得与大家分享下，另外鸣谢“链接2”作者的提点。**

**链接1：** `https://github.com/alibaba/nacos/issues/12625`  
**链接2：** `https://blog.csdn.net/qq_26018075/article/details/141399170?spm=1001.2014.3001.5506`  
**maven下载地址链接：** `https://maven.apache.org/download.cgi`  
**达梦JDBC驱动包下载地址链接：** `https://eco.dameng.com/download/`  
**jdk下载地址链接:** `https://www.oracle.com/java/technologies/downloads/#java17`  
**nacos源码包下载链接：** `https://github.com/alibaba/nacos/releases?after=1.3.0`

### 第一步：安装达梦驱动到maven本地仓库

先进入存放DmJdbcDriver-1.8.jar的路径：  
`cd C:\Users\ztt\Desktop\nacos-2.4.1源码改造-适配达梦\nacos-2.4.1源码改造-适配达梦`  
安装驱动命令：  
`mvn install:install-file -Dfile=DmJdbcDriver-1.8.jar -DgroupId=dm.jdbc -DartifactId=DmJdbcDriver -Dversion=1.8 -Dpackaging=jar`  

**待输出：BUILD SUCCESS，说明安装成功**

### 第二步：添加DM（达梦）驱动

### 1、nacos-all的pom.xml文件

```
<properties>
   <dm-jdbc.version>1.8</dm-jdbc.version>  
</properties>
```

```
<dependencies>
<dependency>  
    <groupId>dm.jdbc</groupId>  
    <artifactId>DmJdbcDriver</artifactId>  
    <version>${dm-jdbc.version}</version>  
</dependency>
</dependencies>
```

### 2、nacos-common、nacos-naming、nacos-config的pom.xml文件

```
<dependencies>
<dependency>  
    <groupId>dm.jdbc</groupId>  
    <artifactId>DmJdbcDriver</artifactId>  
    <version>${dm-jdbc.version}</version>  
</dependency>
</dependencies>
```

### 第三步：修改源码-代码

### 1、DataSourceConstant 数据源常量修改

```
class: com.alibaba.nacos.plugin.datasource.constants.DataSourceConstant
添加 public static final String DM = “dm”;
```

添加：

```
public class DataSourceConstant {  
    public static final String MYSQL = "mysql";  
      
    public static final String DERBY = "derby";  
  
    public static final String DM = "dm";  
}
```

### 2、添加TrustedDmFunctionEnum

复制Mysql的TrustedMysqlFunctionEnum枚举到dm目录，并修改名称为：TrustedDmFunctionEnum。也可以展开  

### 3、修改Mapper

**链接：**`https://gitcode.com/gh_mirrors/ma/Mapper/overview?utm_source=highlight_word_gitcode&word=mapper&isLogin=1`  
目录: com.alibaba.nacos.plugin.datasource.impl  
①复制com.alibaba.nacos.plugin.datasource.impl.mysql -> com.alibaba.nacos.plugin.datasource.impl.dm  
②修改mapper中的getDataSource方法，改为DataSourceConstant.DM  
③修改AbstractMapperByDm中的getFunction方法com.alibaba.nacos.plugin.datasource.impl.dm.AbstractMapperByDm，使用TrustedDmFunctionEnum枚举  

### 4、修改resoure

将datasource（nacos-datasource-plugin）工程 resources目录下的META-INF/services/com.alibaba.nacos.plugin.datasource.mapper.Mapper修改为：DM后缀

```
com.alibaba.nacos.plugin.datasource.impl.dm.ConfigInfoAggrMapperByDm  
com.alibaba.nacos.plugin.datasource.impl.dm.ConfigInfoBetaMapperByDm  
com.alibaba.nacos.plugin.datasource.impl.dm.ConfigInfoMapperByDm  
com.alibaba.nacos.plugin.datasource.impl.dm.ConfigInfoTagMapperByDm  
com.alibaba.nacos.plugin.datasource.impl.dm.ConfigTagsRelationMapperByDm  
com.alibaba.nacos.plugin.datasource.impl.dm.HistoryConfigInfoMapperByDm  
com.alibaba.nacos.plugin.datasource.impl.dm.TenantInfoMapperByDm  
com.alibaba.nacos.plugin.datasource.impl.dm.TenantCapacityMapperByDm  
com.alibaba.nacos.plugin.datasource.impl.dm.GroupCapacityMapperByDm
```

### 5、添加DM程序适配器

PersistenceConstant添加：`public static final String DM = "dm";`  
目录：class: com.alibaba.nacos.persistence.constants.PersistenceConstant`  

### 6、添加DM分页适配器

目录: com.alibaba.nacos.plugin.auth.impl.persistence.handler.support  
在该目录下添加DM适配器类

```
public class DmPageHandlerAdapter implements PageHandlerAdapter {  
  
    @Override  
    public boolean supports(String dataSourceType) {  
        return PersistenceConstant.DM.equals(dataSourceType);  
    }  
  
    @Override  
    public OffsetFetchResult addOffsetAndFetchNext(String fetchSql, Object[] arg, int pageNo, int pageSize) {  
        if (!fetchSql.contains(AuthPageConstant.LIMIT)) {  
            fetchSql += " " + AuthPageConstant.LIMIT_SIZE;  
            List<Object> newArgsList = new ArrayList<>(Arrays.asList(arg));  
            newArgsList.add((pageNo - 1) * pageSize);  
            newArgsList.add(pageSize);  
  
            Object[] newArgs = newArgsList.toArray(new Object[0]);  
            return new OffsetFetchResult(fetchSql, newArgs);  
        }  
  
        return new OffsetFetchResult(fetchSql, arg);  
    }  
  
}
```

### 7、分页适配工厂添加DM分页适配器

目录: com.alibaba.nacos.plugin.auth.impl.persistence.handler.PageHandlerAdapterFactory  
添加分页适配器:

```
private PageHandlerAdapterFactory() {  
    List<PageHandlerAdapter> handlerAdapters = new ArrayList<>(3);  
    Map<String, PageHandlerAdapter> handlerAdapterMap = new HashMap<>(3);  
    Consumer<PageHandlerAdapter> addHandlerAdapter = handlerAdapter -> {  
        handlerAdapters.add(handlerAdapter);  
        handlerAdapterMap.put(handlerAdapter.getClass().getName(), handlerAdapter);  
    };  
    // DmPageHandlerAdapter  
    addHandlerAdapter.accept(new DmPageHandlerAdapter());  
    // MysqlPageHandlerAdapter  
    addHandlerAdapter.accept(new MysqlPageHandlerAdapter());  
    // DerbyPageHandlerAdapter  
    addHandlerAdapter.accept(new DerbyPageHandlerAdapter());  
    // DefaultPageHandlerAdapter  
    addHandlerAdapter.accept(new DefaultPageHandlerAdapter());  
    this.handlerAdapters = Collections.unmodifiableList(handlerAdapters);  
    this.handlerAdapterMap = Collections.unmodifiableMap(handlerAdapterMap);  
}
```

### 8、修改数据源配置类ExternalDataSourceProperties

目录: com.alibaba.nacos.persistence.datasource.ExternalDataSourceProperties  
添加属性: private List jdbcDriverName

```
private List<String> jdbcDriverName = new ArrayList<>();  

public List<String> getJdbcDriverName() {  
    return jdbcDriverName;  
}  
  
public void setJdbcDriverName(List<String> jdbcDriverName) {  
    this.jdbcDriverName = jdbcDriverName;  
}
```

### 9、修改 build方法中的数据源驱动部分

目录: com.alibaba.nacos.persistence.datasource.ExternalDataSourceProperties#build  
添加：  
poolProperties.setDriverClassName(getOrDefault(jdbcDriverName,index,jdbcDriverName.get(index)).trim());  

### 第四步：修改配置文件

①修改工程distribution下的配置文件application.properties路径distribution/conf/application.properties；  
②spring.sql.init.platform的值改为dm；  
③添加db.jdbc-driver-name.0=dm.jdbc.driver.DmDriver；  
④修改url为db.url.0=jdbc:dm://IP:5236/DB；  

### 第五步：添加sql

将dm-scheme.sql添加到distribution的conf目录下  
sql内容：

```
CREATE TABLE "USERS"  
(  
 "USERNAME" VARCHAR(50) NOT NULL,  
 "PASSWORD" VARCHAR(500) NOT NULL,  
 "ENABLED" TINYINT NOT NULL  
);  
  
CREATE TABLE "TENANT_INFO"  
(  
 "ID" BIGINT IDENTITY(1,1) NOT NULL,  
 "KP" VARCHAR(128) NOT NULL,  
 "TENANT_ID" VARCHAR(128) DEFAULT ''  
 NULL,  
 "TENANT_NAME" VARCHAR(128) DEFAULT ''  
 NULL,  
 "TENANT_DESC" VARCHAR(256) NULL,  
 "CREATE_SOURCE" VARCHAR(32) NULL,  
 "GMT_CREATE" BIGINT NOT NULL,  
 "GMT_MODIFIED" BIGINT NOT NULL  
);  
  
CREATE TABLE "TENANT_CAPACITY"  
(  
 "ID" BIGINT IDENTITY(1,1) NOT NULL,  
 "TENANT_ID" VARCHAR(128) DEFAULT ''  
 NOT NULL,  
 "QUOTA" BIGINT DEFAULT 0  
 NOT NULL,  
 "USAGE" BIGINT DEFAULT 0  
 NOT NULL,  
 "MAX_SIZE" BIGINT DEFAULT 0  
 NOT NULL,  
 "MAX_AGGR_COUNT" BIGINT DEFAULT 0  
 NOT NULL,  
 "MAX_AGGR_SIZE" BIGINT DEFAULT 0  
 NOT NULL,  
 "MAX_HISTORY_COUNT" BIGINT DEFAULT 0  
 NOT NULL,  
 "GMT_CREATE" TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP()  
 NOT NULL,  
 "GMT_MODIFIED" TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP()  
 NOT NULL  
);  
  
CREATE TABLE "ROLES"  
(  
 "USERNAME" VARCHAR(50) NOT NULL,  
 "ROLE" VARCHAR(50) NOT NULL  
);  
  
CREATE TABLE "PERMISSIONS"  
(  
 "ROLE" VARCHAR(50) NOT NULL,  
 "RESOURCE" VARCHAR(255) NOT NULL,  
 "ACTION" VARCHAR(8) NOT NULL  
);  
  
CREATE TABLE "HIS_CONFIG_INFO"  
(  
 "ID" DECIMAL(20,0) NOT NULL,  
 "NID" BIGINT IDENTITY(1,1) NOT NULL,  
 "DATA_ID" VARCHAR(255) NOT NULL,  
 "GROUP_ID" VARCHAR(128) NOT NULL,  
 "APP_NAME" VARCHAR(128) NULL,  
 "CONTENT" CLOB NOT NULL,  
 "MD5" VARCHAR(32) NULL,  
 "GMT_CREATE" TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP()  
 NOT NULL,  
 "GMT_MODIFIED" TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP()  
 NOT NULL,  
 "SRC_USER" TEXT NULL,  
 "SRC_IP" VARCHAR(50) NULL,  
 "OP_TYPE" CHAR(10) NULL,  
 "TENANT_ID" VARCHAR(128) DEFAULT ''  
 NULL,  
 "ENCRYPTED_DATA_KEY" TEXT NOT NULL  
);  
  
CREATE TABLE "GROUP_CAPACITY"  
(  
 "ID" BIGINT IDENTITY(1,1) NOT NULL,  
 "GROUP_ID" VARCHAR(128) DEFAULT ''  
 NOT NULL,  
 "QUOTA" BIGINT DEFAULT 0  
 NOT NULL,  
 "USAGE" BIGINT DEFAULT 0  
 NOT NULL,  
 "MAX_SIZE" BIGINT DEFAULT 0  
 NOT NULL,  
 "MAX_AGGR_COUNT" BIGINT DEFAULT 0  
 NOT NULL,  
 "MAX_AGGR_SIZE" BIGINT DEFAULT 0  
 NOT NULL,  
 "MAX_HISTORY_COUNT" BIGINT DEFAULT 0  
 NOT NULL,  
 "GMT_CREATE" TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP()  
 NOT NULL,  
 "GMT_MODIFIED" TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP()  
 NOT NULL  
);  
  
CREATE TABLE "CONFIG_TAGS_RELATION"  
(  
 "ID" BIGINT NOT NULL,  
 "TAG_NAME" VARCHAR(128) NOT NULL,  
 "TAG_TYPE" VARCHAR(64) NULL,  
 "DATA_ID" VARCHAR(255) NOT NULL,  
 "GROUP_ID" VARCHAR(128) NOT NULL,  
 "TENANT_ID" VARCHAR(128) DEFAULT ''  
 NULL,  
 "NID" BIGINT IDENTITY(1,1) NOT NULL  
);  
  
CREATE TABLE "CONFIG_INFO_TAG"  
(  
 "ID" BIGINT IDENTITY(1,1) NOT NULL,  
 "DATA_ID" VARCHAR(255) NOT NULL,  
 "GROUP_ID" VARCHAR(128) NOT NULL,  
 "TENANT_ID" VARCHAR(128) DEFAULT ''  
 NULL,  
 "TAG_ID" VARCHAR(128) NOT NULL,  
 "APP_NAME" VARCHAR(128) NULL,  
 "CONTENT" CLOB NOT NULL,  
 "MD5" VARCHAR(32) NULL,  
 "GMT_CREATE" TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP()  
 NOT NULL,  
 "GMT_MODIFIED" TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP()  
 NOT NULL,  
 "SRC_USER" TEXT NULL,  
 "SRC_IP" VARCHAR(50) NULL  
);  
  
CREATE TABLE "CONFIG_INFO_BETA"  
(  
 "ID" BIGINT IDENTITY(1,1) NOT NULL,  
 "DATA_ID" VARCHAR(255) NOT NULL,  
 "GROUP_ID" VARCHAR(128) NOT NULL,  
 "APP_NAME" VARCHAR(128) NULL,  
 "CONTENT" CLOB NOT NULL,  
 "BETA_IPS" VARCHAR(1024) NULL,  
 "MD5" VARCHAR(32) NULL,  
 "GMT_CREATE" TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP()  
 NOT NULL,  
 "GMT_MODIFIED" TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP()  
 NOT NULL,  
 "SRC_USER" TEXT NULL,  
 "SRC_IP" VARCHAR(50) NULL,  
 "TENANT_ID" VARCHAR(128) DEFAULT ''  
 NULL,  
 "ENCRYPTED_DATA_KEY" TEXT NOT NULL  
);  
  
CREATE TABLE "CONFIG_INFO_AGGR"  
(  
 "ID" BIGINT IDENTITY(1,1) NOT NULL,  
 "DATA_ID" VARCHAR(255) NOT NULL,  
 "GROUP_ID" VARCHAR(128) NOT NULL,  
 "DATUM_ID" VARCHAR(255) NOT NULL,  
 "CONTENT" CLOB NOT NULL,  
 "GMT_MODIFIED" TIMESTAMP(0) NOT NULL,  
 "APP_NAME" VARCHAR(128) NULL,  
 "TENANT_ID" VARCHAR(128) DEFAULT ''  
 NULL  
);  
  
CREATE TABLE "CONFIG_INFO"  
(  
 "ID" BIGINT IDENTITY(1,1) NOT NULL,  
 "DATA_ID" VARCHAR(255) NOT NULL,  
 "GROUP_ID" VARCHAR(128) NULL,  
 "CONTENT" CLOB NOT NULL,  
 "MD5" VARCHAR(32) NULL,  
 "GMT_CREATE" TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP()  
 NOT NULL,  
 "GMT_MODIFIED" TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP()  
 NOT NULL,  
 "SRC_USER" TEXT NULL,  
 "SRC_IP" VARCHAR(50) NULL,  
 "APP_NAME" VARCHAR(128) NULL,  
 "TENANT_ID" VARCHAR(128) DEFAULT ''  
 NULL,  
 "C_DESC" VARCHAR(256) NULL,  
 "C_USE" VARCHAR(64) NULL,  
 "EFFECT" VARCHAR(64) NULL,  
 "TYPE" VARCHAR(64) NULL,  
 "C_SCHEMA" TEXT NULL,  
 "ENCRYPTED_DATA_KEY" TEXT NOT NULL  
);  
  
SET IDENTITY_INSERT "CONFIG_INFO" ON;  
SET IDENTITY_INSERT "CONFIG_INFO" OFF;  
SET IDENTITY_INSERT "CONFIG_INFO_AGGR" ON;  
SET IDENTITY_INSERT "CONFIG_INFO_AGGR" OFF;  
SET IDENTITY_INSERT "CONFIG_INFO_BETA" ON;  
SET IDENTITY_INSERT "CONFIG_INFO_BETA" OFF;  
SET IDENTITY_INSERT "CONFIG_INFO_TAG" ON;  
SET IDENTITY_INSERT "CONFIG_INFO_TAG" OFF;  
SET IDENTITY_INSERT "CONFIG_TAGS_RELATION" ON;  
SET IDENTITY_INSERT "CONFIG_TAGS_RELATION" OFF;  
SET IDENTITY_INSERT "GROUP_CAPACITY" ON;  
SET IDENTITY_INSERT "GROUP_CAPACITY" OFF;  
SET IDENTITY_INSERT "HIS_CONFIG_INFO" ON;  
SET IDENTITY_INSERT "HIS_CONFIG_INFO" OFF;  
INSERT INTO "ROLES"("USERNAME","ROLE") VALUES('nacos','ROLE_ADMIN');  
  
SET IDENTITY_INSERT "TENANT_CAPACITY" ON;  
SET IDENTITY_INSERT "TENANT_CAPACITY" OFF;  
SET IDENTITY_INSERT "TENANT_INFO" ON;  
SET IDENTITY_INSERT "TENANT_INFO" OFF;  
INSERT INTO "USERS"("USERNAME","PASSWORD","ENABLED") VALUES('nacos','$2a$10$EuWPZHzz32dJN7jexM34MOeYirDdFAZm2kuWj7VEOJhhZkDrxfvUu',1);  
  
ALTER TABLE "USERS" ADD CONSTRAINT  PRIMARY KEY("USERNAME") ;  
  
ALTER TABLE "TENANT_INFO" ADD CONSTRAINT  PRIMARY KEY("ID") ;  
  
ALTER TABLE "TENANT_INFO" ADD CONSTRAINT "UK_TENANT_INFO_KPTENANTID" UNIQUE("KP","TENANT_ID") ;  
  
ALTER TABLE "TENANT_CAPACITY" ADD CONSTRAINT  PRIMARY KEY("ID") ;  
  
ALTER TABLE "TENANT_CAPACITY" ADD CONSTRAINT "UK_TENANT_ID" UNIQUE("TENANT_ID") ;  
  
ALTER TABLE "ROLES" ADD CONSTRAINT "IDX_USER_ROLE" UNIQUE("USERNAME","ROLE") ;  
  
ALTER TABLE "PERMISSIONS" ADD CONSTRAINT "UK_ROLE_PERMISSION" UNIQUE("ROLE","RESOURCE","ACTION") ;  
  
ALTER TABLE "HIS_CONFIG_INFO" ADD CONSTRAINT  PRIMARY KEY("NID") ;  
  
ALTER TABLE "GROUP_CAPACITY" ADD CONSTRAINT  PRIMARY KEY("ID") ;  
  
ALTER TABLE "GROUP_CAPACITY" ADD CONSTRAINT "UK_GROUP_ID" UNIQUE("GROUP_ID") ;  
  
ALTER TABLE "CONFIG_TAGS_RELATION" ADD CONSTRAINT  PRIMARY KEY("NID") ;  
  
ALTER TABLE "CONFIG_TAGS_RELATION" ADD CONSTRAINT "UK_CONFIGTAGRELATION_CONFIGIDTAG" UNIQUE("ID","TAG_NAME","TAG_TYPE") ;  
  
ALTER TABLE "CONFIG_INFO_TAG" ADD CONSTRAINT  PRIMARY KEY("ID") ;  
  
ALTER TABLE "CONFIG_INFO_TAG" ADD CONSTRAINT "UK_CONFIGINFOTAG_DATAGROUPTENANTTAG" UNIQUE("DATA_ID","GROUP_ID","TENANT_ID","TAG_ID") ;  
  
ALTER TABLE "CONFIG_INFO_BETA" ADD CONSTRAINT  PRIMARY KEY("ID") ;  
  
ALTER TABLE "CONFIG_INFO_BETA" ADD CONSTRAINT "UK_CONFIGINFOBETA_DATAGROUPTENANT" UNIQUE("DATA_ID","GROUP_ID","TENANT_ID") ;  
  
ALTER TABLE "CONFIG_INFO_AGGR" ADD CONSTRAINT  PRIMARY KEY("ID") ;  
  
ALTER TABLE "CONFIG_INFO_AGGR" ADD CONSTRAINT "UK_CONFIGINFOAGGR_DATAGROUPTENANTDATUM" UNIQUE("DATA_ID","GROUP_ID","TENANT_ID","DATUM_ID") ;  
  
ALTER TABLE "CONFIG_INFO" ADD CONSTRAINT  PRIMARY KEY("ID") ;  
  
ALTER TABLE "CONFIG_INFO" ADD CONSTRAINT "UK_CONFIGINFO_DATAGROUPTENANT" UNIQUE("DATA_ID","GROUP_ID","TENANT_ID") ;  
  
CREATE UNIQUE INDEX "PRIMARY"  
ON "USERS"("USERNAME");  
  
COMMENT ON COLUMN "USERS"."USERNAME" IS 'username';  
  
COMMENT ON COLUMN "USERS"."PASSWORD" IS 'password';  
  
COMMENT ON COLUMN "USERS"."ENABLED" IS 'enabled';  
  
CREATE INDEX "IDX_TENANT_ID"  
ON "TENANT_INFO"("TENANT_ID");  
  
CREATE UNIQUE INDEX "INDEX134402165964299"  
ON "TENANT_INFO"("ID");  
  
COMMENT ON TABLE "TENANT_INFO" IS 'tenant_info';  
  
COMMENT ON COLUMN "TENANT_INFO"."ID" IS 'id';  
  
COMMENT ON COLUMN "TENANT_INFO"."KP" IS 'kp';  
  
COMMENT ON COLUMN "TENANT_INFO"."TENANT_ID" IS 'tenant_id';  
  
COMMENT ON COLUMN "TENANT_INFO"."TENANT_NAME" IS 'tenant_name';  
  
COMMENT ON COLUMN "TENANT_INFO"."TENANT_DESC" IS 'tenant_desc';  
  
COMMENT ON COLUMN "TENANT_INFO"."CREATE_SOURCE" IS 'create_source';  
  
COMMENT ON COLUMN "TENANT_INFO"."GMT_CREATE" IS '创建时间';  
  
COMMENT ON COLUMN "TENANT_INFO"."GMT_MODIFIED" IS '修改时间';  
  
ALTER TABLE "TENANT_CAPACITY" ADD CHECK ("QUOTA" >= 0) ENABLE ;  
  
ALTER TABLE "TENANT_CAPACITY" ADD CHECK ("MAX_HISTORY_COUNT" >= 0) ENABLE ;  
  
ALTER TABLE "TENANT_CAPACITY" ADD CHECK ("MAX_AGGR_SIZE" >= 0) ENABLE ;  
  
ALTER TABLE "TENANT_CAPACITY" ADD CHECK ("MAX_AGGR_COUNT" >= 0) ENABLE ;  
  
ALTER TABLE "TENANT_CAPACITY" ADD CHECK ("MAX_SIZE" >= 0) ENABLE ;  
  
ALTER TABLE "TENANT_CAPACITY" ADD CHECK ("USAGE" >= 0) ENABLE ;  
  
CREATE UNIQUE INDEX "INDEX134403016796300"  
ON "TENANT_CAPACITY"("ID");  
  
COMMENT ON TABLE "TENANT_CAPACITY" IS '租户容量信息表';  
  
COMMENT ON COLUMN "TENANT_CAPACITY"."ID" IS '主键ID';  
  
COMMENT ON COLUMN "TENANT_CAPACITY"."TENANT_ID" IS 'Tenant ID';  
  
COMMENT ON COLUMN "TENANT_CAPACITY"."QUOTA" IS '配额，0表示使用默认值';  
  
COMMENT ON COLUMN "TENANT_CAPACITY"."USAGE" IS '使用量';  
  
COMMENT ON COLUMN "TENANT_CAPACITY"."MAX_SIZE" IS '单个配置大小上限，单位为字节，0表示使用默认值';  
  
COMMENT ON COLUMN "TENANT_CAPACITY"."MAX_AGGR_COUNT" IS '聚合子配置最大个数';  
  
COMMENT ON COLUMN "TENANT_CAPACITY"."MAX_AGGR_SIZE" IS '单个聚合数据的子配置大小上限，单位为字节，0表示使用默认值';  
  
COMMENT ON COLUMN "TENANT_CAPACITY"."MAX_HISTORY_COUNT" IS '最大变更历史数量';  
  
COMMENT ON COLUMN "TENANT_CAPACITY"."GMT_CREATE" IS '创建时间';  
  
COMMENT ON COLUMN "TENANT_CAPACITY"."GMT_MODIFIED" IS '修改时间';  
  
COMMENT ON COLUMN "ROLES"."USERNAME" IS 'username';  
  
COMMENT ON COLUMN "ROLES"."ROLE" IS 'role';  
  
COMMENT ON COLUMN "PERMISSIONS"."ROLE" IS 'role';  
  
COMMENT ON COLUMN "PERMISSIONS"."RESOURCE" IS 'resource';  
  
COMMENT ON COLUMN "PERMISSIONS"."ACTION" IS 'action';  
  
ALTER TABLE "HIS_CONFIG_INFO" ADD CHECK ("ID" >= 0) ENABLE ;  
  
CREATE INDEX "IDX_DID"  
ON "HIS_CONFIG_INFO"("DATA_ID");  
  
CREATE INDEX "IDX_GMT_MODIFIED"  
ON "HIS_CONFIG_INFO"("GMT_MODIFIED");  
  
CREATE INDEX "IDX_GMT_CREATE"  
ON "HIS_CONFIG_INFO"("GMT_CREATE");  
  
CREATE UNIQUE INDEX "INDEX134404266256800"  
ON "HIS_CONFIG_INFO"("NID");  
  
COMMENT ON TABLE "HIS_CONFIG_INFO" IS '多租户改造';  
  
COMMENT ON COLUMN "HIS_CONFIG_INFO"."ID" IS 'id';  
  
COMMENT ON COLUMN "HIS_CONFIG_INFO"."NID" IS 'nid, 自增标识';  
  
COMMENT ON COLUMN "HIS_CONFIG_INFO"."DATA_ID" IS 'data_id';  
  
COMMENT ON COLUMN "HIS_CONFIG_INFO"."GROUP_ID" IS 'group_id';  
  
COMMENT ON COLUMN "HIS_CONFIG_INFO"."APP_NAME" IS 'app_name';  
  
COMMENT ON COLUMN "HIS_CONFIG_INFO"."CONTENT" IS 'content';  
  
COMMENT ON COLUMN "HIS_CONFIG_INFO"."MD5" IS 'md5';  
  
COMMENT ON COLUMN "HIS_CONFIG_INFO"."GMT_CREATE" IS '创建时间';  
  
COMMENT ON COLUMN "HIS_CONFIG_INFO"."GMT_MODIFIED" IS '修改时间';  
  
COMMENT ON COLUMN "HIS_CONFIG_INFO"."SRC_USER" IS 'source user';  
  
COMMENT ON COLUMN "HIS_CONFIG_INFO"."SRC_IP" IS 'source ip';  
  
COMMENT ON COLUMN "HIS_CONFIG_INFO"."OP_TYPE" IS 'operation type';  
  
COMMENT ON COLUMN "HIS_CONFIG_INFO"."TENANT_ID" IS '租户字段';  
  
COMMENT ON COLUMN "HIS_CONFIG_INFO"."ENCRYPTED_DATA_KEY" IS '密钥';  
  
ALTER TABLE "GROUP_CAPACITY" ADD CHECK ("QUOTA" >= 0) ENABLE ;  
  
ALTER TABLE "GROUP_CAPACITY" ADD CHECK ("MAX_HISTORY_COUNT" >= 0) ENABLE ;  
  
ALTER TABLE "GROUP_CAPACITY" ADD CHECK ("MAX_AGGR_SIZE" >= 0) ENABLE ;  
  
ALTER TABLE "GROUP_CAPACITY" ADD CHECK ("MAX_AGGR_COUNT" >= 0) ENABLE ;  
  
ALTER TABLE "GROUP_CAPACITY" ADD CHECK ("MAX_SIZE" >= 0) ENABLE ;  
  
ALTER TABLE "GROUP_CAPACITY" ADD CHECK ("USAGE" >= 0) ENABLE ;  
  
CREATE UNIQUE INDEX "INDEX134405629453900"  
ON "GROUP_CAPACITY"("ID");  
  
COMMENT ON TABLE "GROUP_CAPACITY" IS '集群、各Group容量信息表';  
  
COMMENT ON COLUMN "GROUP_CAPACITY"."ID" IS '主键ID';  
  
COMMENT ON COLUMN "GROUP_CAPACITY"."GROUP_ID" IS 'Group ID，空字符表示整个集群';  
  
COMMENT ON COLUMN "GROUP_CAPACITY"."QUOTA" IS '配额，0表示使用默认值';  
  
COMMENT ON COLUMN "GROUP_CAPACITY"."USAGE" IS '使用量';  
  
COMMENT ON COLUMN "GROUP_CAPACITY"."MAX_SIZE" IS '单个配置大小上限，单位为字节，0表示使用默认值';  
  
COMMENT ON COLUMN "GROUP_CAPACITY"."MAX_AGGR_COUNT" IS '聚合子配置最大个数，，0表示使用默认值';  
  
COMMENT ON COLUMN "GROUP_CAPACITY"."MAX_AGGR_SIZE" IS '单个聚合数据的子配置大小上限，单位为字节，0表示使用默认值';  
  
COMMENT ON COLUMN "GROUP_CAPACITY"."MAX_HISTORY_COUNT" IS '最大变更历史数量';  
  
COMMENT ON COLUMN "GROUP_CAPACITY"."GMT_CREATE" IS '创建时间';  
  
COMMENT ON COLUMN "GROUP_CAPACITY"."GMT_MODIFIED" IS '修改时间';  
  
CREATE INDEX "INDEX134406418558100"  
ON "CONFIG_TAGS_RELATION"("TENANT_ID");  
  
CREATE UNIQUE INDEX "INDEX134406537578900"  
ON "CONFIG_TAGS_RELATION"("NID");  
  
COMMENT ON TABLE "CONFIG_TAGS_RELATION" IS 'config_tag_relation';  
  
COMMENT ON COLUMN "CONFIG_TAGS_RELATION"."ID" IS 'id';  
  
COMMENT ON COLUMN "CONFIG_TAGS_RELATION"."TAG_NAME" IS 'tag_name';  
  
COMMENT ON COLUMN "CONFIG_TAGS_RELATION"."TAG_TYPE" IS 'tag_type';  
  
COMMENT ON COLUMN "CONFIG_TAGS_RELATION"."DATA_ID" IS 'data_id';  
  
COMMENT ON COLUMN "CONFIG_TAGS_RELATION"."GROUP_ID" IS 'group_id';  
  
COMMENT ON COLUMN "CONFIG_TAGS_RELATION"."TENANT_ID" IS 'tenant_id';  
  
COMMENT ON COLUMN "CONFIG_TAGS_RELATION"."NID" IS 'nid, 自增长标识';  
  
CREATE UNIQUE INDEX "INDEX134407033963000"  
ON "CONFIG_INFO_TAG"("ID");  
  
COMMENT ON TABLE "CONFIG_INFO_TAG" IS 'config_info_tag';  
  
COMMENT ON COLUMN "CONFIG_INFO_TAG"."ID" IS 'id';  
  
COMMENT ON COLUMN "CONFIG_INFO_TAG"."DATA_ID" IS 'data_id';  
  
COMMENT ON COLUMN "CONFIG_INFO_TAG"."GROUP_ID" IS 'group_id';  
  
COMMENT ON COLUMN "CONFIG_INFO_TAG"."TENANT_ID" IS 'tenant_id';  
  
COMMENT ON COLUMN "CONFIG_INFO_TAG"."TAG_ID" IS 'tag_id';  
  
COMMENT ON COLUMN "CONFIG_INFO_TAG"."APP_NAME" IS 'app_name';  
  
COMMENT ON COLUMN "CONFIG_INFO_TAG"."CONTENT" IS 'content';  
  
COMMENT ON COLUMN "CONFIG_INFO_TAG"."MD5" IS 'md5';  
  
COMMENT ON COLUMN "CONFIG_INFO_TAG"."GMT_CREATE" IS '创建时间';  
  
COMMENT ON COLUMN "CONFIG_INFO_TAG"."GMT_MODIFIED" IS '修改时间';  
  
COMMENT ON COLUMN "CONFIG_INFO_TAG"."SRC_USER" IS 'source user';  
  
COMMENT ON COLUMN "CONFIG_INFO_TAG"."SRC_IP" IS 'source ip';  
  
CREATE UNIQUE INDEX "INDEX134407798104699"  
ON "CONFIG_INFO_BETA"("ID");  
  
COMMENT ON TABLE "CONFIG_INFO_BETA" IS 'config_info_beta';  
  
COMMENT ON COLUMN "CONFIG_INFO_BETA"."ID" IS 'id';  
  
COMMENT ON COLUMN "CONFIG_INFO_BETA"."DATA_ID" IS 'data_id';  
  
COMMENT ON COLUMN "CONFIG_INFO_BETA"."GROUP_ID" IS 'group_id';  
  
COMMENT ON COLUMN "CONFIG_INFO_BETA"."APP_NAME" IS 'app_name';  
  
COMMENT ON COLUMN "CONFIG_INFO_BETA"."CONTENT" IS 'content';  
  
COMMENT ON COLUMN "CONFIG_INFO_BETA"."BETA_IPS" IS 'betaIps';  
  
COMMENT ON COLUMN "CONFIG_INFO_BETA"."MD5" IS 'md5';  
  
COMMENT ON COLUMN "CONFIG_INFO_BETA"."GMT_CREATE" IS '创建时间';  
  
COMMENT ON COLUMN "CONFIG_INFO_BETA"."GMT_MODIFIED" IS '修改时间';  
  
COMMENT ON COLUMN "CONFIG_INFO_BETA"."SRC_USER" IS 'source user';  
  
COMMENT ON COLUMN "CONFIG_INFO_BETA"."SRC_IP" IS 'source ip';  
  
COMMENT ON COLUMN "CONFIG_INFO_BETA"."TENANT_ID" IS '租户字段';  
  
COMMENT ON COLUMN "CONFIG_INFO_BETA"."ENCRYPTED_DATA_KEY" IS '密钥';  
  
CREATE UNIQUE INDEX "INDEX134408619300900"  
ON "CONFIG_INFO_AGGR"("ID");  
  
COMMENT ON TABLE "CONFIG_INFO_AGGR" IS '增加租户字段';  
  
COMMENT ON COLUMN "CONFIG_INFO_AGGR"."ID" IS 'id';  
  
COMMENT ON COLUMN "CONFIG_INFO_AGGR"."DATA_ID" IS 'data_id';  
  
COMMENT ON COLUMN "CONFIG_INFO_AGGR"."GROUP_ID" IS 'group_id';  
  
COMMENT ON COLUMN "CONFIG_INFO_AGGR"."DATUM_ID" IS 'datum_id';  
  
COMMENT ON COLUMN "CONFIG_INFO_AGGR"."CONTENT" IS '内容';  
  
COMMENT ON COLUMN "CONFIG_INFO_AGGR"."GMT_MODIFIED" IS '修改时间';  
  
COMMENT ON COLUMN "CONFIG_INFO_AGGR"."APP_NAME" IS 'app_name';  
  
COMMENT ON COLUMN "CONFIG_INFO_AGGR"."TENANT_ID" IS '租户字段';  
  
CREATE UNIQUE INDEX "INDEX134409166029299"  
ON "CONFIG_INFO"("ID");  
  
COMMENT ON TABLE "CONFIG_INFO" IS 'config_info';  
  
COMMENT ON COLUMN "CONFIG_INFO"."ID" IS 'id';  
  
COMMENT ON COLUMN "CONFIG_INFO"."DATA_ID" IS 'data_id';  
  
COMMENT ON COLUMN "CONFIG_INFO"."GROUP_ID" IS 'group_id';  
  
COMMENT ON COLUMN "CONFIG_INFO"."CONTENT" IS 'content';  
  
COMMENT ON COLUMN "CONFIG_INFO"."MD5" IS 'md5';  
  
COMMENT ON COLUMN "CONFIG_INFO"."GMT_CREATE" IS '创建时间';  
  
COMMENT ON COLUMN "CONFIG_INFO"."GMT_MODIFIED" IS '修改时间';  
  
COMMENT ON COLUMN "CONFIG_INFO"."SRC_USER" IS 'source user';  
  
COMMENT ON COLUMN "CONFIG_INFO"."SRC_IP" IS 'source ip';  
  
COMMENT ON COLUMN "CONFIG_INFO"."APP_NAME" IS 'app_name';  
  
COMMENT ON COLUMN "CONFIG_INFO"."TENANT_ID" IS '租户字段';  
  
COMMENT ON COLUMN "CONFIG_INFO"."C_DESC" IS 'configuration description';  
  
COMMENT ON COLUMN "CONFIG_INFO"."C_USE" IS 'configuration usage';  
  
COMMENT ON COLUMN "CONFIG_INFO"."EFFECT" IS '配置生效的描述';  
  
COMMENT ON COLUMN "CONFIG_INFO"."TYPE" IS '配置的类型';  
  
COMMENT ON COLUMN "CONFIG_INFO"."C_SCHEMA" IS '配置的模式';  
  
COMMENT ON COLUMN "CONFIG_INFO"."ENCRYPTED_DATA_KEY" IS '密钥';
```

### 第六步：编译打包

可以将修改好的源码包拷贝到Linux-麒麟ARM系统上进行编译打包，也可以在本机直接打包  
`命令：mvn -Prelease-nacos clean install -Dmaven.test.skip=true -Dcheckstyle.skip=true -Dpmd.skip=true -Drat.skip=true -U`  
编译好的包通常会出现在源码根目录下的target文件夹中，一个为.tar.gz，一个为.zip文件  

**注意事项：**  
如果无法启动，有种可能是**application.properties配置文件**参数问题，参考下面我的环境，打马赛克的替换为当前环境的具体参数信息，另外**开启鉴权**的相关参数信息也需要同步配置，这里就不详细展示了。

```
#指定数据源为dm
spring.sql.init.platform=dm
#指定数据源驱动
db.pool.config.driverClassName=dm.jdbc.driver.DmDriver
```

**启动完成：**  

**最后收到集团高级架构师和领导的好评：**  

