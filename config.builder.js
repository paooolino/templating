/*
	Available modules

	- pagebase
	
	- welcomeArea_staticImage
	
	- slideText

*/

module.exports = {
	/* the template name */
	"business": {
		
		/* list pages here */
		"index.html": {
			
			/* list modules here */
			"pagebase": {
				"children": {
					"topBar": {},
					"welcomeArea_staticImage": {
						"children": {
							"slideText": {}
						}
					}
				}
			}
			
		}
	}
};