// boygiandi - 2018
const fs = require('fs');
var md5 = require('md5');

class Controller {
	constructor(class_path, config) {
		this.config = config;
		fs.readdirSync(class_path).forEach(file => {
			const filename = file.split("/").pop().split(".").shift();
			if ( filename.length )
				this[filename] = new (require(`${class_path}/${filename}.js`))(this);
		});
	}

	returnError(obj) {
		if ( typeof obj.error==="string" ) {
			obj.error = {
				"code" 		: this.config['error'][obj.error]?this.config['error'][obj.error][0]:0,
				"message" 	: this.config['error'][obj.error]?this.config['error'][obj.error][1]:obj.error
			}
		}
		return obj;
	}

	validRequest(req) {
		if ( !req.query['time'] || !req.query['sig'] )
			return {"error": "invalid_checksum"};
		if this.config.request_timeout:
			if ( req.query['now']-parseInt(req.query['time'])>this.config.request_timeout )
				return {"error": "invalid_request_time", "current": req.query['now']};
		let tmp_string = req.query['time'] + this.config['secret_string'];
		if ( req.body && typeof req.body==="string" ) tmp_string += req.body;
		if ( md5(tmp_string)!==req.query['sig'] )
			return {
					"error": "invalid_checksum", 
					detail: this.config.debug?{
								tmp_string,
								sig: md5(tmp_string)
							}:{}
				}
		return true;
	}
};

module.exports = Controller;