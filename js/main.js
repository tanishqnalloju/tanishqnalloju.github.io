/* ===================================================================
 * Imminent 1.0.0 - Main JS
 *
 * ------------------------------------------------------------------- */

(function($) {

    "use strict";
    
    const cfg = {
                scrollDuration : 800, // smoothscroll duration
                mailChimpURL   : 'https://facebook.us8.list-manage.com/subscribe/post?u=cdb7b577e41181934ed6a6a44&amp;id=e6957d85dc' // mailchimp url
                };
    const $WIN = $(window);

    // Add the User Agent to the <html>
    // will be used for IE10/IE11 detection (Mozilla/5.0 (compatible; MSIE 10.0; Windows NT 6.2; Trident/6.0; rv:11.0))
    const doc = document.documentElement;
    doc.setAttribute('data-useragent', navigator.userAgent);


   /* preloader
    * -------------------------------------------------- */
    const ssPreloader = function() {

        $("html").addClass('ss-preload');

        $WIN.on('load', function() {

            // force page scroll position to top at page refresh
            // $('html, body').animate({ scrollTop: 0 }, 'normal');

            // will first fade out the loading animation 
            $("#loader").fadeOut("slow", function() {
                // will fade out the whole DIV that covers the website.
                $("#preloader").delay(300).fadeOut("slow");
            }); 
            
            // for hero content animations 
            $("html").removeClass('ss-preload');
            $("html").addClass('ss-loaded');

        });
    };


   /* pretty print
    * -------------------------------------------------- */
    const ssPrettyPrint = function() {
        $('pre').addClass('prettyprint');
        $( document ).ready(function() {
            prettyPrint();
        });
    };


   /* slick slider
    * ------------------------------------------------------ */
    const ssSlickSlider = function() {
            
        $('.intro-slider').slick({
            arrows: false,
            dots: false,
            autoplay: true,
            autoplaySpeed: 3000,
            fade: true,
            speed: 3000
        });
    };



   /* final countdown
    * ------------------------------------------------------ */
    const ssFinalCountdown = function() {

        const finalDate = '2020/09/17';

        $('.counter').countdown(finalDate)
        .on('update.countdown finish.countdown', function(event) {

            const str = '<div class=\"counter__time days\">%D&nbsp;<span>D</span></div>' +
                        '<div class=\"counter__time hours\">%H&nbsp;<span>H</span></div>' +
                        '<div class=\"counter__time minutes\">%M&nbsp;<span>M</span></div>' +
                        '<div class=\"counter__time seconds\">%S&nbsp;<span>S</span></div>';
                    
            $(this).html(event.strftime(str));

        });
    };


   /* tabs
    * ---------------------------------------------------- */ 
    const ssTabs = function() {

        const $tabNavListItems = $("ul.tab-nav__list li");
        const $tabContentItem  = $(".tab-content__item");

        $tabContentItem.hide().first().show();

        $tabNavListItems.on('click', function () {

            $tabNavListItems.removeClass("active");
            $(this).addClass("active");
            $tabContentItem.hide();

            const activeTab = $(this).attr("data-id");
            $("#" + activeTab).fadeIn(1000);

        });
    }


   /* alert boxes
    * ------------------------------------------------------ */
    const ssAlertBoxes = function() {

        $('.alert-box').on('click', '.alert-box__close', function() {
            $(this).parent().fadeOut(500);
        }); 

    };

    
   /* smooth scrolling
    * ------------------------------------------------------ */
    const ssSmoothScroll = function() {
        
        $('.smoothscroll').on('click', function (e) {
            const target = this.hash;
            const $target = $(target);
            
            e.preventDefault();
            e.stopPropagation();

            $('html, body').stop().animate({
                'scrollTop': $target.offset().top
            }, cfg.scrollDuration, 'swing').promise().done(function () {
                window.location.hash = target;
            });
        });

    };


   /* back to top
    * ------------------------------------------------------ */
    const ssBackToTop = function() {
        
        const pxShow      = 500;
        const $goTopButton = $(".ss-go-top")

        // Show or hide the button
        if ($(window).scrollTop() >= pxShow) $goTopButton.addClass('link-is-visible');

        $(window).on('scroll', function() {
            if ($(window).scrollTop() >= pxShow) {
                if(!$goTopButton.hasClass('link-is-visible')) $goTopButton.addClass('link-is-visible')
            } else {
                $goTopButton.removeClass('link-is-visible')
            }
        });
    };




   /* initialize
    * ------------------------------------------------------ */
    (function ssInit() {

        ssPreloader();
        ssPrettyPrint();
        ssSlickSlider();
        ssFinalCountdown();
        ssTabs();
        ssAlertBoxes();
        ssSmoothScroll();
        ssBackToTop();

    })();

})(jQuery);