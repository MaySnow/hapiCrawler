/**
 * Created by yuxuemei on 2016/2/29.
 */
'use strict';
module.exports = function(server){
    const Wreck = require('wreck');
    const Crawler = require("crawler");
    const url = require('url');

    var list = [];
    var count = 0;

    getData();

    setInterval(function(){
        getData();
    },1000*60*10);


    server.route({
        method: 'GET',
        path: '/',
        handler: function (request, reply) {

            if(list.length) {
                render(reply,list);
            } else {
                var intervalId = setInterval(function(){
                     if(list.length) {
                         render(reply,list);
                         clearInterval(intervalId);
                     }
                },300);
            }


            function render(reply,list){
                reply.view('index', {
                    title: "bugommy's的新闻",
                    list: list
                });
            }


        }
    });

    /**
     * 翻译
     * @param content 翻译的内容
     * @param callback 回调
     */
    function translate(content,callback){
        Wreck.request('get', 'http://fy.iciba.com/ajax.php?a=fy&f=ko&t=zh&w=' +content,  { rejectUnauthorized: false, agent: null },(err, res) => {
            Wreck.read(res, null, (err, body) => {
                var result = JSON.parse(body.toString('utf8'));

                callback(result.content.out);
            });
        });
    }

    /**
     * 获取网页数据
     */
    function getData(){
        count++;
        console.log(getDateTime() + '  链接次数：' + count);
        var c = new Crawler({
            maxConnections : 10,
            // This will be called for each crawled page
            callback : function (error, result, $) {

                // $ is Cheerio by default
                //a lean implementation of core jQuery designed specifically for the server
            }
        });

        //naver
        c.queue([{
            uri : 'https://search.naver.com/search.naver?ie=utf8&where=news&query=%EB%B0%95%EB%B3%B4%EA%B2%80&sm=tab_tmr&frm=mr&sort=0',
            callback : function(error, result, $){
                $('body').find('.type01').children().each(function(){
                    var $title =  $(this).find('._sp_each_title');
                    var title = $title.text();
                    var link = $title.attr('href');
                    var imgSrc = $(this).find('.thumb').find('img').attr('src');
                    var time = $(this).find('.txt_inline').text();
                    var desc = $(this).find('dl').children().eq(2).text();

                    var template = {
                        title : title,
                        link : link,
                        imgSrc : imgSrc,
                        time : time,
                        desc : desc
                    };


                    translate(encodeURIComponent(title + 'mayTimeSplit' + time),function(titleReault){
                        var titleResults = titleReault.split('mayTimeSplit');
                        template.transTitle = titleResults[0];
                        template.transTime = titleResults[1];
                        translate(encodeURIComponent(desc),function(descResult){
                            template.transDesc = descResult;
                            list.push(template);
                        })
                    });

                });
            }
        }]);
    }

    /**
     * 获取当前时间
     * @returns {string}
     */
    function getDateTime() {

        var date = new Date();

        var hour = date.getHours();
        hour = (hour < 10 ? "0" : "") + hour;

        var min  = date.getMinutes();
        min = (min < 10 ? "0" : "") + min;

        var sec  = date.getSeconds();
        sec = (sec < 10 ? "0" : "") + sec;

        var year = date.getFullYear();

        var month = date.getMonth() + 1;
        month = (month < 10 ? "0" : "") + month;

        var day  = date.getDate();
        day = (day < 10 ? "0" : "") + day;

        return year + "/" + month + "/" + day + " " + hour + ":" + min + ":" + sec;

    }

};
