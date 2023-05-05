
$(document).ready(function () {
    bannerDesignerInitialization({
        onChange: function(){
            console.log("Changed!");
        }
    });
});

function init = function(){
    if (bannerDesigner !== null) throw "Banner designer already initialized";

    var rpc = RPC(window.parent);
    rpc.call("config", function(_config){
         config = _config || {};

         var el = document.body;
         bannerDesigner = new BannerDesigner(el, api, config)
    });

    var timeoutId = null;
    var config = null;

    var updateInputs = function(){
        timeoutId = null;
        rpc.call("updateInputs", {
            config: config,
        });
    }


    var api = {
        setConfigParam: function(paramName, paramValue){
            if (config === null) {
                throw "Initialization not yet finnished"
            }
            var paramNameParts = paramName.split(".");

            obj = config;
            paramNameParts.splice(0, paramNameParts.length-1).forEach(function(paramNamePart){
                if (typeof obj[paramNamePart] == "undefined") obj[paramNamePart] = {}
                obj = obj[paramNamePart];
            });

            obj[paramNameParts[paramNameParts.length-1]] = paramValue;


            if (timeoutId) clearTimeout(timeoutId);
            timeoutId = setTimeout(updateInputs, 300);
        },
        openMediaGallery: function(cb){
            rpc.call("openMediaGallery", cb);
        }
    }
}
