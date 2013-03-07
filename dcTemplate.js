////////////////////////////////////////////////////////////////////////////////
// Tile based website template based on D3 
////////////////////////////////////////////////////////////////////////////////


var numImages = 4;
var color1 = d3.rgb(100, 100, 200);
var spacing = 4;
var svgContent;
var nothing = function() { return 0; };
var data;


////////////////////////////////////////////////////////////////////////////////
// This function removes tags that are not passed in as documents
////////////////////////////////////////////////////////////////////////////////
function highlight( ) {
   var args = arguments;
   d3.selectAll(".wordTag").each(function(d, i) {
      var name = this.id;
      var found = 0;
      for (var i=0; i < args.length; i++) {
         if (name == args[i]) found = 1;
      }
      if (found == 0) {
         d3.select(this).transition().duration(800).style("opacity", 0);
      }
   });
}

////////////////////////////////////////////////////////////////////////////////
// This functions restores all tags to default state (opacity = 1)
////////////////////////////////////////////////////////////////////////////////
function restoreTag() {
   d3.selectAll(".wordTag").each(function(d, i) {
      d3.select(this).transition().duration(500).style("opacity", 1);
   });
}


////////////////////////////////////////////////////////////////////////////////
// Assign random x, y, and seed to each array elements
// This determines where the square should start
// Note: the seed rnd is not currently in use
////////////////////////////////////////////////////////////////////////////////
var randomize = function( a ) { 
   for (var i=0; i < a.length; i++) {
      a[i].rnd = Math.random();
      a[i].rx  = (Math.random() - 0.5) * 2000;
      a[i].ry  = (Math.random() - 0.5) * 2000;

      //a[i].width  = 200;
      //a[i].height = 200;
   }
}


////////////////////////////////////////////////////////////////////////////////
// Initial load function
////////////////////////////////////////////////////////////////////////////////
function load( data ) {
   var myRef = this;

   randomize( data );

   // SVG for right panel
   svgContent = d3.select("#contentD3")
      .append("svg")
      .attr("width", 800)
      .attr("height", 700)
      .attr("id", "content")
   ;



   SetNavImage();
   moveIn();
   initIntroPanel();
}


////////////////////////////////////////////////////////////////////////////////
// Create an image cache, by splitting an image into smaller squares
////////////////////////////////////////////////////////////////////////////////
function SetNavImage() {
   var background; 
   var imageWidth, imageHeight;

   function getW() { return imageWidth; }
   function getH() { return imageHeight; }

   var randomImg = Math.floor( (Math.random()*numImages ) + 1);

   // Debug
   // randomImg = 4;
   
   background = "images/cover" + randomImg +".jpg";

   var image = new Image();
   image.name = background;
   image.onload = function() {
      imageWidth  = this.width;
      imageHeight = this.height;

      /*
      imageWidth  = 600;
      imageHeight = 600;
      */

      // Create patterns
      var defs = svgContent.append("defs");

      for (var idx = 0; idx < data.length; idx++) {
         //console.log( data[idx].width + " " + data[idx].height + " >> " + data[idx].x + " " + data[idx].y);
         defs.append("pattern")
            .attr("id", "pattern" + data[idx].pattern)
            .attr("patternUnits", "userSpaceOnUse")
            .attr("x", data[idx].x)
            .attr("y", data[idx].y)
            .attr("width", data[idx].width)
            .attr("height", data[idx].height)
            .append("svg:image")
            .attr("xlink:href", background)
            .attr("x", -data[idx].x)
            .attr("y", -data[idx].y)
            .attr("width", imageWidth)
            .attr("height", imageHeight)
      }

      return true;
   };
   image.src = background;
   console.log("Setting nav image " + randomImg);
}



////////////////////////////////////////////////////////////////////////////////
// Converge the squares from random locations to 
// their assigned positions, once they are in place
// set up event handlers
////////////////////////////////////////////////////////////////////////////////
function moveIn() {

   d3.text( "introHeader.htm", function(d) {
      d3.select("#contentHeader").html( d );
   });

   d3.text( "introFooter.htm", function(d) {
      d3.select("#contentFooter").html( d );
   });


   // Animates squares into place
   var rect = svgContent.selectAll("blah")
      .data( data )
      .enter()
      .append("g")
      .attr("class", "node")
      .append("rect")
      .attr("class", "pattern")
      .attr("x", function(d) { return d.rx; })
      .attr("y", function(d) { return d.ry; })
      .attr("width", function(d) { return d.width - 2*spacing; })
      .attr("height", function(d) { return d.height - 2*spacing;})
      .attr("fill", function(d) { return "url(#pattern" + d.pattern + ")"; })
      //.attr("fill", "url(#pattern11)")
      /*
      .append("svg:image")
      .attr("x", function(d) { return d.rx; })
      .attr("y", function(d) { return d.ry; })
      .attr("width", function(d) { return d.width - 2*spacing; })
      .attr("height", function(d) { return d.height - 2*spacing;})
      .attr("xlink:href", function(d) { return d.img1; })
      .attr("preserveAspectRatio", "all")
      .style("opacity", 0)
      */
      .transition()
      .duration( 1800 )
      .attr("x", function(d) { return d.x+spacing; })
      .attr("y", function(d) { return d.y+spacing; })
      .style("opacity", 1)
      .each("end", function(d) {

         var xcoord = d.x;
         var ycoord = d.y; 
         var label  = d.label;
         var id     = d.id;

         // Place this here so the texts are always visible
         svgContent.append("text")
            .attr("class", "label")
            .style("font", "bold 18px Arial")
            .style("pointer-events", "none")
            .style("fill", d3.rgb(255, 255, 255))
            .attr("x", xcoord+50)
            .attr("y", ycoord+100)
            .text( label )
         ;


         var c = d3.select(this.parentNode).append("rect")
            .attr("class", "coverRect")
            .attr("x", d.x)
            .attr("y", d.y)
            .attr("width", function(d) { return d.width;})
            .attr("height", function(d) { return d.height;})
            .style("opacity", 0)
            .on("mouseover", function(d) {
               d3.select(this).attr("fill", color1);
               d3.select(this).style("opacity", 0.65);

               /*
               svgContent.append("text")
                  .attr("class", "label")
                  .style("font", "bold 18px Arial")
                  .style("pointer-events", "none")
                  .style("fill", d3.rgb(255, 255, 255))
                  .attr("x", xcoord+50)
                  .attr("y", ycoord+100)
                  .text( label )
                ;
                */
                hoverOn( id );
            })
            .on("mouseout", function(d) {
               d3.select(this).style("opacity", 0);

               //svgContent.selectAll("text").remove();

               hoverOff( id );
            })
            .on("click", function(d) {
               moveAway();
               loadPage( d.ref );
            })
         ;
      })
   ;    
}

////////////////////////////////////////////////////////////////////////////////
// Move the squares back to their original starting point
////////////////////////////////////////////////////////////////////////////////
function moveAway() {
   // Disable further interactions
   d3.selectAll("g.node").selectAll(".coverRect")
      //.style("pointer-events", "none")
      .on("mouseout", nothing)
      .on("mouseover", nothing)
      .transition()
      .duration(2000)
      .attr("x", function(d) { return 2000; })
      .each("end", function(d) {
         d3.select(this).remove();
      })
   ;
   d3.selectAll("g.node").selectAll(".pattern")
      //.style("pointer-events", "none")
      .on("mouseout", nothing)
      .on("mouseover", nothing)
      .transition()
      .duration(2000)
      .attr("x", function(d) { return d.rx; })
      .attr("y", function(d) { return d.ry; })
      .style("opacity", 0)
      .each("end", function(d) {
         d3.select(this).remove();
      })
   ;

   // select by id
   d3.selectAll("#Header").transition().duration(1500).style("opacity", 0);
}

////////////////////////////////////////////////////////////////////////////////
// Handler for mouseover function, shrink all squares
// execpt for the hovered one
////////////////////////////////////////////////////////////////////////////////
function hoverOn( idx ) {
   d3.selectAll("g.node").selectAll(".pattern")
      .filter(function(d) { return d.id != idx; })
      .transition()
      .duration(500)
      .attr("x", function(d) { return d.x + 20; })
      .attr("y", function(d) { return d.y + 20; })
      .attr("width", function(d) { return d.width - 40; })
      .attr("height", function(d) { return d.height - 40; })
   ;
   d3.selectAll("g.node").selectAll(".coverRect")
      .filter(function(d) { return d.id != idx; })
      .transition()
      .duration(500)
      .attr("x", function(d) { return d.x + 20; })
      .attr("y", function(d) { return d.y + 20; })
      .attr("width", function(d) { return d.width - 40; })
      .attr("height", function(d) { return d.height - 40; })
   ;
}


////////////////////////////////////////////////////////////////////////////////
// Handler for mouseout function, restore default
////////////////////////////////////////////////////////////////////////////////
function hoverOff( idx ) {

   d3.selectAll("g.node").selectAll(".pattern")
      .transition()
      .duration(500)
      .attr("x", function(d) { return d.x+spacing; })
      .attr("y", function(d) { return d.y+spacing; })
      .attr("width", function(d) { return d.width - 2*spacing; })
      .attr("height", function(d) { return d.height - 2*spacing; })
   ;
   d3.selectAll("g.node").selectAll(".coverRect")
      .transition()
      .duration(500)
      .attr("x", function(d) { return d.x; })
      .attr("y", function(d) { return d.y; })
      .attr("width", function(d) { return d.width; })
      .attr("height", function(d) { return d.height; })
   ;
}


////////////////////////////////////////////////////////////////////////////////
// Load the data content from external resources
////////////////////////////////////////////////////////////////////////////////
function loadPage( item ) {
   var resourceURL = item + ".htm";

   d3.select("#contentHeader").html( "" );
   d3.select("#contentFooter").html( "" );

   d3.text( resourceURL, function(d) {
      d3.selectAll("text").remove();   // Remove all text
      d3.select("#contentD3").style("pointer-events", "none");
      d3.select("#pageD3").style("pointer-events", "all");

      var headerString = "";
      headerString += "<a class='pageAnchor' href='javascript:restart()'> Home </a>&nbsp;&nbsp;&nbsp;&nbsp;" ;


      for (var idx = 0; idx < data.length; idx++) {
         var a =  "<a class='pageAnchor' href='javascript:loadPage(\"" + data[idx].ref + "\")'>" + data[idx].label + "</a>&nbsp;&nbsp;&nbsp;&nbsp;" ; 
         var b =  "<span class='blue16b'>" + data[idx].label + "</span>&nbsp;&nbsp;&nbsp;&nbsp;";  
         if (item == data[idx].ref) headerString += b;
         else headerString += a;
      }

      headerString = "";
      headerString += "<ul class='tabrow'>";
      headerString += "<li onClick='restart();'>Home";
      for (var idx = 0; idx < data.length; idx++) {
         if (item == data[idx].ref)  {
            headerString += "<li class='selected'>" + data[idx].label;
         } else {
            headerString += "<li onClick='loadPage(\"" + data[idx].ref + "\")'>" + data[idx].label;
         }
      }
      headerString += "</ul>";




      d3.select("#pageContent").html( d );
      d3.select("#pageHeader").html( headerString );

      //d3.select("#pageHeader").html( "<a class='pageAnchor' href='javascript:restart()'> Back </a>" );
      //d3.select("#pageHeader").html( "<a class='pageAnchorLarge' href='javascript:restart()'><img src='images/gui/left.png'/> Back</a>" );
      //d3.select("#pageFooter").html( "<a class='pageAnchor' href='javascript:restart()'> Back </a>" );
      //d3.select("#pageFooter").html( "<a class='pageAnchorLarge' href='javascript:restart()'><img src='images/gui/left.png'/> Back</a>" );

      d3.select("#pageD3").transition().duration(1500).style("opacity", 1);

      /*
      svgContent.append("rect")
         .attr("x", 0)
         .attr("y", 2000)
         .attr("height", 650)
         .attr("width", 600)
         .attr("fill", d3.rgb(35, 35, 35))
         .style("pointer-events", "none")
         .transition()
         .duration(2000)
         .attr("y", 0)
      ;
       
      svgContent.append("foreignObject")
         .attr("class", "fobj")
         .attr("x", 0)
         .attr("y", 2000)
         .attr("height", 600)
         .attr("width", 600)
         .append("xhtml:body")
         .html( d )
      ;
      d3.selectAll(".fobj").transition().duration(2000).attr("y", 50);
      */

   });
}


////////////////////////////////////////////////////////////////////////////////
// Remove all svg elements and restart the GUI,
// use this when moving back from the content pages
////////////////////////////////////////////////////////////////////////////////
function restart() {
   // Make sure we clean up
   d3.selectAll("g").remove();      // Remove all groups (images and rects)
   d3.selectAll(".coverRect").remove();   // Remove all rects
   d3.selectAll(".fobj").remove();  // Remove content panel
   d3.selectAll("text").remove();   // Remove all text
   d3.selectAll("defs").remove();   // Remove SVG defs

   window.scroll(0, 0);


   // Re-seed
   randomize( data );

   // select by id
   d3.selectAll("#Header").transition().duration(1500).style("opacity", 1);
   d3.select("#pageD3").transition().duration(1500).style("opacity", 0);

   //load();
   SetNavImage();
   moveIn();

   d3.select("#pageD3").style("pointer-events", "none");
   d3.select("#contentD3").style("pointer-events", "all");
}


function initIntroPanel() {
   /*
   d3.text( "intro.html", function(d) {
      d3.select("#Header").html( d );
   });
   */
}


