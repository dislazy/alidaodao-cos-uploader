'use strict';
const fs = require("fs");
const path = require('path');
const Cos = require('cos-nodejs-sdk-v5');
const util = require('./util.js');
const chalk = require('chalk');
const qCdnSDK = require('./cdnTool');

let config = {}

//初始化对象
var QCosSDK = function () {

}

let client = {}

QCosSDK.prototype.putObjectToCos = function (userConfig) {
    checkConfigs(userConfig)
    config = userConfig;
    config.targetPath = userConfig.targetPath || '';
    config.enableCdn = userConfig.enableCdn || false;
    config.publicPath = path.join(userConfig.distPath);
    //初始化COS客户端
    client = new Cos({
        SecretId: config.secretId,
        SecretKey: config.secretKey,
    });
    let result = putObjectToCosAndFlushCdnCache(config.targetPath);
}

/** *上传文件启动 *@param {string} dirName 将要上传的文件名 */
async function putObjectToCosAndFlushCdnCache(targetPath) {
    try {
        //删除COS中bucket目录中的所以文件
        await setTimeout(function () {
            deleteTargetCosObjects(targetPath);
        }, 3000);
        //将源文件夹中的文件全部上传到COS中
        await setTimeout(function () {
            putSrcObjectToCos(config.publicPath, targetPath);
        }, 5000);
        //如果需要刷新cdn目录，及时将CDN目录给刷新一下
        if (config.enableCdn) {
            await setTimeout(function () {
                flushCdnPathCache();
            }, 8000);
        }
    } catch (err) {
        console.log('[QCosSDK][putObjectToCosAndFlushCdnCache] put object fail ,error: ', err);
    }
}


/**
 * 获取Bucket中的文件列表并且进行删除
 *
 * @param dir
 * @returns {Promise<void>}
 */
async function deleteTargetCosObjects(dir) {
    //获取bucket中的文件
    await client.getBucket(
        {
            Bucket: config.bucket,
            Region: config.region,
        }, function (err, result) {
            if (err) {
                console.log('[QCosSDK][deleteTargetCosObjects]get cos bucket object list fail,err: ', err);
                return;
            }
            //解读文件
            if (result.Contents) {
                let keys = [];
                result.Contents.forEach(function (obj) {
                    keys.push({Key: obj.Key});
                });
                //删除文件列表
                deleteMultipleObject(keys);
            }
        }
    );
}

/**
 * 批量删除文件列表
 *
 * @param keys
 * @returns {Promise<void>}
 */
async function deleteMultipleObject(keys) {
    try {
        await client.deleteMultipleObject({
            Bucket: config.bucket,
            Region: config.region,
            Objects: keys,
        });
        console.log('[QCosSDK][deleteMultipleObject] delete files in bucket : ' + config.bucket + ' success');
    } catch (e) {
        console.log('[QCosSDK][deleteMultipleObject]delete files fail ,error : ', e);
    }
}

/**
 * 上传目录中的文件到文件夹中
 *
 * @param src
 * @param dist
 */
function putSrcObjectToCos(src, dist) {
    //获取所有的文件列表
    let docs = fs.readdirSync(src);
    //循环进行文件上传
    docs.forEach(function (doc) {
        let _src = src + '/' + doc,
            _dist = dist + '/' + doc;
        let st = fs.statSync(_src);
        // 判断是否为文件
        if (st.isFile()) {
            putSingleObjectToCos(_src, _dist);
        }
        // 如果是目录则递归调用自身
        else if (st.isDirectory()) {
            putSrcObjectToCos(_src, _dist);
        }
    });
}

/** *单个文件上传至cos */
async function putSingleObjectToCos(src, dist) {
    await client.putObject(
        {
            Bucket: config.bucket,
            Region: config.region,
            Key: dist,
            Body: fs.createReadStream(src),
        }, function (err, data) {
            if (err) {
                console.log('[QCosSDK][putSingleObjectToCos]upload data error :' + err);
                return;
            }
            console.log('[QCosSDK][putSingleObjectToCos] put ' + dist + ' success ');
        }
    );
}


/**
 * 刷新CDN的目录缓存
 *
 * @returns {Promise<void>}
 */
async function flushCdnPathCache() {
    let cdnConfig = {
        secretId: config.secretId,
        secretKey: config.secretKey,
        cdnUrl: config.cdnUrl
    };
    //刷新CDN文件
    qCdnSDK.flushCdnCache(cdnConfig);
}

/**
 * 校验 配置文件是否正确
 *
 * @param config
 * @returns {boolean}
 */
function checkConfigs(config) {
    if (!config.secretId || !config.secretKey || !config.region || !config.bucket || !config.distPath) {
        let tips = [
            chalk.red('[QCosSDK]由于配置错误，部署到 腾讯云COS 失败！'),
            '请检查输入的参数中中是否包含了以下信息',
            '    bucket: yourBucket',
            '    region: yourRegion',
            '    secretId: yourSecretId',
            '    secretKey: yourSecretKey',
            '    distPath: distPath',
            '    targetPath： targetPath',
            '',
            '您还可以访问仓库，以获取详细说明： ' + chalk.underline('https://github.com/dislazy/alidaodao-cos-uploader')
        ]
        console.log(tips.join('\n'));
        return false;
    }
    //如果包含cdn还需要校验CDN
    if (config.cdnEnable && _.size([config.cdnUrl]) <= 0) {
        let tips = [
            chalk.red('[QCosSDK]您开启了cdn目录刷新,但是由于配置错误，刷新CDN目录失败！'),
            '请检查输入的参数中中是否包含了以下信息',
            '  cdnUrl: []',
            '',
            '您还可以访问插件仓库，以获取详细说明： ' + chalk.underline('https://github.com/dislazy/alidaodao-cos-uploader')
        ]
        //校验CDN目录的地址
        let cdnUrls = [];
        config.cdnUrl.for(e => {
            cdnUrls.push(e.replace(/([^\/])$/, "$1\/"));
        });
        config.cdnUrl = cdnUrls;
    }
}

var qCosSDK = new QCosSDK();

module.exports = qCosSDK;