# alidaodao-cos-uploader

项目打包完成后将对应的文件上传腾讯COS上，并且可以刷新对应的CDN目录。

## 说明

- **上传的时候，会自动清理远程bucket中的多余文件，请谨慎使用！**

- **更新 CDN缓存需要授权，如果使用子账号，请同时赋予该账号此权限！**

- 目前仅支持上传全量文件到腾讯云COS上，本次没有进行文件的MD5比对，后期如果需要会加入对应功能

- 目前仅支持COS，后期有需要可以兼容到阿里云OSS和AWS的S3等对象存储

## 安装方法

``` bash
npm install alidaodao-cos-uploader --save
```

## 配置

``` js
//上传文件并且刷新cdn
var qCosSDK = require("alidaodao-cos-uploader");
const config = {
    secretKey: '',
    secretId: '',
    bucket: '',
    region: 'ap-beijing',
    distPath: 'dist',
    targetPath: '',
    enableCdn: true,
    cdnUrl: ['https://abc.com/', 'https://www.abc.com/'],
};
qCosSDK.putObjectsToCos(config);

//仅刷新CDN
var qCosSDK = require("alidaodao-cos-uploader");
const config = {
    secretKey: '',
    secretId: '',
    enableCdn: true,
    cdnUrl: ['https://abc.com/', 'https://www.abc.com/'],
};
qCosSDK.flushCdnPathCache(config);
```

`secretId` 和 `secretKey`：在 COS控制台中，找到左侧的**密钥管理**，点进去，按照提示添加子账号，并设置秘钥。同时要给子账号赋予
COS相关的权限，还有CDN刷新的权限。不会配置的可以参考 [官方示例](https://cloud.tencent.com/document/product/228/14867)

`bucket` 和 `region`： 在腾讯云的对象存储中，新建或找到你的 bucket，然后找到 **默认域名** 信息，会看到一个类似这样的域名: `fun-12313.cos.ap-shanghai.myqcloud.com`
，第一个点前面的 `fun-12313` 就是 `bucket` 名称，第二个点和第三个点之间的 `ap-shanghai`，就是你的 COS 所在地域，填写到 `region` 中。

`distPath` 和 `targetPath`：**distPath**是你的源文件的文件夹，填入是不需要带`/`。**targetPath**是bucket的目标文件夹，如果为根目录，传空字符串即可,同样不需要用带`/`。

`cdnUrl`： 是你的对象存储绑定的CDN域名，没有启用CDN，将`enableCdn`设置为**false**后可不设置

## License

MIT
