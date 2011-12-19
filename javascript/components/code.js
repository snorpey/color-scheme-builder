function code( $element )
{
	var _self = this;
	var _element = $element;
	var _required_scripts = [ 'javascript/conditional/jquery.snippet.js' ];
	var _message_types = ['color', 'text'];

	_self.ready = init;
	_self.getRequiredScripts = getRequiredScripts;
	_self.messageReceive = messageReceived;
	_self.getMessageTypes = getMessageTypes;
	
	function init()
	{
		var pre = _element.find( 'pre' );
		
		var snippet_options = {
			menu: false,
			collapse: false,
			showMsg: 'show ' + _element.find( 'pre' ).attr( 'lang' ) + ' sample code',
			hideMsg: 'hide ' + _element.find( 'pre' ).attr( 'lang' ) + ' sample code'
		};
		
		$( 'h1', _element ).hide();
		
		pre.snippet( pre.attr( 'lang' ), snippet_options );
	}
	
	function messageReceived( $type, $message )
	{	
		if ( $type === 'color' )
		{
			var color = colorFormat( $message.color );
			
			if (
				$message.type === 'text' ||
				$message.type === 'background'
			)
			{
				if ( $message.type === 'text' )
				{
					$( '.sh_sourceCode', _element ).css( { color: color } );
				}
				
				if ( $message.type === 'background')
				{
					$( '.sh_sourceCode', _element ).css( { backgroundColor: color } );
				}
				
			}
			
			else
			{
				$( '.sh_sourceCode .sh_' + $message.type, _element ).css( { color: color } );
			}
		}
		
		if ( $type === 'text' )
		{
			var css = $message.style;
			
			if ( $message.type === 'text' )
			{
				$( '.sh_sourceCode', _element ).css( css.key, css.value );
			}
			
			else
			{
				$( '.sh_sourceCode .sh_' + $message.type, _element ).css( css.key, css.value );
			}
		}
	}
	
	function colorFormat( $color )
	{
		color = $color;
		
		if ( color )
		{
			if ( color.indexOf( '0x' ) !== -1 )
			{
				color = color.replace( /0x/g, '' );
			}
			
			if (
				color.length === 3 &&
				color.indexOf( '#' ) === -1
			)
			{
				color = color + color;
			}
			
			if ( color.indexOf( '#' ) === -1 )
			{
				color = '#' + color;
			}
		}
			
		return color;
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

Chainsaw.componentAdd( code, 'code');