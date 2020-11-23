const DEFAULT_ZOOM = 16,
      DEFAULT_LON = 0,
      DEFAULT_LAT = 0,
      ICON_IMAGE = '/images/icons/cf_icon_position.png',
      ICON_IMAGE_NOFIX = '/images/icons/cf_icon_position_nofix.png',
      AUX_ICON_IMAGE = '/images/icons/cf_icon_position_user.png';

var iconGeometry,
    map,
    mapView,
    iconStyle,
    iconStyleNoFix,
    auxIconStyle,
    iconFeature,
    auxIconFeature;

window.onload = initializeMap;

function initializeMap() {

    var lonLat = ol.proj.fromLonLat([DEFAULT_LON, DEFAULT_LAT]);

    mapView = new ol.View({
                        center: lonLat,
                        zoom: DEFAULT_ZOOM
                      });

    map = new ol.Map({
        target: 'map-canvas',
        layers: [
          new ol.layer.Tile({
            source: new ol.source.OSM()
          })
        ],
        view: mapView,
        controls: []
      });

    var icon = new ol.style.Icon(({
        anchor: [0.5, 1],
        opacity: 1,
        scale: 0.5,
        src: ICON_IMAGE
    }));

    var iconNoFix = new ol.style.Icon(({
        anchor: [0.5, 1],
        opacity: 1,
        scale: 0.5,
        src: ICON_IMAGE_NOFIX
    }));

    var auxIcon = new ol.style.Icon(({
        anchor: [0.5, 1],
        opacity: 1,
        scale: 0.5,
        src: AUX_ICON_IMAGE
    }));

    var auxIconNoFix = new ol.style.Icon(({
        anchor: [0.5, 1],
        opacity: 0,
        scale: 0.5,
        src: AUX_ICON_IMAGE
    }));

    iconStyle = new ol.style.Style({
        image: icon 
    });

    iconStyleNoFix = new ol.style.Style({
        image: iconNoFix
    });

    auxIconStyle = new ol.style.Style({
        image: auxIcon 
    });

    auxIconStyleNoFix = new ol.style.Style({
        image: auxIconNoFix
    });

    iconGeometry = new ol.geom.Point(lonLat);
    iconFeature = new ol.Feature({
        geometry: iconGeometry
    });

    iconFeature.setStyle(iconStyle);

    auxIconGeometry = new ol.geom.Point(lonLat);
    auxIconFeature = new ol.Feature({
        geometry: auxIconGeometry
    });

    auxIconFeature.setStyle(auxIconStyle);

    var vectorSource = new ol.source.Vector({
        features: [iconFeature]
    });

    var auxVectorSource = new ol.source.Vector({
        features: [auxIconFeature]
    });

    var currentPositionLayer = new ol.layer.Vector({
        source: vectorSource
    });

    var auxCurrentPositionLayer = new ol.layer.Vector({
        source: auxVectorSource
    });

    map.addLayer(currentPositionLayer);
    map.addLayer(auxCurrentPositionLayer);

    window.addEventListener('message', processMapEvents); 
}

function processMapEvents(e) {
    try {
          switch(e.data.action) {
          case 'zoom_in':            
              mapView.setZoom(mapView.getZoom() + 1);
              break;

          case 'zoom_out':
              mapView.setZoom(mapView.getZoom() - 1);
              break;

          case 'center':
              var center = ol.proj.fromLonLat([e.data.lon, e.data.lat]);
              mapView.setCenter(center);
              break;

          case 'fix':
              iconFeature.setStyle(iconStyle);
              var loc = ol.proj.fromLonLat([e.data.lon, e.data.lat]);
              iconGeometry.setCoordinates(loc);
              break;

          case 'nofix':
              iconFeature.setStyle(iconStyleNoFix);
              break;

          case 'aux_fix':
              auxIconFeature.setStyle(auxIconStyle);
              var loc = ol.proj.fromLonLat([e.data.lon, e.data.lat]);
              auxIconGeometry.setCoordinates(loc);
              break;

          case 'aux_no_fix':
              auxIconFeature.setStyle(auxIconStyleNoFix);
              break;

          }
    } catch (e) {
        console.log('Map error ' + e);
    }
}
