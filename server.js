/**
 * Created by yuxuemei on 2016/2/29.
 */

'use strict';

/*var Crawler = require("crawler");
var url = require('url');

var c = new Crawler({
    maxConnections : 10,
    // This will be called for each crawled page
    callback : function (error, result, $) {
        // $ is Cheerio by default
        //a lean implementation of core jQuery designed specifically for the server
        $('body').find('.type01').children().each(function(){
            var $title =  $(this).find('._sp_each_title');
            var title = $title.text();
            var link = $title.attr('href');
            var imgSrc = $(this).find('.thumb').find('img').attr('src');
            var source = $(this).find('._sp_each_source').text();
            var desc = $(this).find('dl').children().eq(2).text();

              console.log(title);
             console.log(link);
             console.log(imgSrc);
             console.log(source);
             console.log(desc);
             console.log('-----------------------');

        });

    }
});

// Queue just one URL, with default callback
c.queue('https://search.naver.com/search.naver?ie=utf8&where=news&query=%EB%B0%95%EB%B3%B4%EA%B2%80&sm=tab_tmr&frm=mr&sort=0');*/




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
    //host: 'localhost',
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
                    response: '*',
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
