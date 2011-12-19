function valuelist( $element )
{
	var _self = this;
	var _element = $element;
	var _required_scripts = [ 'javascript/conditional/jquery-ui-1.8.16.custom.min.js', 'javascript/conditional/jquery.colorpicker.js' ];
	var _message_types = ['get_results'];
	
	var _properties = [ 
		'background',
		'text',
		'keyword',
		'type',
		'string',
		'regexp',
		'specialchar',
		'comment',
		'number',
		'preproc',
		'symbol',
		'function',
		'cbracket',
		'url',
		'date',
		'time',
		'file',
		'ip',
		'name',
		'variable',
		'oldfile',
		'newfile',
		'difflines',
		'selector',
		'property',
		'value'		
	];
	
	var _colors = [];
	var _settings = [];
	
	_self.ready = init;
	_self.getRequiredScripts = getRequiredScripts;
	_self.getMessageTypes = getMessageTypes;
	_self.messageReceive = messageReceived;

	function init()
	{
		for ( var i = 0; i < _properties.length; i++ )
		{
			_colors[i] = '333333';
			_settings[i] = { property: _properties[i], color: '#' + _colors[i], underline: false, bold: false, italic: false };
		}
		
		var html = '<ul>';
		
		for ( var i = 0; i < _properties.length; i++ )
		{
			html += '<li>';
			html +=		'<p class="type">' + _properties[i] + '</p>';
			html +=		'<input type="color" class="color" value="' + _colors[i] + '" />';
			
			if ( _properties[i] !== 'background' )
			{
			
			html +=		'<a href="#bold" class="text-button text-bold">b</a>';
			html +=		'<a href="#italic" class="text-button text-italic">i</a>';
			html +=		'<a href="#underline" class="text-button text-underline">u</a>';
			
			}
			
			html +=	'</li>';
		}

		html += '</ul>';
		
		_element.append( html );

		colorPickersAdd( _element );
		buttonsAdd( _element );
	}

	function colorPickersAdd( $element )
	{
		var colorpicker_options = {
			alpha: false,
			buttonImageOnly: true
		};

		$( 'li', $element ).each(
			function( $index, $item )
			{
				colorpicker_options.onSelect = colorChanged;
				
				$( $item )
					.find( '.color' )
					.colorpicker( colorpicker_options );
				
				$( $item )
					.find( '.type ' )
					.css( { color: '#' + _colors[$index] } );
			}
		);
	}
	
	function buttonsAdd( $element )
	{
		$( '.text-button', $element ).click( buttonClicked );
	}
	
	function colorChanged( $hex, $rgba, $inst )
	{
		if ( $inst )
		{
			var instance = $( $inst.element )
			var property = instance.prev().text();
			var type = 'color';
			var message = { type: property, color: $hex };			
			var index = instance.closest( 'li' ).index();			
			
			if ( property !== 'background' )
			{
				instance
					.prev()
					.css( { color: $hex } );
			}
			
			else
			{
				instance.css( { backgroundColor: $hex } );
			}
			
			_settings[index].color = $hex;
			
			Chainsaw.messageSend( type, message );
		}
	}
	
	function buttonClicked( $event )
	{
		var target = $( $event.target );
		var button_type = target.attr( 'href' ).replace( '#', '' );		
		var type = target.closest( 'li' ).find( '.type' );
		var css = {};
		var index = target.closest( 'li' ).index();
		
		$event.preventDefault();
		
		target.toggleClass( 'active' );
		
		if ( button_type === 'bold' )
		{
			css.key = 'font-weight';
			
			if ( target.hasClass( 'active' ) )
			{
				css.value = 'bold';
			}
			
			else
			{
				css.value = 'normal';
			}
		}
		
		if ( button_type === 'italic' )
		{
			css.key = 'font-style';
			
			if ( target.hasClass( 'active' ) )
			{
				css.value = 'italic';
			}
			
			else
			{
				css.value = 'normal';
			}
		}
		
		if ( button_type === 'underline' )
		{
			css.key = 'text-decoration';
			
			if ( target.hasClass( 'active' ) )
			{
				css.value = 'underline';
			}
			
			else
			{
				css.value = 'none';
			}
		}
				
		type.css( css.key,  css.value );
		
		_settings[index][button_type] = target.hasClass( 'active' );
		
		Chainsaw.messageSend( 'text', { type: type.text(), style: css } );
	}
	
	function messageReceived( $type, $message )
	{
		if ( $type === 'get_results' )
		{
			Chainsaw.messageSend( 'result', _settings );
		}
	}

	function getRequiredScripts()
	{
		return _required_scripts;
	}
	
	function getMessageTypes()
	{
		return _message_types;
	}
}

Chainsaw.componentAdd( valuelist, 'valuelist');