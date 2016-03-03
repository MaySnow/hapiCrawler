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
    var daumList = [];
    var dcList = [];
    var dcListPage = [];
    var recommendDcList = [];
    var recDcPage = [];

    var commonTabList = [{
        title : 'Naver',
        cur : '',
        href : '/'
    },{
        title : 'Daum',
        cur : '',
        href : '/daum'
    },{
        title : 'dcinside',
        cur : '',
        href : '/dcinside/1'
    },{
        title : 'dcinside 精华',
        cur : '',
        href : '/dcinside/recommend/1'
    }];

    const dcCraw = new Crawler({
        maxConnections : 10,
        // This will be called for each crawled page
        callback : function (error, result, $) {

            // $ is Cheerio by default
            //a lean implementation of core jQuery designed specifically for the server
        }
    });

    getData();


    setInterval(function(){
        getData();
    },1000*60*5);


    server.route({
        method: 'GET',
        path: '/',
        handler: function (request, reply) {

            var curTabList = JSON.parse(JSON.stringify(commonTabList));
            curTabList[0].cur = 'cur';

            if(list.length) {
                render(reply,list);
            } else {
                let intervalId = setInterval(function(){
                     if(list.length) {
                         render(reply,list);
                         clearInterval(intervalId);
                     }
                },300);
            }


            function render(reply,list){
                reply.view('index', {
                    title: "bugommy's Naver 新闻",
                    list: list,
                    tabList : curTabList
                });
            }


        }
    });

    server.route({
        method: 'GET',
        path: '/daum',
        handler: function (request, reply) {

            var curTabList = JSON.parse(JSON.stringify(commonTabList));
            curTabList[1].cur = 'cur';

            if(daumList.length) {
                render(reply,daumList);
            } else {
                let intervalId = setInterval(function(){
                    if(daumList.length) {
                        render(reply,daumList);
                        clearInterval(intervalId);
                    }
                },300);
            }


            function render(reply,daumList){
                reply.view('pages/daum', {
                    title: "bugommy's Daum 新闻",
                    list: daumList,
                    tabList : curTabList
                });
            }


        }
    });

    server.route({
        method: 'GET',
        path: '/dcinside/{id}',
        handler: function (request, reply) {
            var pageNum = request.params.id;
            var curTabList = JSON.parse(JSON.stringify(commonTabList));
            curTabList[2].cur = 'cur';

            if(pageNum === 1) {
                if(dcList.length) {
                    render(reply,dcList,dcListPage);
                } else {
                    let intervalId = setInterval(function(){
                        if(dcList.length) {
                            render(reply,dcList,dcListPage);
                            clearInterval(intervalId);
                        }
                    },300);
                }
            } else {
                dcCraw.queue([{
                    uri : 'http://gall.dcinside.com/board/lists/?id=parkbogum&page=' + pageNum,
                    callback : function(error, result, $) {
                        if (!$) {
                            console.log(error);
                            console.log(getDateTime() + ' dcinside page'+pageNum+' 返回出错');
                        }
                        dcCommon($,'normal',function(result){
                            render(reply,result.dcList,result.listPage)
                        });
                    }
                }]);
            }



            function render(reply,dcList,listPage){
                reply.view('pages/dcinside', {
                    title: "bugommy's dcinside",
                    list: dcList,
                    dcListPage: listPage,
                    tabList : curTabList
                });
            }


        }
    });

    server.route({
        method: 'GET',
        path: '/dcinside/recommend/{id}',
        handler: function (request, reply) {
            var pageNum = request.params.id;
            var curTabList = JSON.parse(JSON.stringify(commonTabList));
            curTabList[3].cur = 'cur';


            if(pageNum === 1) {
                if(dcList.length) {
                    render(reply,recommendDcList,recDcPage);
                } else {
                    let intervalId = setInterval(function(){
                        if(dcList.length) {
                            render(reply,recommendDcList,recDcPage);
                            clearInterval(intervalId);
                        }
                    },300);
                }
            } else {
                dcCraw.queue([{
                    uri : 'http://gall.dcinside.com/board/lists/?id=parkbogum&page=' + pageNum +'&exception_mode=recommend',
                    callback : function(error, result, $) {
                        if (!$) {
                            console.log(error);
                            console.log(getDateTime() + ' dcinside 精华 page'+pageNum+' 返回出错');
                        }
                        dcCommon($,'recommend',function(result){
                            render(reply,result.dcList,result.listPage)
                        });
                    }
                }]);
            }




            function render(reply,recommendDcList,listPage){
                reply.view('pages/dcinside', {
                    title: "bugommy's dcinside",
                    list: recommendDcList,
                    dcListPage: listPage,
                    tabList : curTabList
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
        //naver
        dcCraw.queue([{
            uri : 'https://search.naver.com/search.naver?ie=utf8&where=news&query=%EB%B0%95%EB%B3%B4%EA%B2%80&sm=tab_tmr&frm=mr&sort=0',
            callback : function(error, result, $){
                if(!$) {
                    console.log(error);
                    console.log(getDateTime() + ' naver 返回出错');
                }
                var templateList = [];
                var count = 0;
                $('body').find('.type01').children().each(function(idx){
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

                    templateList.push(template);

                });

                //迭代
                function translateGroup(){
                    if(count === templateList.length){
                        //翻译结束
                        list = templateList;
                        return
                    }
                    var curObj =  templateList[count];
                    translate(encodeURIComponent(curObj.title + 'mayTimeSplit' + curObj.time),function(titleReault){
                        var titleResults = titleReault.split('mayTimeSplit');
                        templateList[count].transTitle = titleResults[0];
                        templateList[count].transTime = titleResults[1];
                        translate(encodeURIComponent(curObj.desc),function(descResult){
                            templateList[count].transDesc = descResult;
                            count++;
                            translateGroup();
                        })
                    })
                }

                translateGroup();


            }
        }]);

        //daum
        dcCraw.queue([{
            uri : 'https://m.search.daum.net/search?w=news&q=%EB%B0%95%EB%B3%B4%EA%B2%80&begindate=&enddate=',
            callback : function(error, result, $){
                if(!$) {
                    console.log(error);
                    console.log(getDateTime() + ' daum 返回出错');
                }
                let templateList = [];
                let count = 0;
                $('body').find('.list_info').children().each(function(idx){
                    var $title =  $(this).find('.wrap_tit');
                    var title = $title.text();
                    var link = $(this).find('.info_item').attr('href');
                    var imgSrc = $(this).find('.thumb').find('img').attr('src');
                    var time = $(this).find('.wrap_subinfo').text();
                    var desc = $(this).find('.desc').text();

                    let template = {
                        title : title,
                        link : link,
                        imgSrc : imgSrc,
                        time : time,
                        desc : desc
                    };

                    templateList.push(template);
                });

                //迭代
                function translateGroup(){
                    if(count === templateList.length){
                        //翻译结束
                        daumList = templateList;
                        return
                    }
                    var curObj =  templateList[count];
                    translate(encodeURIComponent(curObj.title + 'mayTimeSplit' + curObj.time),function(titleReault){
                        var titleResults = titleReault.split('mayTimeSplit');
                        templateList[count].transTitle = titleResults[0];
                        templateList[count].transTime = titleResults[1];
                        translate(encodeURIComponent(curObj.desc),function(descResult){
                            templateList[count].transDesc = descResult;
                            count++;
                            translateGroup();
                        })
                    })
                }

                translateGroup();

            }
        }]);


        //dcinside
        dcCraw.queue([{
            uri : 'http://gall.dcinside.com/board/lists/?id=parkbogum',
            callback : function(error, result, $) {
                if (!$) {
                    console.log(error);
                    console.log(getDateTime() + ' dcinside 返回出错');
                }
                dcCommon($,'normal');
            }
        }]);

        //dcinside精华
        dcCraw.queue([{
            uri : 'http://gall.dcinside.com/board/lists/?id=parkbogum&page=1&exception_mode=recommend',
            callback : function(error, result, $) {
                if (!$) {
                    console.log(error);
                    console.log(getDateTime() + ' dcinside 精华 返回出错');
                }
                dcCommon($,'recommend');
            }
        }]);

    }

    function dcCommon($,type,callback){
        var templateList = [];
        var count = 0;
        $('body').find('.list_thead').children().each(function(idx){
            if(idx > 0 ) {
                var $subject =  $(this).find('.t_subject').find('a');
                var template = {
                    notice : $(this).find('.t_notice').text(),
                    subject : $subject.eq(0).text(),
                    subjectSrc : 'http://gall.dcinside.com/' + $subject.eq(0).attr('href'),
                    iconClass : $subject.eq(0).attr('class'),
                    commentView : $subject.eq(1).text(),
                    commentSrc : 'http://gall.dcinside.com/' + $subject.eq(1).attr('href'),
                    writerUser : $(this).find('.t_writer').text(),
                    date : $(this).find('.t_date').text(),
                    hits : $(this).find('td').eq(4).text(),
                    answer : $(this).find('td').eq(5).text()
                };
                templateList.push(template);
            }

        });
        //迭代
        function translateGroup(){
            if(count === templateList.length){
                //翻译结束
                var pageArr =  dcTransResult($,type);

                if(callback) {
                    callback({
                        dcList : templateList,
                        listPage : pageArr
                    });
                } else {
                   if(type === 'recommend') {
                       recommendDcList = templateList;
                       recDcPage = pageArr;
                   } else {
                       dcList = templateList;
                       dcListPage = pageArr;
                   }
                }


                return
            }
            var curObj =  templateList[count];
            translate(encodeURIComponent(curObj.subject),function(subjectReault){
                templateList[count].subjectReault = subjectReault;
                count++;
                translateGroup();
            })
        }

        translateGroup();

    }

    function dcTransResult($,type){
        var $dcListPage =  $('body').find("#dgn_btn_paging");
        let tempPage = [];
        $dcListPage.children().each(function(){
            var curText = $(this).text();
            if(!$(this).hasClass('on')) {
                tempPage.push({
                    href : (type === 'recommend' ? '/dcinside/recommend/' : '/dcinside/')  + getParamer($(this).attr('href')).page,
                    text : curText,
                    cur : ''
                });
            } else {
                tempPage.push({
                    href : 'javascript:;',
                    text : curText,
                    cur : 'on'
                });
            }

        });

        return tempPage
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

    function sortList(lists){
        var temp;

        for(var i=0;i<lists.length;i++){ //比较多少趟，从第一趟开始

            for(var j=0;j<lists.length-i-1;j++){ //每一趟比较多少次数

                if(lists[j].index>lists[j+1].index){
                    temp=lists[j];
                    lists[j]=lists[j+1];
                    lists[j+1]=temp;
                }
            }
        }
        return lists;
    }

    /**
     * 获取url参数
     * @param url
     * @returns {{}}
     */
    function getParamer(url){
        if(url.indexOf('?') === -1) {
            return
        }
        var query_string = {};
        var paramers =  url.split('?')[1];
        var vars = (paramers.indexOf('&') === -1 ? [paramers] : paramers.split("&"));
        for (var i=0;i<vars.length;i++) {
            var pair = vars[i].split("=");
            // If first entry with this name
            if (typeof query_string[pair[0]] === "undefined") {
                query_string[pair[0]] = decodeURIComponent(pair[1]);
                // If second entry with this name
            } else if (typeof query_string[pair[0]] === "string") {
                var arr = [ query_string[pair[0]],decodeURIComponent(pair[1]) ];
                query_string[pair[0]] = arr;
                // If third or later entry with this name
            } else {
                query_string[pair[0]].push(decodeURIComponent(pair[1]));
            }
        }
        return query_string;
    }

};
