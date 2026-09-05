# Gitlab与Email集成

> 分类：CI/CD / 第15章：Gitlab工具链集成
> 原文：https://www.cuiliangblog.cn/detail/section/173068275
> 来源：崔亮的博客

---

# 配置邮件通知
## 修改Gitlab配置
编辑/etc/gitlab/gitlab.rb文件开启gitlab email。这里以QQ邮箱为例，参考文档：[https://docs.gitlab.com/omnibus/settings/smtp.html](https://docs.gitlab.com/omnibus/settings/smtp.html)

```bash
[root@tiaoban ~]# kubectl exec -it -n cicd gitlab-b5cb5f947-q8xkv -- bash
root@gitlab-b5cb5f947-q8xkv:/# vi /etc/gitlab/gitlab.rb
gitlab_rails['smtp_enable'] = true        
gitlab_rails['smtp_address'] = "smtp.qq.com"                             
gitlab_rails['smtp_port'] = 465
gitlab_rails['smtp_user_name'] = "cuiliangblog@qq.com"
gitlab_rails['smtp_password'] = "XXXXXX"
gitlab_rails['smtp_domain'] = "smtp.qq.com"          
gitlab_rails['smtp_authentication'] = "login"                                                          
gitlab_rails['smtp_enable_starttls_auto'] = false
gitlab_rails['smtp_tls'] = true                                              
gitlab_rails['smtp_pool'] = false
                                                                                  
gitlab_rails['gitlab_email_enabled'] = true                                                                                   
gitlab_rails['gitlab_email_from'] = 'cuiliangblog@qq.com'                          
gitlab_rails['gitlab_email_display_name'] = 'Gitlab' 
```

## 重载配置
```bash
root@gitlab-b5cb5f947-q8xkv:/# gitlab-ctl reconfigure
root@gitlab-b5cb5f947-q8xkv:/# gitlab-ctl restart
```

# 使用邮件通知
## 登录控制台发送测试邮件
```bash
root@gitlab-b5cb5f947-q8xkv:/# gitlab-rails console
--------------------------------------------------------------------------------
 Ruby:         ruby 3.1.5p253 (2024-04-023 revision 1945f8dc0e) [x86_64-linux]
 GitLab:       17.0.1 (bd824d1abb2) FOSS
 GitLab Shell: 14.35.0
 PostgreSQL:   14.11
------------------------------------------------------------[ booted in 42.55s ]
Loading production environment (Rails 7.0.8.1)
irb(main):001:0> Notify.test_email('cuiliang0302@qq.com', 'test email', 'gitlab email test').deliver_now
Delivered mail 66666810ce6ca_169a2ee062342@gitlab-b5cb5f947-q8xkv.mail (1193.6ms)
=> #<Mail::Message:1514680, Multipart: false, Headers: <Date: Mon, 10 Jun 2024 02:42:24 +0000>, <From: Gitlab <cuiliangblog@qq.com>>, <Reply-To: Gitlab <noreply@gitlab.local.com>>, <To: cuiliang0302@qq.com>, <Message-ID: <66666810ce6ca_169a2ee062342@gitlab-b5cb5f947-q8xkv.mail>>, <Subject: test email>, <Mime-Version: 1.0>, <Content-Type: text/html; charset=UTF-8>, <Content-Transfer-Encoding: 7bit>, <Auto-Submitted: auto-generated>, <X-Auto-Response-Suppress: All>>
```

![](assets/04-CI-CD/9831e758c436fabc7e6c.png)

## 流水线配置邮件通知
进入项目——>配置——>集成——>流水线状态电子邮件

![](assets/04-CI-CD/362f8f537f6f50d7fff8.png)

配置邮件通知人、通知条件

![](assets/04-CI-CD/ca80d33cb80050ca1172.png)

运行流水线测试，查看邮件内容。

![](assets/04-CI-CD/b104f86da58ea0348d51.png)




