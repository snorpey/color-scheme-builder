/**
* chainsaw.js
*
* @version 0.1
* @author Georg Fischer <g.fischer@bigspaceship.com>
* 
*/
 
var Chainsaw = new (function()
{
    // specify options
    var _options = {
        autostart: true,                    // start automatically? otherwise: call Chainsaw.init()
        path: 'javascript/components'       // path to component files
    };
     
    var _self = this;
             
    // all unique components
    var _components = {};
     
    // list of all component instances
    var _component_instances = [];
     
    // list of all component scripts that we loaded
    var _component_scripts_loaded = [];
     
    // list of all component scripts loading
    var _component_scripts_loading = [];
     
    // list of all component links that wait for their component scripts to load
    var _component_scripts_waiting = [];
             
    // list of all required scripts of all components
    var _required_scripts_loaded = [];
     
    // list of all scripts loading
    var _required_scripts_loading = [];
     
    // list of instances (by their index) that wait for their required scripts to load
    var _required_scripts_waiting = [];
     
    // list of custom message types that components want to listen to
    var _message_types = [];
     
    // list of all instances that listen to messages
    var _message_subscribers = [];
         
    function init()
    {
        jQuery( document ).ajaxError( showAjaxError )
        // scan for new components on page load
        scan();
    }
     
    function scan()
    {       
        // list of all component links on the current page
        var component_links = getComponentsOnPage();
                 
        if ( component_links.length )
        {
            componentsLoad( component_links )
        }
    }
     
    // load components and instantiate them;
    function componentsLoad( $component_links )
    {       
        // list of all component script files
        var component_scripts = getComponentScripts( $component_links );    
             
        if ( component_scripts.length )
        {           
            for ( var i = 0; i < component_scripts.length; i++ )
            {
                var load_script = true;
                var wait_for_script = true;
                 
                // check if we loaded this script before
                for ( var j = 0; j < _component_scripts_loaded.length; j++ )
                {
                    if ( component_scripts[i] === _component_scripts_loaded[j] )
                    {
                        load_script = false;
                        wait_for_script = false;
                        break;
                    }
                }
                 
                // check if the script is loading
                for ( var j = 0; j < _component_scripts_loading.length; j++ )
                {
                    if ( component_scripts[i] === _component_scripts_loading[j] )
                    {
                        load_script = false;
                        wait_for_script = true;
                        break;
                    }
                }
                 
                // load file and add it to the waiting list
                if ( load_script )
                {                           
                    var script_add_to_waiting = true;
                     
                    _component_scripts_loading.push( component_scripts[i] );
                     
                    for ( var j = 0; j < _component_scripts_waiting.length; j++  )
                    {                   
                        if ( component_scripts[i] === _component_scripts_waiting[j].script )
                        {
                            script_add_to_waiting = false;
                            break;
                        }
                    }
                     
                    if ( script_add_to_waiting )
                    {               
                        _component_scripts_waiting.push( { script: component_scripts[i], instances: [] } );
                    }
                     
                    (function( component_scripts, i )
                    {           
                        jQuery.ajax( 
                            {
                                dataType: 'script',
                                url: component_scripts[i],
                                success: function( $data, $xhr  )
                                {
                                    componentScriptLoaded( component_scripts, $component_links, i );
                                }
                            }
                        );
                    })( component_scripts, i );
                }
                 
                // add link to waiting list for the script
                if ( wait_for_script )
                {
                    for ( j = 0; j < _component_scripts_waiting.length; j++ )
                    {
                        if ( _component_scripts_waiting[j].script === component_scripts[i] )
                        {
                            _component_scripts_waiting[j].instances.push( i );
                            break;
                        }
                    }
                }
                 
                // the component script is loaded instantiate!
                if (
                    ! load_script &&
                    ! wait_for_script
                )
                {
                    componentInit( $component_links[i] );
                }
            }
        }
    }
     
    // add a component type (called from outside)
    function componentAdd( $component, $name )
    {
        _components[$name] = $component;
    }
     
    function componentScriptLoaded( $scripts, $component_links, $index )
    {
        // the loaded script
        var script = $scripts[$index];
         
        // add to loaded array
        _component_scripts_loaded.push( script );
         
        // remove loaded script from loading
        for ( var i = 0; i < _component_scripts_loading.length; i++ )
        {
            if ( _component_scripts_loading[i] === script )
            {
                _component_scripts_loading.splice( i, 1 );
                break;
            }
        }
 
        // initialize waiting links
        for ( var i = 0; i < _component_scripts_waiting.length; i++ )
        {       
            if ( _component_scripts_waiting[i].script === script )
            {           
                for ( var j = 0; j < _component_scripts_waiting[i].instances.length; j++ )
                {                   
                    // instantiate all components that were waiting for this file
                    componentInit( $component_links[_component_scripts_waiting[i].instances[j]] );
                }
                 
                // remove from waiting line;
                _component_scripts_waiting.splice( i, 1 )               
                break;
            }       
        }
    }
 
    function componentInit( $link )
    {       
        // create new instances for every link in the code.         
        var component_name = $link.attr( 'data-component' );
                 
        //get json from attr
        var component_options = $link.data( 'component-options' );
         
        // instantiate new component            
        var instance = new _components[component_name]( $link, component_options ); 
        var instance_index = _component_instances.length;               
         
        _component_instances.push( instance );
         
        // get all required scripts from the instance
        if ( instance.getRequiredScripts )
        {
            requiredScriptsLoad( instance.getRequiredScripts(), instance_index );
        }
         
        else
        {
            // instance is good to go.
            if ( instance.ready )
            {
                instance.ready();
            }   
             
            messagesSubscribe( instance_index );
        }           
    }
     
    // load the required scripts for a component if neccessary
    function requiredScriptsLoad( $instance_required_scripts, $instance_index, $data )
    {
        // we're here for the first time for this instance
        if ( ! $data )
        {
            $data = {};
            // check if we need to load asynchronously
            // for scripts depend on eachother
            $data.mode = 'asynchronous';
            $data.instance_required_scripts = $instance_required_scripts;
            $data.script_index = 0;
            $data.instance_index = $instance_index;
             
            if (
                $instance_required_scripts.mode
            )
            {
                $data.mode = $instance_required_scripts.mode;
                 
                if ( $instance_required_scripts.scripts )
                {
                    $data.instance_required_scripts = $instance_required_scripts.scripts;
                }
            }
        }
         
        if (
            $data.script_index !== undefined &&
            $data.instance_required_scripts &&
            $data.instance_required_scripts.length &&
            $data.script_index < $data.instance_required_scripts.length
        )
        {
             
            var script = $data.instance_required_scripts[$data.script_index];
            var load_script = true;
            var wait_for_script = true;
                 
            // check if we loaded this script before
            for ( j = 0; j < _required_scripts_loaded.length; j++ )
            {
                if ( script === _required_scripts_loaded[j] )
                {
                    load_script = false;
                    wait_for_script = false;
                    break;
                }
            }
             
            // check if the script is loading
            for ( j = 0; j < _required_scripts_loading.length; j++ )
            {
                if ( script === _required_scripts_loading[j] )
                {
                    load_script = false;
                    wait_for_script = true;
                    break;
                }
            }
             
            // load file and add to the waiting list
            if ( load_script )
            {
                var script_add_to_waiting = true;
                 
                _required_scripts_loading.push( script );
                 
                for ( var j = 0; j < _required_scripts_waiting.length; j++  )
                {
                    if ( script === _required_scripts_waiting[j].script )
                    {
                        script_add_to_waiting = false;
                        break;
                    }
                }
                 
                if ( script_add_to_waiting )
                {
                    _required_scripts_waiting.push( { script: script, instances: [] } );
                }
                 
                (function( $data )
                {
                    jQuery.ajax( 
                        {
                            dataType: 'script',
                            url: script,
                            success: function()
                            {
                                requiredScriptLoaded( script );
                                 
                                if ( $data.mode === 'consecutive' )
                                {
                                    if ( $data.script_index < $data.instance_required_scripts.length )
                                    {
                                        $data.script_index += 1;
                                        requiredScriptsLoad( $data.instance_required_scripts, $data.instance_index, $data );
                                    }
                                }
                            }
                        }
                    );
                })( $data );
            }
             
            // add instance to waiting list for the script
            if ( wait_for_script )
            {
                for ( j = 0; j < _required_scripts_waiting.length; j++ )
                {
                    if ( _required_scripts_waiting[j].script === script )
                    {
                        _required_scripts_waiting[j].instances.push( $data.instance_index );
                        break;
                    }
                }
            }
             
            // all required scripts have been loaded before
            if (
                ! wait_for_script &&
                ! load_script
            )
            {
                _component_instances[$data.instance_index].ready();
            }
        }
         
        if ( $data.mode === 'asynchronous' )
        {
            if ( $data.script_index < $data.instance_required_scripts.length )
            {
                $data.script_index += 1;
                requiredScriptsLoad( $data.instance_required_scripts, $data.instance_index, $data );
            }
        }
    }
     
    function requiredScriptLoaded( $script )
    {       
        // add to loaded array
        _required_scripts_loaded.push( $script );
         
        // remove loaded script from loading
        for ( var i = 0; i < _required_scripts_loading.length; i++ )
        {
            if ( _required_scripts_loading[i] === $script )
            {
                _required_scripts_loading.splice( i, 1 );
                break;
            }
        }
 
        for ( var i = 0; i < _required_scripts_waiting.length; i++ )
        {       
            if ( _required_scripts_waiting[i].script === $script )
            {           
                for ( var j = 0; j < _required_scripts_waiting[i].instances.length; j++ )
                {                   
                    instanceScriptLoaded( _required_scripts_waiting[i].instances[j] );
                }
                                 
                // remove from waiting line;
                _required_scripts_waiting.splice( i, 1 );
                break;
            }       
        }
    }
     
    function instanceScriptLoaded( $index )
    {
        // check if all required scripts are loaded for this instance
        var instance_scripts_loaded_count = 0;
        var instance_scripts_required = _component_instances[$index].getRequiredScripts();
         
        if ( instance_scripts_required.mode )
        {
            if ( instance_scripts_required.scripts )
            {
                instance_scripts_required = instance_scripts_required.scripts;
            }
        }
         
        for ( var i = 0; i < instance_scripts_required.length; i++ )
        {
            for ( var j = 0; j < _required_scripts_loaded.length; j++ )
            {
                if ( instance_scripts_required[i] === _required_scripts_loaded[j] )
                {
                    instance_scripts_loaded_count++;
                    break;
                }
            }
        }
         
        // initialize component if all required scripts have been loaded
        if ( instance_scripts_loaded_count === instance_scripts_required.length )
        {
            if ( _component_instances[$index].ready )
            {
                _component_instances[$index].ready();
            }
             
            messagesSubscribe( $index );
        }
    }
     
    function messagesSubscribe( $instance_index )
    {
        // let the instance subscribe to messages
        if (
            _component_instances[$instance_index].getMessageTypes &&
            _component_instances[$instance_index].messageReceive
        )
        {
            var message_types = _component_instances[$instance_index].getMessageTypes();
             
            if ( message_types.length )
            {
                for ( var i = 0; i < message_types.length; i++ )
                {
                    var type_add = true;
                     
                    for ( var j = 0; j < _message_types.length; j++ )
                    {               
                        if ( message_types[i] === _message_types[j] )
                        {
                            type_add = false;
                            break;
                        }
                    }
                     
                    // add the message type to the messages list
                    if ( type_add )
                    {
                        _message_types.push( message_types[i] );
                        _message_subscribers.push( { type: message_types[i], instances: [] } );
                    }
                     
                    // add the instance to the list of subscribers
                    for ( var j = 0; j < _message_subscribers.length; j++ )
                    {
                        if ( message_types[i] === _message_subscribers[j].type )
                        {
                            _message_subscribers[j].instances.push( $instance_index );
                        }           
                    }
                }
            }   
        }
    }
     
    function messageSend( $type, $data )
    {   
        // tell the subscribers something happend
        for ( var i = 0; i < _message_subscribers.length; i++ )
        {
            if ( _message_subscribers[i].type === $type )
            {
                for ( var j = 0; j < _message_subscribers[i].instances.length; j++ )
                {                   
                    if ( _component_instances[_message_subscribers[i].instances[j]].messageReceive )
                    {
                        _component_instances[_message_subscribers[i].instances[j]].messageReceive( $type, $data );
                    }
                }
                 
                break;
            }
        }
    }
         
    function getComponentsOnPage()
    {
        var return_value = [];
         
        jQuery( 'body *[data-component]' ).each(
            function()
            {           
                // get only components that are not yet initialized.
                if (
                    ! jQuery( this ).attr( 'data-component-index' ) &&
                    ! parseInt( jQuery( this ).attr( 'data-component-index', 10 ) !== 0 ) &&
                    jQuery( this ).attr( 'data-component' )
                )
                {   
                    jQuery( this ).attr( { 'data-component-index': _component_instances.length } );
                     
                    return_value.push( jQuery( this ) );
                }
            }
        );
         
        return return_value;
    }
         
    function getComponentScripts( $component_links )
    {
        var component_scripts = [];
         
        for ( var i = 0; i < $component_links.length; i++ )
        {
            // we'll probably need a better regex here to match camelCase an such..
            // also a more dynamic way of doing this might be helpful.
             
            if ( $component_links[i].attr( 'data-component' ) )
            {           
                var suffix = '.js';
                var filename =  $component_links[i].attr( 'data-component' ).toLowerCase() + suffix;
                var filepath = _options.path + '/' + filename;
             
                component_scripts.push( filepath );
            }
        }
         
        return component_scripts;
    }
     
    function showAjaxError( $event, $xhr, $settings, $error )
    {
        if ( console )
        {
            console.log( 'there is an error in an ajax ressource i tried to load:', $event, $xhr, $settings, $error );
        }
    }
     
    _self.scan = scan;  
    _self.componentAdd = componentAdd;
    _self.messageSend = messageSend;
     
    if ( _options.autostart )   
    {
        init();
    }
     
    else
    {
        _self.init = init;
    }
})();