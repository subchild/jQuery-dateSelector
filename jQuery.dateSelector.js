/**
 * jQuery.dateSelector()
 *
 * @author      Aleksandar Kolundzija
 * @version     3.0 alpha (first widgetized version)
 *
 * 
 * @requires jQuery
 * @requires jQuery UI Core, jQuery UI Widget
 * 
 * @TODO Add support for dynamically loading associated CSS file
 * @TODO Use real Date object internally and provide methods for returning string values as needed
 * 
 * To use, call on an (ideally empty) DOM container
 * $("#dateSelector").dateSelector();
 * 
 * To display, call show:
 * $("#dateSelector").dateSelector("show", ...);
 * 
 * To process a selection, bind to "dateSelected":
 * $("#dateSelector").dateSelector().bind("dateSelected", function(e, date){
 *      // do something with date {String}
 * });
 */
 

$.widget("sub.dateSelector", { 

	_MONTH_NAMES   : ["January","February","March","April","May","June","July","August","September","October","November","December"],
	_WEEKDAY_NAMES : ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"],
		
	_cfg : {
		date        : new Date(), // today by default // @TOTO use this
		cssUrl      : "", // @TODO add support for this
		allowRanges : false,
		theme       : "default"
	},
	
	_limitFrom    : null, // {Date}
	_limitTo      : null, // {Date},	
	
	month         : null,
	year          : null, 
	selectedDates : [],		
	
	
	/**
	 * @param  	{Number} Month index (Optional) ZERO BASED
	 * @return 	{Number} Days in current/passed month
	 */
	_getDaysInMonth: function(/* month */){
		var m = arguments[0] || this.month-1;
		return 32 - new Date(this.year, m, 32).getDate();
	},
	
	
	/**
	 * @param  	{Number} Month index (Optional) ZERO BASED
	 * @return 	{Number} Days in current/passed month
	 */
	_getWeekdayIndexFirstOfMonth: function(/* month */){
		var m = arguments[0] || this.month-1;
		return (new Date(this.year, m, 1)).getDay();
	},
	

	/** 
	 * Returns month name in English.
	 * @return 	{String}
	 */
	_getMonthName: function(){
		var month = ""+this.month;
		return (month.charAt(0)==="0") ? 
		            this._MONTH_NAMES[month.charAt(1)-1] : 
		            this._MONTH_NAMES[month-1];
	},
	
	
	/**
	 * Returns date of first of previous month.
	 * @return	 {Date}
	 */
	_getPrevMonthDate: function(){
		var prevStr = this.month===1 ? 
		                (this.year-1)+"/12/01" : 
		                this.year+"/"+this._getTwoDigit(this.month-1)+"/01";
		return new Date(prevStr);
	},
	

	/**
	 * Returns date of first of next month.
	 * @return 	{Date}
	 */
	_getNextMonthDate: function(){
		var nextStr = this.month===12 ? 
		                (1+this.year)+"/01/01" : 
		                this.year+"/"+this._getTwoDigit(1+this.month)+"/01";
		return new Date(nextStr);
	},
	

	/**
	 * Returns leading zero if needed. Only supports 2-digit strings.
	 * @param 	num {String|Number}
	 * @return 	String
	 */
	_getTwoDigit: function(num){
		var numStr = ""+num;
		return numStr.length===2 ? numStr : "0"+numStr;
	},
	
	
	/**
	 * Removes leading zero if present.  Only supports 2-digit strings.
	 * @param 	num {String|Number}
	 * @return 	String			 
	 */
	_removeLeadingZero: function(num){
		var numStr = ""+num;
		return retVal = numStr.charAt(0)==="0" ? numStr.charAt(1) : numStr;
	},
	
	
	/**
	 * @param dateVal {String} yyyymmdd
	 * @return {Date}
	 */
	getDateObj: function(dateVal){
		dateVal = dateVal ? ""+dateVal : "";
		return new Date(dateVal.replace(/^(\d{4})(\d\d)(\d\d)/,"$1/$2/$3"));
	},
	
	
	/**
	 * @param month {Number} 1-12
	 * @param year  {Number} yyyy
	 */
	_setMonthAndYear: function(month, year){
		var today  = new Date();
		this.month = (month && month>0 && month<13) ? month : today.getMonth()+1;
		this.year  = year || today.getFullYear();
	},

	
	/**
	 * Generates HTML string for calendar widget.
	 * @return 	{String}
	 */
	_getCalendarHtml: function(){
		var curDay         = 1,
				curDayTwoDigit = "01",
				curDate        = null,
				weekdayIndex   = this._getWeekdayIndexFirstOfMonth(),
				isFirstWeek    = true,
				isDateInRange  = true,
				monthTwoDigit  = this._getTwoDigit(this.month),
				daysInMonth    = this._getDaysInMonth(),
				out = "<table class='monthNav'>" + 
					    "<tr>" +
						    "<td class='monthLink'><a href='#' class='dateSel-prevMonthLink'>&laquo; Prev</a></td>" +
								"<td class='curMonth'>" + this._getMonthName() + " " + this.year + "</div>" +
								"<td class='monthLink next'><a href='#' class='dateSel-nextMonthLink'>Next &raquo;</a></td>" +
							"</tr>" +
							"</table>" +
							"<table class='monthDays'>" +
							"<thead><tr>";
		for (var i=0; i<this._WEEKDAY_NAMES.length; i++){
			out += "<td>" + this._WEEKDAY_NAMES[i] + "</td>";
		}
		out += "</tr></thead><tbody>";
		while (curDay <= daysInMonth){
			// draw blank days in first week
			if (isFirstWeek && weekdayIndex != 0){
				out += "<tr>";
				for (var i=1; i<=weekdayIndex; i++){
					out += "<td class='blank'>&nbsp;</td>";
				}
				isFirstWeek = false;
			}
			else {
				isFirstWeek = false;
			}
			if (weekdayIndex==0){
				out += "<tr>"; // if weekday is Sunday, open new table row
			}
			out += "<td class='cell-"+curDayTwoDigit+" day" + 
							(( this.isToday(this.year + monthTwoDigit + curDayTwoDigit) ) ? " today":"" ) + "'>";
			curDate = new Date(this.year, this.month-1, curDay);
			isDateInRange = (this._limitFrom) ? (curDate >= this._limitFrom) : isDateInRange; // if start date is set, check if curDate is after it
			isDateInRange = (this._limitEnd)  ? (curDate <= this._limitEnd)  : isDateInRange; // if end date is set, check if curDate is before it
			isDateInRange = (this._limitFrom && this._limitEnd) ? (curDate >= this._imitFrom && this._limitEnd) : isDateInRange; // if range is set, check if curDate is within it
			if (isDateInRange){
				out += "<a href='#' class='dateSel-validDate' data-cell-id='cell-"+curDayTwoDigit + 
								"' data-date-string='"+this.year+monthTwoDigit+curDayTwoDigit+"'>" + curDay + "</a>";
			}
			else {
				out += "<div class='dateSel-outOfRange'>" + curDay + "</div>";
			}
			out += "</td>";
			if (weekdayIndex==6) out += "</tr>\n"; // if weekday is Saturday, close table row
			weekdayIndex++;
			weekdayIndex = weekdayIndex % 7;
			curDay++;
			curDayTwoDigit = this._getTwoDigit(curDay);					
		}
		// draw blank days in last week
		while (weekdayIndex < 7 && weekdayIndex != 0){
			out += "<td class='blank'>&nbsp;</td>";
			weekdayIndex++;
		}
		out += "</tr></tbody></table>";
		out += "<table class='subLinks'>";
		out += "<tr><td>";
		if (this._cfg.allowRanges){
			out += "<a href='#' class='dateSel-resetButton'>Reset</a>";
		}
		out += "</td><td class='dateSel-closeWrap'><a href='#' class='dateSel-closeButton'>Close</a></td></tr>";
		out += "</table>";
		return out;
	},
	
	
	/**
	 * Toggles selectedDates[] on widget
	 * @TODO consider using regex instead of substr()		 
	 */
	_highlightSelectedDays: function(){
		var _self = this;
		$.each(this.selectedDates, function(i, curDate){
			if (_getTwoDigit(_self.month)===curDate.substr(4,2) && _self.year===curDate.substr(0,4)){
				_self._toggleCell("cell-" + curDate.substr(6,2), curDate, true);
			}
		});
	},
	

	
	/**
	 * Resets selected dates
	 */
	_reset: function(){
		this.selectedDates.length = 0;
		this.element.find(".selectedDay").removeClass("selectedDay");
	},		
	 

	/**
	 * Creates a date selector
	 */
	_create: function(){
		//	$.extend(_cfg, cfg); // configure	
				
		// Event handler assignments
		var _self = this;
		this.element.find(".dateSel-prevMonthLink").live("click", function(e){
			e.preventDefault();
			var d = _self._getPrevMonthDate();
			_self.show(d.getMonth()+1, d.getFullYear());
			_self.element.trigger("prevMonthLink", [d.getMonth()+1, d.getFullYear()]);
		});
		this.element.find(".dateSel-nextMonthLink").live("click", function(e){
			e.preventDefault();
			var d = _self._getNextMonthDate();
			_self.show(d.getMonth()+1, d.getFullYear());
			_self.element.trigger("nextMonthLink", [d.getMonth()+1, d.getFullYear()]);			
		});
		this.element.find(".dateSel-validDate").live("click", function(e){
			e.preventDefault();
			_self._toggleCell($(this).attr("data-cell-id"), $(this).attr("data-date-string"), false);
			_self.element.trigger("dayClick");
		});
		this.element.find(".dateSel-resetButton").live("click", function(e){
			e.preventDefault();
			_self.reset();
			_self.element.trigger("reset");
		});
		this.element.find(".dateSel-closeButton").live("click", function(e){
			e.preventDefault();
			_self.hide();
			_self.element.trigger("close");
		});
	},
	
	
	_init: function(){
		this.element.hide();
	},
	
	
	/**
	 * Displays dateSelector. Injects into DOM if not already there.
	 * @param month {Number} Optional
	 * @param year  {Number} Optional
	 * @see setMonthAndYear()
	 */
	show: function(/* month, year */){
		this.element.trigger("beforeShow");
		this._setMonthAndYear.apply(this, arguments);
		this.element.html(this._getCalendarHtml()).fadeIn("fast");
		this._highlightSelectedDays();
		this.element.trigger("afterShow");
	},
		

	/**
	 * Hides dateSelector.
	 */
	hide: function(){
		this.element.trigger("beforeHide");
		this._reset();
		this.element.fadeOut("fast");
		this.element.trigger("afterHide");
	},
		
	
	/** 
	 * @param startDate {Date}
	 * @param endDate   {Date}
	 */
	setDateLimits: function(startDate, endDate){
		this._limitFrom = startDate;
		this._limitTo   = endDate;
	},
	
	
	/**
	 * Returns string represantation of passed date given custom function
	 * @param 	dateVal        {String}   yyyymmdd
	 * @param 	customFunction {Function} custom date function
	 * @return 	{String}
	 */
	getDateString: function(dateVal, customFunction){
		var date = this._getDateObj(dateVal);
		if (date){
			if (customFunction){ 
				return date['customFunction'].apply(null,[]);
			}
			return date.toDateString();
		}
	},


	/**
	 * Selects or de-selects date (based on previous state).
	 * Only applies when in multi-select state.
	 * @param cellId              {String} td.id
	 * @param dateString          {String} yyyymmdd
	 * @param onlyChangeCellColor {String} @TODO Why? 
	 */
	_toggleCell: function(cellId, dateString, onlyChangeCellColor){
		var $cell = this.element.find("."+ cellId);
		if ($cell.hasClass("selectedDay")){ // deselect day
			$cell.removeClass("selectedDay");
			if (!onlyChangeCellColor){
				this.removeDate(dateString);
				this.element.trigger("deselect");
			}
		}
		else { // selectDay
			$cell.addClass("selectedDay");
			if (!onlyChangeCellColor){
				this.addDate(dateString);
			}
		}
		if (!onlyChangeCellColor){ // used by highlightSelectedDates for already selected dates

		}
	},
	
	
	/**
	 * Adds date to selectedDates[].
	 * @param {String} date A string in YYYYMMDD format.
	 */
	addDate: function(date){
		this.selectedDates.push(date);
		this.element.trigger("dateSelected", [date]);
	},
	

	/**
	 * Removes passed date from selectedDates[]
	 * @param {String} date A string in YYYYMMDD format.
	 */
	removeDate: function(date){
		var remainingDates = [];
		$.each(this.selectedDates, function(i,n){
			if (n != date){
				remainingDates.push(n);
			}
		});
		this.selectedDates = remainingDates;
	},
		

	/**
	 * @param today {String} yyyymmdd
	 */
	setToday: function(today){
		this.today = today;
	},
	
	
	/**
	 * Checks if passed value is equal to currently stored today value.
	 * @param curDate {String} yyyymmdd
	 * @returns {boolean}
	 */
	isToday: function(curDate){
		return (this.today && curDate === this.today);
	}

});
