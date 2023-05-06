var bannerDesigner = BannerDesigner.init($("#banner-designer-wrap"), {
    onNewImageCreated: function(blob){
        rpc.call("onNewImageCreated", {
            blob: blob,
        });
    },
    onChange: function(data){
        console.log('banner_changed', data);

        var config = this.exportBanner();

        if (timeoutId) clearTimeout(timeoutId);
        timeoutId = setTimeout(function(){
            timeoutId = null;
            rpc.call("updateConfig", {
                config: config,
            });
        }, 300);
    },
    onGetImageUrl: function(cb){
        rpc.call("openMediaGallery", cb);
    }
});


var rpc = RPC(window.parent);
rpc.call("init", function(config){
    if (config)
        bannerDesigner.importBanner(config);
});

var timeoutId = null;


