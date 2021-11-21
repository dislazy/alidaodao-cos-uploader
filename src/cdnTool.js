const tencentcloud = require("tencentcloud-sdk-nodejs");
var _ = require('lodash');

const CdnClient = tencentcloud.cdn.v20180606.Client;

//初始化
var QCdnSDK = function () {

}


/**
 * 刷新CDN缓存信息
 */
QCdnSDK.prototype.flushCdnCache = function (config) {
    //校验CDN需要的参数是否正确
    checkCdnConfig(config)
    //配置信息
    const clientConfig = {
        credential: {
            secretId: config.secretId,
            secretKey: config.secretKey,
        },
        region: "",
        profile: {
            httpProfile: {
                endpoint: "cdn.tencentcloudapi.com",
            },
        },
    };
    //创建client
    const client = new CdnClient(clientConfig);
    //请求CDN的刷新目录接口，进行目录刷新
    client.PurgePathCache({
        "Paths": config.cdnUrl,
        "FlushType": "delete",
        "UrlEncode": false
    }).then(
        (data) => {
            console.log('[QCosSDK][flushCdnCache]cdn flsuh success,requestId: ' + data.RequestId + ',taskId: ' + data.TaskId);
        },
        (err) => {
            console.error("[QCosSDK][flushCdnCache]cdn flush fail ,error：", err);
        }
    );
}

/**
 * 校验参数是否正确
 *
 * @param userConfig
 */
function checkCdnConfig(userConfig) {
    if (!_.isPlainObject(userConfig)
        || !_.isString(userConfig['secretKey'])
        || !_.isString(userConfig['secretId'])
        || _.size(userConfig['cdnUrl'] <= 0)
    ) {
        throw new Error('::config function should be called required an object param which contains secretKey[String] and secretId[String]')
    }
}


var qCdnSDK = new QCdnSDK();

module.exports = qCdnSDK;




