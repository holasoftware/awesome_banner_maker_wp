<?php
/*
Plugin Name: Awesome Banner Maker WP
Description: Create banners easily using a drag and drop visual designer.
Version: 1.0
Author: Miguel Martinez Lopez
License: GPLv3
License URI: http://www.gnu.org/licenses/gpl.html
*/


class Awesome_Banner_Maker_WP_Plugin {

    private static $menu_icon = '<?xml version="1.0" standalone="no"?><!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd"><svg fill="rgba(240,245,250,.6)" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg"><path d="M131.500475 168.564114l0-34.511002c0-19.057031 16.866133-34.509978 37.670971-34.509978l743.0564 0c-13.060457-20.540825-37.077453-34.511002-64.903196-34.511002L169.171446 65.032132c-41.630143 0-75.363432 30.906917-75.363432 69.02098L93.808014 893.267517c0 38.115086 33.733289 69.022003 75.363432 69.022003l36.94954-20.392446L206.120986 200.965058l-33.821293 0C153.637658 200.965058 131.500475 187.632401 131.500475 168.564114zM250.811838 207.535707 250.811838 962.28952l597.210707 0c41.240263 0 74.66349-30.725792 74.66349-68.622914L922.686035 207.535707 250.811838 207.535707zM642.499681 397.134903c-75.188446 0-181.965332 86.426395-181.965332 230.921323 0 45.88198 16.560164 128.284735 124.823913 128.284735 39.09132 0 79.695087-16.210193 105.268532-44.568055 6.014994-6.770194 13.538341-10.812253 24.064069-10.812253 18.046005 0 30.077016 13.501502 30.077016 31.045063 0 25.668613-72.190159 79.69611-163.915233 79.69611-114.300232 0-187.980325-68.862367-187.980325-183.6456 0-170.163541 132.328841-288.989857 251.135714-288.989857 90.218768 0 126.314871 49.943482 126.314871 103.969956 0 106.679671-124.803447 159.331845-213.534328 159.331845-18.044982 0-33.07428-10.79281-33.07428-28.357861 0-14.835893 13.519921-28.356838 33.07428-29.692253 70.681806-1.353834 145.872299-40.523949 145.872299-101.281731C702.659853 416.013879 681.593048 397.134903 642.499681 397.134903z" /></svg>';
    private static $post_type = 'banner';

    function install(){        
        add_action('init', array($this, 'init'));

	    add_action( "add_meta_boxes_" . self::$post_type, array($this, 'remove_submitdiv_metabox' ) );
	    add_filter( "wp_insert_post_data", array($this, 'wp_insert_post_data_hook' ), 10, 2);
	    add_filter( "post_row_actions", array($this, 'post_row_actions_hook' ), 10, 2);


        add_action('edit_form_after_title', array($this, 'edit_form_after_title_callback' ) );

        add_action('save_post_' . self::$post_type, array($this, 'post_save'), 10, 3);

        add_action('admin_print_styles-post.php', array($this, 'admin_enqueue_scripts'), 10, 1 );
        add_action('admin_print_styles-post-new.php', array($this, 'admin_enqueue_scripts'), 10, 1 );

        add_filter( "get_user_option_screen_layout_banner", function($result){
            if ($result === false) return "1";
            return $result;
        }, 10, 1);

    }


    function init(){
	    $args = array(
		    'labels'             => array(
	            'name'               => _x( 'Banners', 'post type general name',  'banner'),
	            'singular_name'      => _x( 'Banner', 'post type singular name', 'banner' ),
	            'add_new'            => _x( 'Add New', 'add new', 'banner' ),
	            'add_new_item'       => __( 'Add New Banner', 'banner' ),
	            'new_item'           => __( 'New Banner', 'banner' ),
	            'edit_item'          => __( 'Edit Banner', 'banner' ),
	            'view_item'          => __( 'View Banner', 'banner' ),
	            'all_items'          => __( 'All Banners', 'banner' ),
	            'search_items'       => __( 'Search Banner', 'banner' ),
	            'parent_item_colon'  => __( 'Parent Paglet:', 'banner' ),
	            'not_found'          => __( 'No banner found.', 'banner' ),
	            'not_found_in_trash' => __( 'No banner found in Trash.', 'banner' )
            ),
            'description'        => 'Plugin for the creation of banners',
		    'public'             => false,
		    'show_ui'            => true,
		    'show_in_menu'       => true,
		    'show_in_nav_menus'  => false,
		    'query_var'          => false,
		    'rewrite'            => false,
		    'capability_type'    => 'post',
		    'has_archive'        => false,
		    'hierarchical'       => false,
		    'menu_position'      => 12,
		    #'menu_icon'			 => 'data:image/svg+xml;base64,' . base64_encode(self::$menu_icon),
            'menu_icon'			 => 'dashicons-images-alt2',
		    'supports'           => array( 'title'),
	    );

	    register_post_type(self::$post_type, $args );
        flush_rewrite_rules(false);

        do_action(self::$post_type . '_init');
    }

    static function is_color($s){
        // TODO: Mejorar esta parte
        // return ctype_xdigit($s) && (strlen($s) == 6 || strlen($s) == 3);

        return preg_match('/^#[0-9a-fA-F]{6}$/', $s) === 1;
    }

	static function sanitize_hex_color( $color ) {
		if ( !is_string($s) || '' === $color )
			return '';

		// 3 or 6 hex digits, or the empty string.
		if ( preg_match('|^#([A-Fa-f0-9]{3}){1,2}$|', $color ) )
			return $color;

		return null;
	}

    static function is_size($s){
        return is_numeric($s) || (is_string($s) && (preg_match('/^(\d+)(?:px)?$/', $s) === 1));
    }

    function post_row_actions_hook($actions, $post){
        unset($actions['inline hide-if-no-js']);

        return $actions;
    }

    function wp_insert_post_data_hook($data, $postarr){
        return $data;
        if ($data["post_type"] === self::$post_type && ! empty( $postarr['ID'] ) ){
            $data["post_status"] = 'publish';
        }
        return $data;
    }

    function get_layer_types(){
        return array('image', 'text');
    }

    function post_save($post_id, $post, $update){
        if (!isset($_POST['config'])) return;

        $json_config = $_POST['config'];
        $config = json_decode(stripslashes($json_config), false);

        if ($config === null) return;
        $cleaned_config = array();

        if (isset($config->current_layer_index) && is_numeric($config->current_layer_index) && $config->current_layer_index >= 0) {
            $cleaned_config['current_layer_index'] = (int)$config->current_layer_index;
        };

        if (isset($config->banner_width) && self::is_size($config->banner_width)){
            $cleaned_config['banner_width'] = $config->banner_width;
        }

        if (isset($config->banner_height) && self::is_size($config->banner_height)){
            $cleaned_config['banner_height'] = $config->banner_height;
        }
        
        if (isset($config->background_type) && in_array($config->background_type, array("image_with_overlay", "gradient"))){
            $cleaned_config['background_type'] = $config->background_type;
        }

        if (isset($config->banner_src)){
            $cleaned_config['banner_src'] = sanitize_url($config->banner_src);
        }

        if (isset($config->banner_bg_position) && in_array($config->banner_bg_position, array("center center", "left top", "left center", "left bottom", "right top", "right center", "right bottom", "center top", "center bottom"))){
            $cleaned_config['banner_bg_position'] = $config->banner_bg_position;
        }

        if (isset($config->overlay_color) && preg_match($rgb_regex, $config->overlay_color) === 0) {
            $cleaned_config['overlay_color'] = $config->overlay_color;
        };

        if (isset($config->overlay_height) && preg_match('^(?:\d{1,3}%|\d+(?:px)?)$', $config->overlay_height) === 0) {
            $cleaned_config['overlay_height'] = $config->overlay_height;
        };

        if (isset($config->overlay_dock_position) && in_array($config->overlay_dock_position, array("top", "bottom"))){
            $cleaned_config['overlay_dock_position'] = $config->overlay_dock_position;
        }

        if (isset($config->overlay_opacity) && is_numeric($config->overlay_opacity) && $config->overlay_opacity >= 0 && $config->overlay_opacity <= 1) {
            $cleaned_config['overlay_opacity'] = (float)$config->overlay_opacity;
        };

        if (isset($config->overlay_gradient_color1) && self::is_color($config->overlay_gradient_color1)) {
            $cleaned_config['overlay_gradient_color1'] = $config->overlay_gradient_color1;
        };

        if (isset($config->overlay_gradient_color2) && self::is_color($config->overlay_gradient_color2)) {
            $cleaned_config['overlay_gradient_color2'] = $config->overlay_gradient_color2;
        };

        if (isset($config->overlay_direction) && in_array($config->overlay_direction, array("right top", "right", "right bottom", "bottom", "left bottom", "left", "left top", "circle"))){
            $cleaned_config['overlay_direction'] = $config->overlay_direction;
        }

        if (isset($config->set_current_layer_on_click) && is_bool($config->set_current_layer_on_click)) {
            $cleaned_config['set_current_layer_on_click'] = $config->set_current_layer_on_click;
        };

        if (isset($config->layers) && is_array($config->layers)){
            $cleaned_config['layers'] = array();

            foreach ($config->layers as $layer){
                if (!isset($layer->layer_type)){
                    continue;
                }

                $cleaned_layer_data = array();

                if ($layer->layer_type === 'text'){
                    $cleaned_layer_data['layer_type'] = $layer->layer_type;

                    if (isset($layer->width) && self::is_size($layer->width)) {
                        $cleaned_layer_data['width'] = $layer->width;
                    };

                    if (isset($layer->text)) {
                        $cleaned_layer_data['text'] = $layer->text;
                    };

                    if (isset($layer->font_family)) {
                        $cleaned_layer_data['font_family'] = $layer->font_family;
                    };

                    if (isset($layer->bg_transparent) && is_bool($layer->bg_transparent)) {
                        $cleaned_layer_data['bg_transparent'] = $layer->bg_transparent;
                    };

                    if (isset($config->text_align) && in_array($layer->text_align, array('left', 'center', 'justify', 'right'))){
                        $cleaned_layer_data['text_align'] = $layer->text_align;
                    }

                    if (isset($layer->line_height) && self::is_size($layer->line_height)) {
                        $cleaned_layer_data['line_height'] = $layer->line_height;
                    };

                    if (isset($layer->padding) && self::is_size($layer->padding)) {
                        $cleaned_layer_data['padding'] = $layer->padding;
                    };

                    if (isset($layer->border_width) && self::is_size($layer->border_width)) {
                        $cleaned_layer_data['border_width'] = $layer->border_width;
                    };

                    if (isset($layer->border_width) && self::is_size($layer->border_width)) {
                        $cleaned_layer_data['border_width'] = $layer->border_width;
                    };

                    if (isset($config->border_color) && self::is_color($layer->border_color)) {
                        $cleaned_config['border_color'] = $layer->border_color;
                    };

                    if (isset($layer->border_radius) && self::is_size($layer->border_radius)) {
                        $cleaned_layer_data['border_radius'] = $layer->border_radius;
                    };

                    if (isset($config->color) && self::is_color($layer->color)) {
                        $cleaned_config['color'] = $layer->color;
                    };

                    if (isset($layer->font_size) && self::is_size($layer->font_size)) {
                        $cleaned_layer_data['font_size'] = $layer->font_size;
                    };

                    if (isset($layer->background_color) && self::is_color($layer->background_color)) {
                        $cleaned_layer_data['background_color'] = $layer->background_color;
                    };

                } else if ($layer->layer_type === 'image'){
                    if (isset($layer->width) && self::is_size($layer->width)) {
                        $cleaned_layer_data['width'] = $layer->width;
                    };

                    if (isset($layer->height) && self::is_size($layer->height)) {
                        $cleaned_layer_data['height'] = $layer->height;
                    };

                    if (isset($layer->image_src)) {
                        $cleaned_layer_data['image_src'] = sanitize_url($layer->image_src);
                    };

                } else {
                    continue;
                }

                $cleaned_layer_data['layer_type'] = $layer->layer_type;

                if (isset($layer->layer_name)){
                    $cleaned_layer_data['layer_name'] = $layer->layer_name;
                }

                if (isset($layer->top) && self::is_size($layer->top) && isset($layer->left) && self::is_size($layer->left)){
                    $cleaned_layer_data['top'] = $layer->top;
                    $cleaned_layer_data['left'] = $layer->left;
                }

                $cleaned_config['layers'][] = $cleaned_layer_data;
            }
        }

        update_post_meta($post_id, 'config', addslashes(json_encode($cleaned_config)));
    }


    function edit_form_after_title_callback($post){
        $expand_icon_url = plugins_url('assets/icons/expand.svg', __FILE__);
        $collapse_icon_url = plugins_url('assets/icons/collapse.svg', __FILE__);

        if ( $post->post_type == self::$post_type) {
            echo "<input name='config' type='hidden'><div id='banner_designer_ui_iframe_wrap'><button type='button' id='banner-designer-expand-collapse-btn'><img class='collapse-icon' src='" . esc_attr($collapse_icon_url) . "'><img class='expand-icon' src='" . esc_attr($expand_icon_url) . "'></button><div id='banner_uploaded_images'><div id='banner_image_upload_notice'></div><ul id='uploaded_banner_image_list'></ul></div></div>";
        }
    }

    function remove_submitdiv_metabox(){
        // remove_meta_box( 'submitdiv', null, 'side' );
    }

    function admin_enqueue_scripts() {
    	global $type, $tab;

        $post = get_post();

        // Usar get_post_type()?
        if ( $post->post_type !== self::$post_type) return;

        wp_enqueue_media();

        wp_enqueue_script('iframe_rpc', plugins_url('assets/js/iframe_rpc.js', __FILE__));
        wp_enqueue_script('iframe_autoresize', plugins_url('assets/js/iframe_autoresize.js', __FILE__));
        wp_enqueue_script('banner_designer_plugin', plugins_url('assets/js/plugin.js', __FILE__), array('jquery', 'iframe_rpc', 'iframe_autoresize', 'clipboard'), null);

        wp_enqueue_style('plugin_css', plugins_url('assets/css/plugin.css', __FILE__));

        $plugin_data = array();

        $plugin_data_banner_config = get_post_meta($post->ID, 'config', true);

        if (isset($plugin_data_banner_config)){
            $plugin_data['banner_config'] = json_decode($plugin_data_banner_config, true);
        }

        if (current_user_can( 'delete_post', $post->ID ) ){
            $plugin_data['delete_url'] = get_delete_post_link( $post->ID );
        }

	    $max_upload_size = wp_max_upload_size();
	    if ( ! $max_upload_size ) {
		    $max_upload_size = 0;
	    }
        $max_upload_size .= 'b';
        $plugin_data['max_file_size'] = $max_upload_size;

	    // Verify size is an int. If not return default value.
//	    $large_size_h = absint( get_option( 'large_size_h' ) );

//	    if ( ! $large_size_h ) {
//		    $large_size_h = 1024;
//	    }

//	    $large_size_w = absint( get_option( 'large_size_w' ) );

//	    if ( ! $large_size_w ) {
//		    $large_size_w = 1024;
//	    }

        $wp_scripts = wp_scripts();
        $jquery_url = $wp_scripts->base_url . $wp_scripts->registered['jquery-core']->src;

        $iframe_html_template = file_get_contents(__DIR__ . '/assets/libs/banner_designer/index.html');

        $plugin_data['iframe_html_template_context'] = array(
            'banner_designer_css_url' => plugins_url('assets/libs/banner_designer/css/banner_designer.css', __FILE__),
            'btn_css_url' => plugins_url('assets/libs/banner_designer/css/btn.css', __FILE__),
            'pure_css_checkbox_css_url' => plugins_url('assets/libs/banner_designer/css/pure_css_checkbox.css', __FILE__),
            'fontawesome_css_url' => plugins_url('assets/libs/banner_designer/libs/fontawesome-free-5.15.4-web/css/all.css', __FILE__),
            'flexboxgrid_css_url' => plugins_url('assets/libs/banner_designer/css/flexboxgrid.css', __FILE__),
            'forms_css_url' => plugins_url('assets/libs/banner_designer/css/forms.css', __FILE__),
            'html2canvas_url' => plugins_url('assets/libs/banner_designer/libs/html2canvas.js', __FILE__),
            'draggabilly_url' => plugins_url('assets/libs/banner_designer/libs/draggabilly.pkgd.js', __FILE__),
            'banner_designer_js_url' => plugins_url('assets/libs/banner_designer/js/banner_designer.js', __FILE__),
            'jquery_url' => $jquery_url,
            'script_wordpress_integration_url' => plugins_url('assets/js/script_wordpress_integration.js', __FILE__),
            'iframe_rpc_url' => plugins_url('assets/js/iframe_rpc.js', __FILE__)
        );

        $plugin_data['upload_url'] = admin_url('async-upload.php');
        $plugin_data['nonce'] = wp_create_nonce('media-form');

        wp_localize_script('banner_designer_plugin', 'PLUGIN_DATA', $plugin_data);
    }
}

$awesome_banner_maker_wp_plugin = new Awesome_Banner_Maker_WP_Plugin();
$awesome_banner_maker_wp_plugin->install();
