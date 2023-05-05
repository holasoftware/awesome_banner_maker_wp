var createAutoresizeIframe = (function(global){
    var DEFAULT_HEIGHT_CALCULATION_METHOD = 'document_element_offset';

    var MutationObserver = global.MutationObserver || global.WebKitMutationObserver

    function createAutoresizeIframe(contentHtml, opts) {
        var iframeDocument, prevHeight;

        function getMaxBottomElementPosition(elements) {
            var elementsLength = elements.length,
              elVal = 0,
              maxVal = 0

            for (var i = 0; i < elementsLength; i++) {
              elVal =
                elements[i].getBoundingClientRect().bottom +
                getComputedStyle('marginBottom', elements[i])
              if (elVal > maxVal) {
                maxVal = elVal
              }
            }

            return maxVal
        }

        var iframeHeightCalculation = {
            body_offset: function() {
                return (
                  iframeDocument.body.offsetHeight +
                  getComputedStyle('marginTop') +
                  getComputedStyle('marginBottom')
                )
            },

            bounding_client_rect: function(){
                return iframeDocument.documentElement.getBoundingClientRect().height;
            },

            body_scroll: function() {
                return iframeDocument.body.scrollHeight
            },

            document_element_offset: function() {
                return iframeDocument.documentElement.offsetHeight
            },

            document_element_scroll: function() {
                return iframeDocument.documentElement.scrollHeight
            },

            max: function() {
                return Math.max(iframeHeightCalculation.body_offset(), iframeHeightCalculation.body_scroll(), iframeHeightCalculation.document_element_offset(), iframeHeightCalculation.document_element_scroll())
            },

            min: function() {
                return Math.min(iframeHeightCalculation.body_offset(), iframeHeightCalculation.body_scroll(), iframeHeightCalculation.document_element_offset(), iframeHeightCalculation.document_element_scroll())
            },

            lowest_element: function() {
                var allElements = iframeDocument.querySelectorAll('body *');

                return Math.max(
                  iframeHeightCalculation.body_offset() || iframeHeightCalculation.document_element_offset(),
                  getMaxBottomElementPosition(allElements)
                )
            }
        }

        opts = opts || {};
        // Default: max or bodyScroll
        var calculateIframeHeight = iframeHeightCalculation[opts.heightCalculationMethod || DEFAULT_HEIGHT_CALCULATION_METHOD];

        var iframe = document.createElement("iframe");

        iframe.setAttribute("scrolling", "no");

        if (opts.id)
            iframe.id = opts.id;

        if (opts.classname){
            if (Array.isArray(opts.classname)){
                iframe.classList.add.apply(iframe.classList, opts.classname);
            } else {
                iframe.className = opts.classname;
            }
        }

        iframe.classList.add("iframe-autoresize");

        iframe.style.height = '0px';
        iframe.style.display = 'block';

        var blob = new Blob([contentHtml], {type: "text/html"});

        iframe.src = global.URL.createObjectURL(blob);

        // resizeIframeHeight
        var updateIframeHeight = function() {
            var height = calculateIframeHeight();

            if (height != prevHeight) {
                if (opts.minHeight && height < opts.minHeight){
                    height = opts.minHeight;
                } else if (opts.maxHeight && height > opts.maxHeight) {
                    height = opts.maxHeight;
                }

                prevHeight = height;

                var ev = new CustomEvent("resized", { cancelable: false, bubbles: true });
                iframe.dispatchEvent(ev);
            }

            iframe.style.height = height + 'px';
        }

        function addImageLoadListener(element) {
            if (false === element.complete) {
              element.addEventListener('load', imageEventTriggered, false)
              element.addEventListener('error', imageEventTriggered, false)
            }
        }

        function imageEventTriggered(event) {
          var element = event.target;
          element.removeEventListener('load', imageEventTriggered, false)
          element.removeEventListener('error', imageEventTriggered, false)

          updateIframeHeight()
        }

        function mutationObserved(mutations) {
            updateIframeHeight();

            // Deal with WebKit / Blink asyncing image loading when tags are injected into the page
            mutations.forEach(function(mutation) {
                if (mutation.type === 'attributes' && mutation.attributeName === 'src') {
                    addImageLoadListener(mutation.target)
                } else if (mutation.type === 'childList') {
                    Array.prototype.forEach.call(
                      mutation.target.querySelectorAll('img'),
                      addImageLoadListener
                    )
                }
            })
        }


        iframe.onload = function(){
            iframe.addEventListener('force_autoresize', function(){
                updateIframeHeight();
            }, false);

            iframe.autoResize = function(){
                updateIframeHeight();
            };

            iframeDocument = iframe.contentDocument || iframe.contentWindow.document;


            var observer = new MutationObserver(mutationObserved)

            observer.observe(iframe.contentWindow.document.body, {
              attributes: true,
              attributeOldValue: false,
              characterData: true,
              characterDataOldValue: false,
              childList: true,
              subtree: true
            });

            updateIframeHeight();

            if (opts.onLoad){
                opts.onLoad.call(iframe);
            }
        }

        function getComputedStyle(prop, el) {
            var retVal = 0

            el = el || iframeDocument.body;

            retVal = iframe.contentWindow.document.defaultView.getComputedStyle(el, null)
            retVal = null !== retVal ? retVal[prop] : 0

            return parseInt(retVal)
        }

        return iframe
    }

    return createAutoresizeIframe;
})(this);

