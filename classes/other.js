class Other {
	constructor(parent) {
		this.parent = parent;
	}

	getName() {
		return "Other"
	}

	async GET(db, args) {
		console.log("get_hello");
		return args;
	}

	async POST(db, args) {
		console.log("post hello");
		return args;
	}

	async GET_test(db, args) {
		return "GET_test";
	}

	async POST_test(db, args) {
		return "POST_test";
	}
};

module.exports = Other;