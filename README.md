# 本地开发环境代理和配置

## 代理原理
通过内网dns泛解析域名*.fedev.xxxx.com，将请求解析到192.168.12.75。

查询数据库，活动域名对应的IP和端口。

拉取数据返回。

## 配置接口
```
fedev.xxxx.com/update 参数ukey
fedev.xxxx.com/ip
fedev.xxxx.com/ukey 参数ukey
fedev.xxxx.com/host 参数ip、host、port、ukey、rm
```
