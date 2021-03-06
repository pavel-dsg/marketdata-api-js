module.exports = (() => {
	'use strict';

	/**
	 * Converts a base code into a unit code.
	 *
	 * @function
	 * @param {Number} baseCode
	 * @return {String}
	 */
	function convertBaseCodeToUnitCode(baseCode) {
		switch (baseCode) {
			case -1:
				return '2';
			case -2:
				return '3';
			case -3:
				return '4';
			case -4:
				return '5';
			case -5:
				return '6';
			case -6:
				return '7';
			case 0:
				return '8';
			case 1:
				return '9';
			case 2:
				return 'A';
			case 3:
				return 'B';
			case 4:
				return 'C';
			case 5:
				return 'D';
			case 6:
				return 'E';
			case 7:
				return 'F';
			default:
				return 0;
		}
	}

	return convertBaseCodeToUnitCode;
})();