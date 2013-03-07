////////////////////////////////////////////////////////////////////////////////
// Some wrappers for googlemap
////////////////////////////////////////////////////////////////////////////////


////////////////////////////////////////////////////////////////////////////////
// Global accessible vars, use as is, do not do weird things with them
////////////////////////////////////////////////////////////////////////////////
var g_map;       // Google map instance
var g_places;    // Google places service instance
var g_start =  new google.maps.LatLng(43.76, -79.34); // Roughly around Toronto
var g_infoWindow;

var g_searchRadius = 300;

var g_segment = 800;
var g_search = new Array();
var g_markers = new Array();
var g_mousedown = false;
var g_annotate = false;

var g_polyline = new Array(); // A global array for holding polyline objects
var g_POI      = new Array();


////////////////////////////////////////////////////////////////////////////////
// Temporary variables that need to be accessed at the global scope
////////////////////////////////////////////////////////////////////////////////
var current_polyline;               
var current_path;

var current_location;               // The current location, (latitute and longtitute)
var current_coord = new Array();    // An array of locations use to search POI
var current_POI   = new Array();    // An array of poi assocated with the current path


////////////////////////////////////////////////////////////////////////////////
// Find the mid point between 2 sets of coordinates in
// latitude and longtitude
////////////////////////////////////////////////////////////////////////////////
function midPoint( lat1, lon1, lat2, lon2) {
   var dlon = (lon2 - lon1) * Math.PI / 180.0;

   // Convert to radians
   var rlat1 = lat1 * Math.PI / 180.0;
   var rlat2 = lat2 * Math.PI / 180.0;
   var rlon1 = lon1 * Math.PI / 180.0;
   var rlon2 = lon2 * Math.PI / 180.0;

   var bx = Math.cos( rlat2 ) * Math.cos( dlon );
   var by = Math.cos( rlat2 ) * Math.sin( dlon );

   var lat3 = Math.atan2(Math.sin(rlat1) + Math.sin(rlat2), Math.sqrt((Math.cos(rlat1) + bx) * (Math.cos(rlat1) + bx) + by * by));
   var lon3 = rlon1 + Math.atan2(by, Math.cos(rlat1) + bx);

   // Convert back to degrees
   lat3 *= 180/Math.PI;
   lon3 *= 180/Math.PI;

   return new google.maps.LatLng( lat3, lon3 );
}


////////////////////////////////////////////////////////////////////////////////
// Find the distance between two coordinate points
// Use the google built-in function
////////////////////////////////////////////////////////////////////////////////
function distance( a, b ) {
   return google.maps.geometry.spherical.computeDistanceBetween(a, b);
}


////////////////////////////////////////////////////////////////////////////////
// Place a point-of-interest, mark the POI with a green maker 
////////////////////////////////////////////////////////////////////////////////
function placePOI( place ) {
console.log( place );
   var poiMarker = new google.maps.Marker({
      //map: g_map,
      map: g_map,
      position: place.geometry.location,
   });
   iconFile = 'http://maps.google.com/mapfiles/ms/icons/green-dot.png'; 
   poiMarker.setIcon(iconFile) 

/*
   var poiMarker = new google.maps.Circle({
      center: place.geometry.location,
      radius: 25,
      strokeColor: "#FF00FF",
      strokeOpacity: 0.8,
      strokeWeight: 1.0,
      fillColor: "#0000FF",
      fillOpacity: 0.8,
      map: g_map
   });
   */



   current_POI.push( {marker:poiMarker, place:place} );

   // Add a listener to display the name on click event
   google.maps.event.addListener(poiMarker, 'click', function() {
      //g_infoWindow.setContent(place.name);
      //g_infoWindow.open(g_map, this);
   });

   return placeMarker;
}


////////////////////////////////////////////////////////////////////////////////
// Place a generic marker
////////////////////////////////////////////////////////////////////////////////
function placeMarker( markerLocation ) {
   var marker = new google.maps.Marker({
      position: markerLocation,
      map: g_map,
   });

   google.maps.event.addListener(marker, "mouseup", function(e) {
      console.log("mouse up"); 
      g_mousedown = false;
   });
   g_markers.push( marker );
}


////////////////////////////////////////////////////////////////////////////////
// Show marker overlays
////////////////////////////////////////////////////////////////////////////////
function showMarkers() {
   for (var i=0; i < g_markers.length; i++) {
      g_markers[i].setMap(g_map);
   }
}

////////////////////////////////////////////////////////////////////////////////
// Hide marker overlays
////////////////////////////////////////////////////////////////////////////////
function hideMarkers() {
   for (var i=0; i < g_markers.length; i++) {
      g_markers[i].setMap(null);
   }
}


////////////////////////////////////////////////////////////////////////////////
// Clear all marker overlay and remove them as well 
////////////////////////////////////////////////////////////////////////////////
function clearMarkers() {
   /*
   hideMarkers();
   g_markers = new Array();
   */

   if (g_POI.length == 0 && g_polyline.length == 0) return;
   if (g_POI.length != g_polyline.length) {
      alert("Doh!, something really weird just happened. Refresh page!!!");
   }


   // Clear the last path POI
   var lastPOI = g_POI.pop();
   for (var i=0; i < lastPOI.length; i++) {
      lastPOI[i].marker.setMap(null);
   }
   lastPOI = null;

   // Clear the last path
   var lastPath = g_polyline.pop();
   lastPath.setMap(null);
   lastPath = null;



}


////////////////////////////////////////////////////////////////////////////////
// Handle a click
////////////////////////////////////////////////////////////////////////////////
function handleClick( clickLocation ) {
   //console.log("in handle click..." + clickLocation);
   //placeMarker( clickLocation );
}



////////////////////////////////////////////////////////////////////////////////
// Flip annotation mode
////////////////////////////////////////////////////////////////////////////////
function checkAnnotate() {
   if (g_annotate == false) {
      console.log("going into annotation mode");
      g_annotate = true;
      g_map.setOptions( {draggable: false} );
      document.getElementById("mode").value = "Annotate";
   } else {
      console.log("going into normal mode");
      g_annotate = false;
      g_map.setOptions( {draggable:true});
      document.getElementById("mode").value = "Normal";
   }
}


////////////////////////////////////////////////////////////////////////////////
// Mark the points of interests
// This is a recursive function with a timeout, in order to comply with 
// google's usage policy (it blocks the request is there are too many at the 
// same time)
////////////////////////////////////////////////////////////////////////////////
function searchPOI( idx ) {
   var request = {
      location: current_coord[idx],
      radius: g_searchRadius, 
      types: ['food']
   }   

   var num = 0.0;

   // Use the places services to search for point of interest
   g_places.nearbySearch(request, function(result, stat) {
      console.log( "Status: " + stat + " | " + result.length);
      for (var i=0; i < result.length; i++) {
         placePOI( result[i] );
         fillInfo( result[i] );
      }
      num = result.length;

      // Experimental: Set a colour based on the number of things found by the service
      if (num > 25) num = 25.0;
      num /= 25.0;
      console.log(num);
      var circle = new google.maps.Circle({
         center: current_coord[idx],
         radius: 250,
         strokeColor: "#FF0000",
         strokeOpacity: 0.5,
         strokeWeight: 1.5,
         fillColor: "#FF1111",
         //fillOpacity: 0.35,
         fillOpacity: num,
         map: g_map
      });

   });



   if (idx < current_coord.length - 1) {
      setTimeout( function() { searchPOI(++idx); }, 500);
   } else {
      console.log("blah");
      storePoiAndPath();
   }
}



////////////////////////////////////////////////////////////////////////////////
// Clean up 
////////////////////////////////////////////////////////////////////////////////
function storePoiAndPath() {
   if (current_POI.length < 1) {
      g_POI.push( new Array() );
   } else {
      g_POI.push( current_POI );
   }
   g_polyline.push( current_polyline );
}



////////////////////////////////////////////////////////////////////////////////
// Fill out the POI infos in text formad
////////////////////////////////////////////////////////////////////////////////
function fillInfo( place ) {

   document.getElementById("textBox").innerHTML += place.name;
   document.getElementById("textBox").innerHTML += "&nbsp;("+place.vicinity+")";
   document.getElementById("textBox").innerHTML += "</br>";
}


////////////////////////////////////////////////////////////////////////////////
// Initialize the map
////////////////////////////////////////////////////////////////////////////////
function initialize() {
   var mapOptions = {
      center: g_start,
      zoom: 10,
      mapTypeId: google.maps.MapTypeId.ROADMAP,
   }

   g_map    = new google.maps.Map(document.getElementById("map_canvas"), mapOptions);
   g_places = new google.maps.places.PlacesService(g_map); 
   g_infoWindow = new google.maps.InfoWindow();

   google.maps.event.addListener(g_map, "click", function(e) {
      handleClick( e.latLng );
   });



   ////////////////////////////////////////////////////////////////////////////////
   // Handles the mouse down event on the map
   // 1) Start the polyline instance 
   ////////////////////////////////////////////////////////////////////////////////
   google.maps.event.addListener(g_map, "mousedown", function(e) {
      console.log("mouse down"); 
      g_mousedown = true;
      if (g_annotate == true) {

         // Reset temporary vars
         current_coord = new Array();
         current_POI = new Array();



         var polyOptions = {
            strokeColor: 'blue',
            strokeOpacity: 0.5,
            strokeWeight: 3
         }

         // Set up a polyline instance
         current_polyline = new google.maps.Polyline(polyOptions);
         current_polyline.setMap(g_map);
         current_path = current_polyline.getPath();

         current_coord.push( e.latLng );
         current_location = e.latLng;


         // Create an event handler for finishing the path
         google.maps.event.addListener(current_polyline, "mouseup", function(e) {
            g_mousedown = false;

            // add in the last point regardless of position
            current_coord.push( e.latLng );

            // Now kick off a search
            searchPOI( 0 );

         });

      }
   });


   ////////////////////////////////////////////////////////////////////////////////
   // Handles the mouse up event on the map
   // 1) Store the poly line instance
   ////////////////////////////////////////////////////////////////////////////////
   google.maps.event.addListener(g_map, "mouseup", function(e) {
      console.log("mouse up map"); 
      g_mousedown = false;

      
      if (g_annotate == true) {
         // Store the path into the global var
      }


   });


   ////////////////////////////////////////////////////////////////////////////////
   // Handles the mouse move event on the map
   // 1) Update the current polyline and calculate POI coordinates
   ////////////////////////////////////////////////////////////////////////////////
   google.maps.event.addListener(g_map, "mousemove", function(e) {
      if (g_mousedown == true && g_annotate == true) {
         //placeMarker( e.latLng );
         current_path.push( e.latLng );

         if (distance( current_location, e.latLng) >= 2.0*g_searchRadius) {
            current_coord.push( e.latLng );
            current_location = e.latLng;
         }


      }
   });



}


