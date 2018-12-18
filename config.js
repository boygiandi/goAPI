// boygiandi - 2018
const  Config = {
	port : 3333,
	db : {
	},
	sub_path : "/api",
	secret_string: "^*B(H()",
	origin: ["https://localhost:8080", "https://gostreamvn.com"],

	error : {
		"controller_not_found"	: [101, "Controller not found"],
		"action_not_found"		: [102, "Action not found"],
		"invalid_checksum"		: [103, "Invalid checksum"]
	},
	request_timeout: 60,
	debug: true,
	firebase: {
		databaseURL: "https://gostream-838c9.firebaseio.com"
	}
}

module.exports = Config;