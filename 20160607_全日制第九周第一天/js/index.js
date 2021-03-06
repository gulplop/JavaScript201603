~function (pro) {
    //myTrim:Remove the string and space
    pro.myTrim = function myTrim() {
        return this.replace(/(^ +| +$)/g, "");
    };

    //mySub:Intercept string, this method is distinguished in English
    pro.mySub = function mySub() {
        var len = arguments[0] || 10, isD = arguments[1] || false, str = "", n = 0;
        for (var i = 0; i < this.length; i++) {
            var s = this.charAt(i);
            /[\u4e00-\u9fa5]/.test(s) ? n += 2 : n++;
            if (n > len) {
                isD ? str += "..." : void 0;
                break;
            }
            str += s;
        }
        return str;
    };

    //myFormatTime:Format time
    pro.myFormatTime = function myFormatTime() {
        var reg = /^(\d{4})(?:-|\/|\.|:)(\d{1,2})(?:-|\/|\.|:)(\d{1,2})(?: +)?(\d{1,2})?(?:-|\/|\.|:)?(\d{1,2})?(?:-|\/|\.|:)?(\d{1,2})?$/g, ary = [];
        this.replace(reg, function () {
            ary = ([].slice.call(arguments)).slice(1, 7);
        });
        var format = arguments[0] || "{0}年{1}月{2}日{3}:{4}:{5}";
        return format.replace(/{(\d+)}/g, function () {
            var val = ary[arguments[1]];
            return val.length === 1 ? "0" + val : val;
        });
    };

    //queryURLParameter:Gets the parameters in the URL address bar
    pro.queryURLParameter = function queryURLParameter() {
        var reg = /([^?&=]+)=([^?&=]+)/g, obj = {};
        this.replace(reg, function () {
            obj[arguments[1]] = arguments[2];
        });
        return obj;
    };
}(String.prototype);

var $myScroll = new IScroll("#match", {
    mouseWheel: true,
    scrollbars: true,
    bounce: false,
    momentum: false
});

//->计算MATCH区域的高度
var $match = $(".match"), winH = null;
$(window).on("load resize", function () {
    winH = document.documentElement.clientHeight || document.body.clientHeight;
    $match.css("height", winH - 40 - 82);
    $myScroll.refresh();
});

//->进行CALENDAR区域的数据请求
var $calendarCallBackList = $.Callbacks();
function calendarBind(jsonData) {
    if (jsonData && jsonData["data"]) {
        var tempData = jsonData["data"],
            today = tempData["today"],
            data = tempData["data"];
        $calendarCallBackList.fire(today, data);
    }
}
$.ajax({
    url: "http://matchweb.sports.qq.com/kbs/calendar?columnId=100000",
    type: "get",
    dataType: "jsonp",
    jsonpCallback: "calendarBind"
});

//->开始CALENDAR区域的数据绑定
var $calendarUL = $(".calendarList>ul"),
    minL = 0,
    maxL = 0;
$calendarCallBackList.add(function (today, data) {
    var str = '';
    $.each(data, function (index, curData) {
        str += '<li time="' + curData["date"] + '">';
        str += '<span class="week">' + curData["weekday"] + '</span>';
        str += '<span class="date">' + curData["date"].myFormatTime("{1}-{2}") + '</span>';
        str += '</li>';
    });
    $calendarUL.html(str).css("width", data.length * 105);
    minL = -((data.length - 7) * 105);
});

//->开始CALENDAR区域的日期定位:开始的时候定位到当前的日期
var $calendarList = null;
$calendarCallBackList.add(function (today, data) {
    $calendarList = $calendarUL.children("li");

    //->根据当前日期获取到具体的LI
    var $curTime = $calendarList.filter("[time='" + today + "']");

    //->如果当前日期在LI中并不存在,我们找到其后面最靠近的一个:从第一个LI开始查找,直到遇到一个LI存储的日期比我们当前日期大的结束查找
    if ($curTime.length === 0) {
        for (var i = 0; i < $calendarList.length; i++) {
            var $curLi = $calendarList.eq(i);
            var n = new Date($curLi.attr("time").replace(/-/g, "/"));//->每一次循环找到的LI中的日期
            var m = new Date(today.replace(/-/g, "/"));//->当前日期
            if ((n - m) > 0) {
                $curTime = $curLi;
                break;
            }
        }
    }

    //->如果找了一圈还没有我们则显示最后一个即可
    if ($curTime.length === 0) {
        $curTime = $calendarList.filter(":last");
    }

    //->定位到当前$curTime这个位置,这个位置处于7个LI的中间位置:但是到达边界还需要做一个判断
    var curL = -($curTime.index() * 105) + (3 * 105);
    curL = curL < minL ? minL : (curL > maxL ? maxL : curL);

    $curTime.addClass("bg");
    $calendarUL.css("left", curL);
});
