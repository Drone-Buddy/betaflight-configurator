'use strict';

TABS.gps = {};
TABS.gps.initialize = function (callback) {
    var self = this;

    if (GUI.active_tab !== 'gps') {
        GUI.active_tab = 'gps';
    }

    function load_html() {
        $('#content').load("./tabs/gps.html", process_html);
    }

    MSP.send_message(MSPCodes.MSP_STATUS, false, false, load_html);
    
    function set_online(){
        $('#connect').hide();
        $('#waiting').show();
        $('#loadmap').hide();
    }
    
    function set_offline(){
        $('#connect').show();
        $('#waiting').hide();
        $('#loadmap').hide();
    }
    
    function process_html() {
        // translate to user-selected languageconsole.log('Online');
        i18n.localizePage();

        function get_raw_gps_data() {
            MSP.send_message(MSPCodes.MSP_RAW_GPS, false, false, get_comp_gps_data);
        }

        function get_comp_gps_data() {
            MSP.send_message(MSPCodes.MSP_COMP_GPS, false, false, get_gps_sv_info_data);
        }

        function get_gps_sv_info_data() {
            MSP.send_message(MSPCodes.MSP_GPS_SV_INFO, false, false, get_raw_aux_gps_data);
        }

        function get_raw_aux_gps_data() {
            MSP.send_message(MSPCodes.MSP_RAW_AUX_GPS, false, false, get_comp_aux_gps_data);
        }

        function get_comp_aux_gps_data() {
            MSP.send_message(MSPCodes.MSP_COMP_AUX_GPS, false, false, get_aux_gps_sv_info_data);
        }

        function get_aux_gps_sv_info_data() {
            MSP.send_message(MSPCodes.MSP_AUX_GPS_SV_INFO, false, false, update_ui);
        }


        // To not flicker the divs while the fix is unstable
        var gpsWasFixed = false;

        function update_ui() {
            var lat = GPS_DATA.lat / 10000000;
            var lon = GPS_DATA.lon / 10000000;
            var url = 'https://maps.google.com/?q=' + lat + ',' + lon;
            var alt = GPS_DATA.alt;
            
            var auxLat = AUX_GPS_DATA.lat / 10000000;
            var auxLon = AUX_GPS_DATA.lon / 10000000;
            var auxUrl = 'https://maps.google.com/?q=' + auxLat + ',' + auxLon;
            var auxAlt = AUX_GPS_DATA.alt;

            if (semver.lt(CONFIG.apiVersion, "1.39.0")) {
                alt = alt / 10;
            }

            $('.GPS_info td.fix').html((GPS_DATA.fix) ? i18n.getMessage('gpsFixTrue') : i18n.getMessage('gpsFixFalse'));
            $('.GPS_info td.alt').text(alt + ' m');
            $('.GPS_info td.lat a').prop('href', url).text(lat.toFixed(4) + ' deg');
            $('.GPS_info td.lon a').prop('href', url).text(lon.toFixed(4) + ' deg');
            $('.GPS_info td.speed').text(GPS_DATA.speed + ' cm/s');
            $('.GPS_info td.sats').text(GPS_DATA.numSat);
            $('.GPS_info td.distToHome').text(GPS_DATA.distanceToHome + ' m');

            $('.GPS_info td.auxFix').html((AUX_GPS_DATA.fix) ? i18n.getMessage('gpsFixTrue') : i18n.getMessage('gpsFixFalse'));
            $('.GPS_info td.auxAlt').text(auxAlt + ' m');
            $('.GPS_info td.auxLat a').prop('href', auxUrl).text(auxLat.toFixed(4) + ' deg');
            $('.GPS_info td.auxLon a').prop('href', auxUrl).text(auxLon.toFixed(4) + ' deg');
            $('.GPS_info td.auxSpeed').text(AUX_GPS_DATA.speed + ' cm/s');
            $('.GPS_info td.auxSats').text(AUX_GPS_DATA.numSat);
            $('.GPS_info td.auxDistToHome').text(AUX_GPS_DATA.distanceToHome + ' m');

            // Update GPS Signal Strengths
            var e_ss_table = $('div.GPS_signal_strength table tr:not(.titles)');

            for (var i = 0; i < GPS_DATA.chn.length; i++) {
                var row = e_ss_table.eq(i);

                $('td', row).eq(0).text(GPS_DATA.svid[i]);
                $('td', row).eq(1).text(GPS_DATA.quality[i]);
                $('td', row).eq(2).find('progress').val(GPS_DATA.cno[i]);
            }

            var e_aux_ss_table = $('div.aux_GPS_signal_strength table tr:not(.titles)');

            for (var i = 0; i < AUX_GPS_DATA.chn.length; i++) {
                var row = e_aux_ss_table.eq(i);

                $('td', row).eq(0).text(AUX_GPS_DATA.svid[i]);
                $('td', row).eq(1).text(AUX_GPS_DATA.quality[i]);
                $('td', row).eq(2).find('progress').val(AUX_GPS_DATA.cno[i]);
            }
            

            var message = {
                action: 'center',
                lat: GPS_DATA.fix ? lat : auxLat,
                lon: GPS_DATA.fix ? lon : auxLon
            };

            var frame = document.getElementById('map');
            if (navigator.onLine) {
                $('#connect').hide();

                if (GPS_DATA.fix || AUX_GPS_DATA.fix) {
                   gpsWasFixed = true;
                   frame.contentWindow.postMessage(message, '*');
                   $('#loadmap').show();
                   $('#waiting').hide();
                } else if (!gpsWasFixed) {
                   $('#loadmap').hide();
                   $('#waiting').show();
                } else {
                    message.action = 'nofix';
                    frame.contentWindow.postMessage(message, '*');
                }
            } else {
                gpsWasFixed = false;
                $('#connect').show();
                $('#waiting').hide(); 
                $('#loadmap').hide();
            }
        }

        // enable data pulling
        GUI.interval_add('gps_pull', function gps_update() {
            // avoid usage of the GPS commands until a GPS sensor is detected for targets that are compiled without GPS support.
            if (!have_sensor(CONFIG.activeSensors, 'gps')) {
                //return;
            }
            
            get_raw_gps_data();
        }, 75, true);

        // status data pulled via separate timer with static speed
        GUI.interval_add('status_pull', function status_pull() {
            MSP.send_message(MSPCodes.MSP_STATUS);
        }, 250, true);


        //check for internet connection on load
        if (navigator.onLine) {
            console.log('Online');
            set_online();
        } else {
            console.log('Offline');
            set_offline();
        }

        $("#check").on('click',function(){
            if (navigator.onLine) {
                console.log('Online');
                set_online();
            } else {
                console.log('Offline');
                set_offline();
            }
        });

        var frame = document.getElementById('map');

        $('#zoom_in').click(function() {
            console.log('zoom in');
            var message = {
                action: 'zoom_in'
            };
            frame.contentWindow.postMessage(message, '*');
        });
        
        $('#zoom_out').click(function() {
            console.log('zoom out');
            var message = {
                action: 'zoom_out'
            };
            frame.contentWindow.postMessage(message, '*');
        });
 
        GUI.content_ready(callback);
    }

};


 
TABS.gps.cleanup = function (callback) {
    if (callback) callback();
};
