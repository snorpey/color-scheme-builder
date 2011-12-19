function result( $element )
{
	var _self = this;
	var _element = $element;
	var _message_types = ['color', 'text', 'result'];

	_self.ready = init;
	_self.messageReceive = messageReceived;
	_self.getMessageTypes = getMessageTypes;
	
	var _settings = [];
	var _minify = false;
	
	function init()
	{
		_element
			.find( 'input[type="text"]' )
			.keyup( nameChanged )
			.keydown( nameChanged )
			.focus( nameChanged )
			.blur( nameChanged );
		
		_element
			.find( 'input[type="checkbox"]' )
			.change( checkboxChanged );
			
		_element
			.find( 'input[type="text"]' )
			.focus( nameChanged )
			.blur( nameChanged );
	}
	
	function nameChanged()
	{
		var target = $( 'input[type="text"]', _element );
		
		if ( target.val() )
		{
			Chainsaw.messageSend( 'get_results' );
			
			_element.addClass( 'active' );
			
			$( 'textarea', _element ).text( resultText( target.val() ) );
		}
		
		else
		{
			_element.removeClass( 'active' )
			$( 'textarea', _element ).text( '' );
		}
	}
		
	function messageReceived( $type, $message )
	{	
		if ( $type !== 'result' )
		{
			Chainsaw.messageSend( 'get_results' );
		}
		
		else
		{
			_settings = $message;
		}
	}
	
	function checkboxChanged( $event )
	{
		var target = $( 'input[type="checkbox"]', _element );
		
		if ( target.is( ':checked' ) )
		{
			_minify = true;
		}
		
		else
		{
			_minify = false;
		}
		
		nameChanged();
	}
	
	function resultText( $name )
	{
		var name = stringToSlug( $name );
		var result_text = '';
		var text_styles = '';
		
		var new_line = '\n';
		var tab = '\t';
		var space = ' ';
		
		if ( _minify )
		{
			new_line = '';
			tab = '';
			space = '';
		}
		
		for ( var i = 0; i < _settings.length; i++ )
		{
			var item = _settings[i];
			
			
			if (
				item.property !== 'background' &&
				item.property !== 'text'
			)
			{		
				var font_weight = item.bold ? 'bold' : 'normal';
				var font_style = item.bold ? 'italic' : 'normal';
				var decoration = item.underline ? 'underline' : 'none';
				
				if ( item.property !== 'text' )
				{
					result_text += '.sh_' + name + ' .sh_sourceCode .sh_' + item.property + new_line;
				}
				
				else
				{
					result_text += '.sh_' + name + ' .sh_sourceCode' + new_line;
				}
				
				result_text += '{' + new_line;
				result_text += tab + 'font-weight:' + space + font_weight + ';' + new_line;
				result_text += tab + 'font-style:' + space + font_style + ';' + new_line;
				result_text += tab + 'text-decoration:' + space + decoration + ';' + new_line;
				result_text += tab + 'color:' + space + item.color + ';' + new_line;
				result_text += '}' + new_line + new_line;
			}
			
			else
			{
				if ( item.property === 'text' )
				{
					var font_weight = item.bold ? 'bold' : 'normal';
					var font_style = item.bold ? 'italic' : 'normal';
					var decoration = item.underline ? 'underline' : 'none';
					
					text_styles += tab + 'font-weight:' + space + font_weight + ';' + new_line;
					text_styles += tab + 'font-style:' + space + font_style + ';' + new_line;
					text_styles += tab + 'text-decoration:' + space + decoration + ';' + new_line;
					text_styles += tab + 'color:' + space + item.color + ';' + new_line;
				}
				
				if ( item.property === 'background' )
				{
					text_styles += tab + 'background:' + space + item.color + ';' + new_line;
				}
			}
		}
		
		if ( text_styles )
		{
			text_styles = '.sh_' + name + ' .sh_sourceCode' + new_line + '{' + new_line + text_styles + '}' + new_line + new_line;
			
			result_text = text_styles + result_text;
		}
		
		return result_text;
	}
	
	function stringToSlug( $string )
	{
		$string = $string.replace(/^\s+|\s+$/g, ''); // trim
		$string = $string.toLowerCase();
		
		// remove accents, swap ñ for n, etc
		var from = "àáäâèéëêìíïîòóöôùúüûñç·/_,:;";
		var to   = "aaaaeeeeiiiioooouuuunc------";
		
		for ( var i = 0, l = from.length ; i < l; i++ )
		{
			$string = $string.replace( new RegExp( from.charAt( i ), 'g'), to.charAt( i ) );
		}
		
		$string = $string
					.replace(/[^a-z0-9 -]/g, '') // remove invalid chars
					.replace(/\s+/g, '-') // collapse whitespace and replace by -
					.replace(/-+/g, '-'); // collapse dashes
		
		return $string;
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

Chainsaw.componentAdd( result, 'result');