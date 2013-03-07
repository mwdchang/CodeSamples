////////////////////////////////////////////////////////////////////////////////
//
// This javascript class is responsible for rendering a
// scrollable list with the D3 library
//
// Usage:
//    ListWidget widget = new ListWidget(100, 100, 200, 400, "div1");
//    widget.init();
//    widget.draw( [a, b, c, d, e] );
//
// The widget will highlight if
// 1) The item is in the filter
// 2) The item is brush/linked from another widget (IE: artifact widget)
// 3) The item is co-occurring with the selected item in some manner (IE: through artifact widget)
//
////////////////////////////////////////////////////////////////////////////////


////////////////////////////////////////////////////////////////////////////////
// Constructor
//  n - name/id of the widget, this need to be unique
//  w - width
//  h - height
//  id - the id of the container div tag
//  label - text label for the widget
////////////////////////////////////////////////////////////////////////////////
function ListWidget(n, w, h, id, label) {

   // Position and size attributes
   this.width = w;
   this.height = h;
   this.id = id;

   // Identifier attributes
   this.widgetId = n;
   this.widgetLabelId = n + "_label";

   // Label
   this.labelName = label;
   this.label = null;

   // Reference to the widget and
   // widget components
   this.widget = null;
   this.topIndicator = null;
   this.bottomIndicator = null;
   this.upArrow = null;
   this.downArrow = null;
   this.scrollbar = null;
   this.scrollbarIndicator = null;


   // Calculate the widget offsets, refer to
   // ListWidget schematics...you are unlikely going to understand this. 
   // DO NOT CHANGE THE ORDER !!!!
   this.rightMarginW = this.width * 0.1;
   this.rightMarginH = this.height;

   this.leftMarginW = this.width * 0.1;
   this.leftMarginH = this.height;

   this.topMarginH = this.height*0.15;
   this.topMarginW = this.width - (this.rightMarginW + this.leftMarginW);

   this.bottomMarginH = this.height*0.15;
   this.bottomMarginW = this.width - (this.rightMarginW + this.leftMarginW);


   this.topIndicatorH = this.height*0.02;
   this.topIndicatorW = this.topMarginW;

   this.bottomIndicatorH = this.height*0.02;
   this.bottomIndicatorW = this.bottomMarginW;

   this.contentW     = this.width  - (this.leftMarginW + this.rightMarginW);
   this.contentH     = this.height - (this.topMarginH + this.bottomMarginH + this.topIndicatorH + this.bottomIndicatorH);

   this.upArrowW   = this.rightMarginW;
   this.upArrowH   = this.rightMarginH*0.1;
   this.downArrowW = this.rightMarginW;
   this.downArrowH   = this.rightMarginH*0.1;
   this.scrollW      = this.rightMarginW;
   this.scrollH      = this.contentH;





   // Element attributes
   this.barHeight = 25;
   this.offset    = 0;

   // Data used for display
   this.displayData = [];
   this.dataLength = 0;


   // Function objects, these should be implemented by the controller
   // Each components should get its own set of listeners,
   // do not share unless there is a reason to
   this.nothing = function() { console.log("Not implemented"); };  // DO NOT OVERRIDE THIS !!!
   this.mouseoverFunc = this.nothing;
   this.mouseoutFunc  = this.nohintg;
   this.mouseclickFunc = this.nothing;
   this.root_action = this.nothing;


   // Colours
   this.colourIndicatorOff = d3.rgb(68, 68, 68);
   this.colourIndicatorOn  = d3.rgb(0, 170, 255);
   this.colourCoordHighlight = d3.rgb(44, 127, 184);
   this.colourHighlight      = d3.rgb(255, 127, 0);
   this.colourText  = d3.rgb(255, 255, 255);
   this.colourArrow = d3.rgb(188, 188, 188);
   this.colourArrowOutline   = d3.rgb(222, 222, 222);
   this.colourArrowHighlight = d3.rgb(0, 170, 255);


}






////////////////////////////////////////////////////////////////////////////////
// Prototype functions
////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////
// Initializes a container group and setup a scrollable transformation
// based on the number of items in displayData
////////////////////////////////////////////////////////////////////////////////
ListWidget.prototype.init = function() {

   // Selft-reference
   var myRef = this;



   // Initialize the main container
   this.widget = d3.select(this.id).append("svg")
      .attr("id", this.widgetId)
      .attr("class", "taglist")
      .append("g")
      .attr("transform", "translate(" + myRef.leftMarginW + "," + (myRef.topMarginH + myRef.topIndicatorH) + ")")
      .append("g")
      .append("svg")
      .attr("width", myRef.contentW) 
      .attr("height", myRef.contentH)
      .append("g")
      .call(
         d3.behavior.drag()
         .on("drag", function(d, i) {

            myRef.offset += d3.event.dy;
            if (myRef.offset > 0) 
               myRef.offset = 0;
            if (myRef.offset < -(myRef.displayData.length*myRef.barHeight)+myRef.contentH) 
               myRef.offset = Math.min(0, -(myRef.displayData.length*myRef.barHeight)+myRef.contentH);
            d3.select(this).attr("transform", "translate(0," + myRef.offset +")");

            var show = -myRef.offset / myRef.barHeight; // Number of items shown
            var unit = myRef.contentH/myRef.displayData.length;
            myRef.scrollbarIndicator.attr("y", show*unit + (myRef.topMarginH+myRef.topIndicatorH));
         })
      )
   ;



   // Create a data-scroll indicator at the top of the widget
   this.topIndicator = d3.select("#"+this.widgetId)
      .append("rect")
      .attr("x", myRef.leftMarginW)
      .attr("y", myRef.topMarginH)
      .attr("width", myRef.contentW)
      .attr("height", myRef.topIndicatorH)
      .attr("fill", myRef.colourIndicatorOff)
   ;

   // Create a data-scroll indicator at the bottom of the widget
   this.bottomIndicator = d3.select("#"+this.widgetId)
      .append("rect")
      .attr("x", myRef.leftMarginW)
      .attr("y", (myRef.topMarginH+myRef.topIndicatorH+myRef.contentH))
      .attr("width", myRef.contentW)
      .attr("height", myRef.bottomIndicatorH)
      .attr("fill", myRef.colourIndicatorOff)
   ;


   // Create arrows
   this.upArrow = d3.select("#"+this.widgetId)
      .append("svg:path")
      .attr("fill", this.colourArrow)
      .attr("stroke", this.colourArrowOutline)
      .attr("id", "upArrow")
      .attr("transform", "translate(" + (myRef.width-0.5*myRef.rightMarginW) + "," + myRef.topMarginH + ")")
      .attr("d", d3.svg.symbol().type("triangle-up").size(50))
      .on("mouseover", function(d) { d3.select(this).attr("fill", myRef.colourArrowHighlight); })
      .on("mouseout", function(d) { d3.select(this).attr("fill", myRef.colourArrow); })
      .on("mousedown", function(d) {
         d3.event.preventDefault();
         d3.event.stopPropagation();
         myRef.offset += myRef.barHeight;
         if (myRef.offset > 0) 
            myRef.offset = 0;
         if (myRef.offset < -(myRef.displayData.length*myRef.barHeight)+myRef.contentH) 
            myRef.offset = Math.min(0, -(myRef.displayData.length*myRef.barHeight)+myRef.contentH);
         myRef.widget.attr("transform", "translate(0," + myRef.offset +")");


         var show = -myRef.offset / myRef.barHeight; // Number of items shown
         var unit = myRef.contentH/myRef.displayData.length;
         myRef.scrollbarIndicator.attr("y", show*unit+(myRef.topMarginH+myRef.topIndicatorH));

      })
   ;

   this.downArrow = d3.select("#" + this.widgetId)
      .append("svg:path")
      .attr("fill", this.colourArrow)
      .attr("stroke", this.colourArrowOutline)
      .attr("id", "downArrow")
      .attr("transform", "translate(" + (myRef.width-0.5*myRef.rightMarginW) + "," + (myRef.height-myRef.bottomMarginH) +  ")")
      .attr("d", d3.svg.symbol().type("triangle-down").size(50))
      .on("mouseover", function(d) { d3.select(this).attr("fill", myRef.colourArrowHighlight); })
      .on("mouseout", function(d) { d3.select(this).attr("fill", myRef.colourArrow); })
      .on("mousedown", function(d) {
         d3.event.preventDefault();
         d3.event.stopPropagation();
         myRef.offset -= myRef.barHeight;
         if (myRef.offset > 0) 
            myRef.offset = 0;
         if (myRef.offset < -(myRef.displayData.length*myRef.barHeight)+myRef.contentH) 
            myRef.offset = Math.min(0, -(myRef.displayData.length*myRef.barHeight)+myRef.contentH);
         myRef.widget.attr("transform", "translate(0," + myRef.offset +")");


         var show = -myRef.offset / myRef.barHeight; // Number of items shown
         var unit = myRef.contentH/myRef.displayData.length;
         myRef.scrollbarIndicator.attr("y", show*unit + (myRef.topMarginH+myRef.topIndicatorH));

      })
   ;

   this.scrollbar = d3.select("#" + this.widgetId)
      .append("rect")
      //.attr("transform", "translate(" + (20+this.width) + "," + 30 +  ")")
      .attr("x", (myRef.leftMarginW+myRef.contentW+0.5*myRef.rightMarginW))
      .attr("y", (myRef.topMarginH+myRef.topIndicatorH))
      .attr("width", 2)
      .attr("height", myRef.scrollH)
      .attr("fill", "#AAAAAA")
      .style("opacity", 0.5)
   ;

   this.scrollbarIndicator = d3.select("#" + this.widgetId) 
      .append("rect")
      //.attr("transform", "translate(" + (19+this.width) + "," + 30 +  ")")
      .attr("x", (myRef.leftMarginW+myRef.contentW+0.5*myRef.rightMarginW) - 1)
      .attr("y", (myRef.topMarginH+myRef.topIndicatorH))
      .attr("width", 4)
      .attr("height", 0)
      .attr("fill", "#FFAA00")
      .style("opacity", 0.8)
      .call(
         d3.behavior.drag()
         .on("drag", function(d, i) {
            var y1 = parseFloat(myRef.scrollbarIndicator.attr("y")) - (myRef.topMarginH+myRef.topIndicatorH);
            var y2 = d3.event.dy;
            var y3 = y1+y2;
            var h =  parseFloat(myRef.scrollbarIndicator.attr("height"));

            y3 = Math.max(0, y3);
            y3 = Math.min( (myRef.contentH-h), y3); 

            myRef.scrollbarIndicator.attr("y", y3 + (myRef.topMarginH+myRef.topIndicatorH));

            var offset = (-y3/myRef.contentH)*myRef.barHeight*myRef.displayData.length;


            myRef.offset = offset;
            myRef.widget.attr("transform", "translate(0," + myRef.offset +")");

         })
      ) 
   ;


   


   // Text tends to be a little quirky, we need a way to 
   // find out how tall they are, they are also not centred
   // at the corner...
   this.label = d3.select("#"+this.widgetId)
      .append("g")
      .attr("transform", "translate(" + myRef.leftMarginW + "," + 10 + ")")
   ;
   
   
 
}



////////////////////////////////////////////////////////////////////////////////
// Render
//
// We expect that the data is of the following format:
// [ {name:xxx, freq:xxx}, {name:xxx, freq:xxx} ]
////////////////////////////////////////////////////////////////////////////////
ListWidget.prototype.render = function( vdata ) {
   // Reset the transformation 
   this.widget.attr("transform", "translate(0,0"); 
   this.offset = 0;

   this.displayData = vdata;

   this.dataLength = this.displayData.length;

   var myRef = this;

   var show = this.contentH / this.barHeight; // Number of items shown
   var unit = this.contentH /this.displayData.length;

   
   // Remove the data nodes
   this.widget.data([this.displayData] ).selectAll("rect").remove();
   this.widget.data([this.displayData] ).selectAll("text").remove();
   this.widget.data([this.displayData] ).selectAll("circle").remove();
   this.label.selectAll("#label").remove();


   // Calculate the max and min frequencies
   var freqMax = Number.MIN_VALUE;
   var freqMin = Number.MAX_VALUE;
   for (var i=0; i < this.displayData.length; i++) {
      if (this.displayData[i].freq > freqMax) freqMax = this.displayData[i].freq;
      if (this.displayData[i].freq < freqMin) freqMin = this.displayData[i].freq;
   }
   //console.log("Max value = " + freqMax + "  Min Value = " + freqMin);


   this.label.append("text")
      .attr("id", "label")
      .attr("y", function(d,i) { return 10; })
      .attr("dy", ".35em")
      .style("fill", myRef.colourText)
      .style("font", "18px sans-serif")
      .text(this.labelName + this.dataLength)
   ;



   // Render horizontal rectangle bars
   this.widget.selectAll("rect")
      .data(this.displayData.map(function(d,i) { 
         //if (typeof d == "object") return {val:d.name, freq:d.freq, idx:i};
         if (typeof d == "object") return {val:d.name, freq:d.freq, idx:i};
         return {val:d, freq:0, idx:i};
      }))
      .enter()
      .append("rect")
      .attr("id", "rectBar")
      .attr("y", function(d, i) { return 1+i*myRef.barHeight; })
      .attr("x", 20)
      //.attr("width", function(d, i) { return 0; })
      .attr("width", function(d, i) { return (myRef.contentW); })
      .attr("height", myRef.barHeight-1)
      .attr("stroke", null)
      .attr("fill", function(d) { 
         d.c = myRef.colourHighlight;
         return d.c;
      })
      .style("opacity", function(d) {
         if (myRef.filter && d.val in myRef.filter) {
            d.opacity = 1;
         } else {
            d.opacity = 0;
         }
         return d.opacity;
      })
      .style("pointer-events", "none")
      .on("mouseover", myRef.mouseoverFunc)
      .on("mouseout", myRef.mouseoutFunc)
      .on("click", myRef.mouseclickFunc)
      .transition()
      .duration(1000)
      .each("end", function(d, i) {
         d3.select(this).style("pointer-events", "all")
         ;
      })
   ;



   // Render list of circles beside the bar that is sized with 
   // respect to the frequency
   this.widget.selectAll("circle")
      .data(this.displayData.map(function(d,i) {
         if (typeof d == "object") return {val:d.name, freq:d.freq?d.freq:0, idx:i};
         return {val:d, freq:0, idx:i};
      }))
      .enter()
      .append("circle")
      .attr("cy", function(d, i) { return i*myRef.barHeight+0.5*myRef.barHeight; })
      .attr("cx", 10)
      .attr("r", function(d, i) {
         return 0;
         /*
         if (d.freq > 0) return 1 + 5*Math.sqrt( d.freq  /  freqMax);
         else return 0;
         */
      })
      .attr("fill", function(d, i) {
         return d3.rgb(0, 0, 0)
      })
      .style("opacity", function(d, i) {
         if ( d.freq > 0) return 1;
         return 0;
      })
   ;



   // Render text for bar
   this.widget.selectAll("text")
      .data(this.displayData.map(function(d,i) { 
         //if (typeof d == "object") return {val:d.name};
         if (typeof d == "object") {
            var tmp = d.name;
            if (tmp.length > 20) tmp = tmp.substring(0,18) + "..."; 
            return {val:tmp};
         }
         return {val:d};
      }))
      .enter()
      .append("text")
      .attr("y", function(d,i) { return i*myRef.barHeight+0.5*myRef.barHeight; })
      .attr("x", 25)
      .attr("dy", ".35em")
      .style("fill", myRef.colourText)
      //.style("font", "bold 12px sans-serif")
      .style("font", compute_font(13))
      .style("pointer-events", "none")
      .text(function(d) { return d.val;})
   ;



   this.scrollbarIndicator.attr("y", (myRef.topMarginH+myRef.topIndicatorH)).attr("height", Math.min(myRef.contentH, show*unit));


}


////////////////////////////////////////////////////////////////////////////////
// Highlight the list widget with respect to a corresponding
// artifact
//
// ar - an artifact node
////////////////////////////////////////////////////////////////////////////////
ListWidget.prototype.highlight = function( ar ) {
   var myRef = this;

   // Pre-compute whether each entity will take part, this way
   // we can reuse it for various elements in the widget rather
   // than re-calculating 
   // Check if list item is in artifact(ar)'s entity list
   // if yes then push in true, else false
   var flags = [];
   for (var i = 0; i < this.displayData.length; i ++) {
      flags.push( DataParser.containsEntity(ar, this.displayData[i].name));
   }


   // High light the circles
   this.widget.selectAll("circle")
      .transition()
      .duration(300)
      .attr("fill", function(d, i) {
         if ( flags[i] ) return  d3.rgb(255, 128, 0);
         return d3.rgb(0, 0, 0);
      })
   ;


   // High light the bars
   this.widget.selectAll("#rectBar")
      .transition()
      .duration(300)
      .attr("fill", function(d, i) {
         if (flags[i]) {
            //top
            if (i*myRef.barHeight + myRef.offset < 0) 
               myRef.topIndicator.transition().duration(300).attr("fill", myRef.colourIndicatorOn);

            //bottom
            if (i*myRef.barHeight + myRef.offset > myRef.contentH) 
               myRef.bottomIndicator.transition().duration(300).attr("fill", myRef.colourIndicatorOn);

            return d.c;
         }
         //return null;
         return d.c;
      })
      .style("opacity", function(d, i) {
         if (flags[i]) {
            return 1.0;
         }
         return d.opacity;
      })
   ;

   this.widget.selectAll("text")
      .transition()
      .duration(300)
      .style("fill", function(d, i) {
         if (flags[i]) {
            return myRef.colourText;
         }
         return myRef.colourText;
      })
   ;



   // Reset the indicators on mouse out
   if ( ar == null) {
      myRef.topIndicator.transition().duration(300).attr("fill", myRef.colourIndicatorOff);
      myRef.bottomIndicator.transition().duration(300).attr("fill", myRef.colourIndicatorOff);
   }

}



////////////////////////////////////////////////////////////////////////////////
// Highlight the coordianted brushing stuff
//
// selected - An associated array containing the currently selected
//            filters
// coord    - An associated array or the related entities in 
//            the form { entity1:occ, entity2:occ, ...}
////////////////////////////////////////////////////////////////////////////////
ListWidget.prototype.coordHighlight = function( selected, coord ) {
   var myRef = this;

   
   // Pre-compute the max and min for the co-occurring entities
   var coordMax = Number.MIN_VALUE;
   var coordMin = Number.MAX_VALUE;
   if (coord != null) {
      for (var e in coord) {
         if (coord[e].freq > coordMax) { coordMax = coord[e].freq; }
         if (coord[e].freq < coordMin) { coordMin = coord[e].freq; }
      }
   } else {
      // Just in case...don't want a divide by zero here
      coordMax = 1;
      coordMin = 1;
   }

   //console.log("max : " + coordMax);
   //console.log("min : " + coordMin);


   this.widget.selectAll("circle")
      .transition()
      .duration(300)
      .attr("fill", function(d, i) {
         if (selected == null && coord == null) return d.c;

         if (selected[ d.val ] )  {
            return  d3.rgb(255, 128, 0);
         } else if (coord[ d.val ] && ! selected[ d.val ]) {
            //top
            if (i*myRef.barHeight + myRef.offset < 0) {
               myRef.topIndicator.transition().duration(300).attr("fill", myRef.colourIndicatorOn);
            }
            //bottom
            if (i*myRef.barHeight + myRef.offset > myRef.contentH) {
               myRef.bottomIndicator.transition().duration(300).attr("fill", myRef.colourIndicatorOn);
            }

            return myRef.colourCoordHighlight;
         }
         return d.c;
      })
      .style("opacity", function(d, i) {
         if ( coord != null && coord[ d.val ] ) {
            return (coord[d.val].freq - coordMin + 1)/( coordMax - coordMin + 1);
         }
         return 1;
      })
   ;


   this.widget.selectAll("#rectBar")
      .transition()
      .duration(300)
      .attr("fill", function(d, i) {
         if (selected == null && coord == null) return d.c;

         if (selected[ d.val ] || (myRef.filter && d.val in myRef.filter) )  {
            return d.c;
         } else if (coord[ d.val ] && ! selected[ d.val ]) {
            //top
            if (i*myRef.barHeight + myRef.offset < 0) {
               myRef.topIndicator.attr("fill", myRef.colourIndicatorOn);
            }
            //bottom
            if (i*myRef.barHeight + myRef.offset > myRef.contentH) {
               myRef.bottomIndicator.attr("fill", myRef.colourIndicatorOn);
            }

            return myRef.colourCoordHighlight;
         }
         return d.c;
      })
      .style("opacity", function(d, i) {
         if (myRef.filter && d.val in myRef.filter) return d.opacity;
         if (selected == null && coord == null) return d.opacity;
         if (selected[d.val]) {
            return 1.0;
         }

         // Intensity Formula
         // Linear :  I = (freq - min + 1)/ (max - min + 1) 
         if (coord[ d.val ] ) {
            return (coord[d.val].freq - coordMin + 1)/( coordMax - coordMin + 1);
         }
         return d.opacity;
      })
   ;


   this.widget.selectAll("text")
      .transition()
      .duration(300)
      .style("fill", function(d, i) {
         if (selected == null && coord == null) return myRef.colourText;
         if (coord[ d.val ] || selected[ d.val ] ) {
            return myRef.colourText;
         }
         return myRef.colourText;
      })
   ;


   // Reset the indicators on mouse out
   if (selected == null && coord == null) {
      myRef.topIndicator.transition().duration(300).attr("fill", myRef.colourIndicatorOff);
      myRef.bottomIndicator.transition().duration(300).attr("fill", myRef.colourIndicatorOff);
   }
}


////////////////////////////////////////////////////////////////////////////////
// Set a filter name
// this name is used to construct the filtering uri. ==> "locations"=yyy
////////////////////////////////////////////////////////////////////////////////
ListWidget.prototype.setFilterAttrib = function( name ) {
   this.filterAttrib = name;
}


ListWidget.prototype.setFilter = function( f ) {
   this.filter = f;
}








