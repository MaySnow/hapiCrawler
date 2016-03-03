/**
 * Created by yuxuemei on 2016/2/29.
 */

'use strict';

const Hapi = require('hapi');
const Good = require('good'); //打印log
const Vision = require('vision');
const Inert = require('inert');//注意对应版本，不然会报错
const Path = require('path');

const server = new Hapi.Server();

const router = require('./server/index.js');
const hbs = require('handlebars');


//hbs layout扩展
var blocks = {};
hbs.registerHelper('extend', function(name, context) {
    var block = blocks[name];
    if (!block) {
        block = blocks[name] = [];
    }
    if(context.fn) {
        block.push(context.fn(this)); // for older versions of handlebars, use block.push(context(this));
    }
});
hbs.registerHelper('block', function(name, context) {
    var len = (blocks[name] || []).length;
    var val = (blocks[name] || []).join('\n');
    // clear the block
    blocks[name] = [];
    return len ? val : context.fn ? context.fn(this) : '';
});

hbs.registerHelper('blockTemp', function(name, context) {
    var tempObj = {};
    tempObj[name] =  context.fn ? context.fn(this) : '';

    return JSON.stringify(tempObj) + 'block-temp-handlerbar-split'
});


//添加连接信息
server.connection({
    //host: '172.16.74.102',
    port: 3000,
    routes: {
        files: {
            relativeTo: Path.join(__dirname, 'resource')
        }
    }
});


//控制台信息
server.register([
    {
        register: Good,
        options: {
            reporters: [{
                reporter: require('good-console'),
                events: {
                    //response: '*',
                    log: '*'
                }
            }]
        }

    },
    //session
    {
        register: require('yar'),
        options: {
            storeBlank: false,
            cookieOptions: {
                password: 'password',
                isSecure: false
            }
        }
    },
    Inert,
    Vision
], (err) => {
    if (err) {
        throw err; // something bad happened loading the plugin
    }

    server.app.staticPath = '/resource';

//静态资源 依赖 Inert
server.route({
    method: 'GET',
    path: '/{param*}',
    handler: {
        directory: {
            path: '.',
            redirectToSlash: true,
            index: true
        }
    }
});

//网页模板
server.views({
    engines: {
        html: hbs
    },
    path: __dirname + '/views',
    layoutPath: __dirname  + '/views/layout',
    layout: 'default',
    helpersPath: __dirname + '/views/helpers',
    partialsPath: __dirname + '/views/partials',
    isCached: false
});

//路由
router(server);


server.start(() => {
    server.log('info', 'Server running at: ' + server.info.uri);
});
});
