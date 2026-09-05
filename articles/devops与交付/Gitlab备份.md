## 本地备份

直接使用Gitlab自带的命令即可：

```yaml
gitlab-rake gitlab:backup:create
```

默认会将`tar`包备份到`/var/opt/gitlab/backups`目录下。

​  

如果要更改备份目录，可以通过修改配置文件`/etc/gitlab/gitlab.rb`完成。

```yaml
gitlab_rails['backup_path'] = '/mnt/backups'
```

  

然重载配置文件即可。

```yaml
gitlab-ctl reconfigure
```

## 异地备份

### 直接通过修改Gitlab配置文件备份至阿里的OSS

修改/opt/gitlab/etc/gitlab.rb文件里的内容，如下：

```yaml
gitlab_rails['backup_upload_connection'] = {

'provider' => 'aliyun',

'aliyun_accesskey_id' => '有权限访问存储桶的用户key',

'aliyun_accesskey_secret' => '有权限访问存储桶的密钥',

'aliyun_oss_endpoint' => 'http://oss-cn-shanghai-internal.aliyuncs.com',

'aliyun_oss_bucket' => 'my-backup',    //OSS名称

'aliyun_oss_location' => 'shanghai'      //oss地域

}

gitlab_rails['backup_upload_remote_directory'] = 'gitlab'    //存储gitlab备份的桶子目录
```

然后重载配置文件

```yaml
gitlab-ctl reconfigre
```

然后就可以使用如下命令进行备份了。

```yaml
gitlab-rake gitlab:backup:create
```

### 通过脚本命令本地备份以及上传阿里OSS

除了直接备份到阿里OSS之外，还可以通过脚本备份到阿里的OSS。

​  

这中间会使用到阿里的一个工具`ossutil64`【1】。

​  

##### 1、下载工具到备份脚本目录

```yaml
mkdir ~/scripts
cd ~/scripts
wget https://gosspublic.alicdn.com/ossutil/1.7.7/ossutil64
```

​  

##### 2、配置ossutils64命令的配置文件

```yaml
cat ~/scripts/.ossutilconfig 
[Credentials]
language=CH
endpoint=http://oss-cn-zhangjiakou.aliyuncs.com
accessKeyID=xxxxxx
accessKeySecret=xxxxxxx
bucketname=backup

```

​  

##### 3、编写shell脚本

```shell
# Gitlab自动备份脚本

#Gitlab 备份地址
LocalBackDir=/var/opt/gitlab/backups

#备份日志文件
LogFile=./remote_backup.log

#新建备份日志文件
touch $LogFile

echo "-------------------------------------------------------------------------" >> $LogFile

#记录本地生成gitlab备份日志
echo "Gitlab auto backup at local server, start at $(date +"%Y-%m-%d %H:%M:%S")" >>  $LogFile

#执行gitlab本地备份
gitlab-rake gitlab:backup:create >> $LogFile 2>&1

# $?符号显示上一条命令的返回值，如果为0则代表执行成功，其他表示失败
if [ $? -eq 0 ];then
   #追加日志到日志文件
   echo "Gitlab auto backup at local server successed at $(date +"%Y-%m-%d %H:%M:%S")" >> $LogFile
else
   #追加日志到日志文件
   echo "Gitlab auto backup at local server failed at $(date +"%Y-%m-%d %H:%M:%S")" >> $LogFile
fi

#查找本地备份目录修改时间为10分钟以内且后缀为.tar的Gitlab备份文件
Backfile_Send_To_Remote=`find $LocalBackDir -type f  -mmin -10 -name '*.tar' | tail -1` >> $LogFile 2>&1

# 备份到阿里云的oss
cd ~/scripts
./ossutil64 cp ${Backfile_Send_To_Remote} oss://resico-backup/backup/gitlab/ -c ./.ossutilconfig
```

​  

##### 添加定时备份

```yaml
0 2 * * * /root/scripts/backup_gitlab.sh
```

​  

## 恢复

不论是哪种备份方式，恢复都一样。

​  

##### 1、根据情况看是否需要停服务，数据库不能停

  

##### 2、将需要恢复的备份文件拷贝到/var/opt/gitlab/backups/目录下

​  

##### 3、设置备份文件的权限为777

```yaml
chmod 777 xxxxx
```

​  

##### 4、执行恢复命令

```yaml
gitlab-rake gitlab:backup:restore BACKUP=xxxxxx
```

  

> \# 注意此处的BACKUP为备份文件编号,
> 
> \# 如之前的文件1508412719\_2017\_10\_19\_10.0.2\_gitlab\_backup.tar
> 
> \# 则BACKUP为1508412719\_2017\_10\_19\_10.0.2

​  

##### 5、启动或者重启Gitlab

```yaml
# 启动
gitlab-ctl start
# 重启
gitlab-ctl restart
```

​  

## 应用

【1】 [https://help.aliyun.com/document\_detail/50451.html](https://help.aliyun.com/document_detail/50451.html)