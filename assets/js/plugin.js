(function(global) {
    // document.addEventListener('DOMContentLoaded', function(){

    function create_media_item_html(media_data){
        var thumb_url;

        var html = '<li class="banner-image-item">';
        html += '<div class="banner-image-item-details">';

        if (media_data.sizes && media_data.sizes.thumbnail && media_data.sizes.thumbnail.url){
            thumb_url = media_data.sizes.thumbnail.url;
        } else {
            thumb_url = media_data.url;
        }

	    html += '<img class="pinkynail" src="' + thumb_url + '" alt="" />';

        html += '</div>';
		html += '<div class="media-item-tools">';
		html += '<div class="media-item-copy-container copy-to-clipboard-container edit-attachment">';
        html += '<button type="button" class="button button-small copy-attachment-url" data-clipboard-text="' + media_data.url + '">Copy URL to clipboard></button>';
		html += '<span class="success hidden" aria-hidden="true">Copied!</span>';
		html += '</div>';

		if ( media_data.editLink ) {
			html += '<a class="edit-attachment" href="' + media_data.editLink +'">Edit</a>';
		}

        html += '</div>';
	    html += '</li>';

        return html;
    }


    jQuery( document ).ready( function( $ ) {
        var blob = null;
        var isIframeExpanded = false;

        var $uploadImageToGalleryBtn;

        var form = document.querySelector('form#post');

        var bannerImageUploadNoticeTimeout = null;
        var uploadImageToGalleryBtn;

        var configInput = form.querySelector('input[name=config]');

        var $iframeWrapper = $("#banner_designer_ui_iframe_wrap");
        var $bannerImageList = $('#uploaded_banner_image_list');
        var $bannerImageUploadNotice = $('#banner_image_upload_notice');

        var copyAttachmentURLClipboard = new ClipboardJS( '#uploaded_banner_image_list .copy-attachment-url' );
        var copyAttachmentURLSuccessTimeout = null;

		copyAttachmentURLClipboard.on( 'success', function( event ) {
			var triggerElement = $( event.trigger ),
				successElement = $( '.success', triggerElement.closest( '.copy-to-clipboard-container' ) );

			// Clear the selection and move focus back to the trigger.
			event.clearSelection();
			// Handle ClipboardJS focus bug, see https://github.com/zenorocha/clipboard.js/issues/680.
			triggerElement.trigger( 'focus' );

			// Show success visual feedback.
            if (copyAttachmentURLSuccessTimeout !== null)
			    clearTimeout( copyAttachmentURLSuccessTimeout );

			successElement.removeClass( 'hidden' );

			// Hide success visual feedback after 3 seconds since last success and unfocus the trigger.
			copyAttachmentURLSuccessTimeout = setTimeout( function() {
                copyAttachmentURLSuccessTimeout = null;
				successElement.addClass( 'hidden' );
			}, 3000 );

			// Handle success audible feedback.
			wp.a11y.speak( wp.i18n.__( 'The file URL has been copied to your clipboard' ) );
		} );
        // crear un handshake?
        // Otra posibilidad seria añadirlo en un contenedor con un cierto ID una vez la pagina esta cargada.

        var deleteUrl = PLUGIN_DATA["delete_url"];

        var config = PLUGIN_DATA["banner_config"];

        if (config)
            configInput.value = JSON.stringify(config);

        var rpc = RPC(window, {
            updateConfig: function(inputData){
                configInput.value = JSON.stringify(inputData.config);

                blob = null;
                $uploadImageToGalleryBtn.hide();
            },
            init: function(cb){
                cb(config);
            },
            onNewImageCreated: function(data){
                blob = data.blob;

                $uploadImageToGalleryBtn.show();
            },
            createPopup: function(cb){
    
            },
            openMediaGallery: function(cb){
                var custom_uploader = wp.media({
                    title: 'Select or upload image',
                    button: {
                        text: 'Set image'
                    },
                    multiple: false
                })
                .on('select', function() {
                    var attachment = custom_uploader.state().get('selection').first().toJSON();
                    cb(attachment.url)
                })
                .open();
            }
        });

        var postForm = document.getElementById("post");

        var iframe_html = PLUGIN_DATA["iframe_html_template"];
        var context = PLUGIN_DATA["iframe_html_template_context"];

        var before_body_ends = '<script src="' + context.iframe_rpc_url + '" type="text/javascript"></script><script src="' + context.script_wordpress_integration_url + '" type="text/javascript"></script>';

        iframe_html = iframe_html.replace('css/banner_designer.css', context.banner_designer_css_url );
        iframe_html = iframe_html.replace('css/btn.css', context.btn_css_url );
        iframe_html = iframe_html.replace('css/pure_css_checkbox.css', context.pure_css_checkbox_css_url );
        iframe_html = iframe_html.replace('libs/fontawesome-free-5.15.4-web/css/all.css', context.fontawesome_css_url );
        iframe_html = iframe_html.replace('css/flexboxgrid.css', context.flexboxgrid_css_url );
        iframe_html = iframe_html.replace('css/forms.css', context.forms_css_url );
        iframe_html = iframe_html.replace('libs/html2canvas.js', context.html2canvas_url );
        iframe_html = iframe_html.replace('libs/draggabilly.pkgd.js', context.draggabilly_url );
        iframe_html = iframe_html.replace('js/banner_designer.js', context.banner_designer.js );
        iframe_html = iframe_html.replace('libs/jquery-3.6.0.js', context.jquery_url );
        iframe_html = iframe_html.replace('<!-- before body ends -->', before_body_ends );


        var iframe = createAutoresizeIframe(iframe_html, {
            onLoad: function(){
                var $body = $(document.body);
                var $this = $(this);

                var $iframeBody = $(this.contentWindow.document.body);

                var $expandCollapseBtn = $("#banner-designer-expand-collapse-btn");

                $expandCollapseBtn.click(function(){
                    isIframeExpanded = !isIframeExpanded;

                    if (isIframeExpanded){
                        // $this.attr("scrolling", "yes");
                        $body.addClass("banner-designer-expanded");
                    } else {
                        // $this.attr("scrolling", "no");
                        $body.removeClass("banner-designer-expanded");

                        //iframe.autoResize();
                    }
                });

                var $bannerBottomActions = $iframeBody.find("#banner_bottom_actions");

                var $saveButton = $("<button type='button' class='btn btn-default'>Save</button>");
                $saveButton.click(function(e){
                    e.preventDefault();
                    postForm.submit();
                })

                $bannerBottomActions.append($saveButton);

                var $deleteButton = $("<button type='button' class='btn btn-default'>Delete</button>");

                $deleteButton.click(function(e){
                    e.preventDefault();
                    document.location.href = deleteUrl;
                })

                $bannerBottomActions.append($deleteButton);

                $uploadImageToGalleryBtn = $("<button style='display:none' class='btn btn-default' type='button'>Upload to Gallery</button>");

                $uploadImageToGalleryBtn.click(function(e){
                    e.preventDefault();
                
                    var formData = new FormData();

                    var bannerName = 'banner.png'; // Coger el titulo

                    var file = new File([blob], bannerName, {'type': 'image/png'});

                    formData.append('action', 'upload-attachment');
                    formData.append('async-upload', file);
                    formData.append('name', bannerName);
                    formData.append('_wpnonce', PLUGIN_DATA["nonce"]);

                    $.ajax({
                        url: PLUGIN_DATA["upload_url"],
                        data: formData,
                        processData: false,
                        contentType: false,
                        dataType: 'json',
                        type: 'POST',
                        beforeSend: () => {
                            if (bannerImageUploadNoticeTimeout)
                                clearTimeout(bannerImageUploadNoticeTimeout);

                            $bannerImageUploadNotice.text('Uploading&hellip;').show();
                        },
                        success: (resp) => {
                            if ( resp.success ) {
                                $bannerImageUploadNotice.text("Successfully uploaded.");

                                var mediaItemHtml = create_media_item_html(resp.data);

                                var $mediaItem = $(mediaItemHtml);
                                $bannerImageList.append($mediaItem);
                        
                            } else {
                                $bannerImageUploadNotice.text('Fail to upload image: ' + resp.data.message);
                            }

                            if (bannerImageUploadNoticeTimeout)
                                clearTimeout(bannerImageUploadNoticeTimeout);

                            bannerImageUploadNoticeTimeout = setTimeout(function(){
                                $bannerImageUploadNotice.text('');
                            });      
                            
                        },
                        xhr: () => {
                            var myXhr = $.ajaxSettings.xhr();
                        
                            if ( myXhr.upload ) {
                                myXhr.upload.addEventListener( 'progress', (e) => {
                                    if ( e.lengthComputable ) {
                                        var perc = ( e.loaded / e.total ) * 100;
                                        perc = perc.toFixed(2);
                                        $bannerImageUploadNotice.html('Uploading&hellip;(' + perc + '%)');
                                    }
                                }, false );
                            }
                        
                            return myXhr;
                        }
                    });
                });

                $bannerBottomActions.append($uploadImageToGalleryBtn);
            }
        });

        $iframeWrapper.prepend(iframe);
    });
    //}, false);

})(this);


